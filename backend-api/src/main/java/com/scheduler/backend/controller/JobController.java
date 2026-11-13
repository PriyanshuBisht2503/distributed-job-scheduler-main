package com.scheduler.backend.controller;

import com.scheduler.backend.dto.JobRequest;
import com.scheduler.backend.dto.JobResponse;
import com.scheduler.backend.exception.ResourceNotFoundException;
import com.scheduler.core.entity.*;
import com.scheduler.core.repository.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class JobController {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private QueueRepository queueRepository;

    @Autowired
    private RetryPolicyRepository retryPolicyRepository;

    @Autowired
    private JobExecutionRepository jobExecutionRepository;

    @Autowired
    private DeadLetterQueueRepository deadLetterQueueRepository;

    @Autowired
    private JobLogRepository jobLogRepository;

    @PostMapping
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DEVELOPER')")
    public ResponseEntity<?> submitJob(@Valid @RequestBody JobRequest request) {
        Queue queue = queueRepository.findById(request.getQueueId())
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));

        RetryPolicy retryPolicy = null;
        if (request.getRetryPolicyId() != null) {
            retryPolicy = retryPolicyRepository.findById(request.getRetryPolicyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Retry policy not found"));
        }

        Job parentJob = null;
        if (request.getParentJobId() != null) {
            parentJob = jobRepository.findById(request.getParentJobId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent job not found"));
        }

        OffsetDateTime runAt = OffsetDateTime.now();
        JobStatus status = JobStatus.QUEUED;

        // 1. Delayed Jobs
        if (request.getDelaySeconds() != null && request.getDelaySeconds() > 0) {
            runAt = OffsetDateTime.now().plusSeconds(request.getDelaySeconds());
            status = JobStatus.SCHEDULED;
        }

        // 2. Cron Jobs
        if (request.getCronExpression() != null) {
            if (!CronExpression.isValidExpression(request.getCronExpression())) {
                return ResponseEntity.badRequest().body("Invalid cron expression");
            }
            CronExpression expression = CronExpression.parse(request.getCronExpression());
            runAt = expression.next(OffsetDateTime.now());
            status = JobStatus.SCHEDULED;
        }

        Job job = Job.builder()
                .name(request.getName())
                .queue(queue)
                .status(status)
                .payload(request.getPayload())
                .priority(request.getPriority())
                .runAt(runAt)
                .cronExpression(request.getCronExpression())
                .retryPolicy(retryPolicy)
                .maxRetries(request.getMaxRetries() != null ? request.getMaxRetries() : 3)
                .parentJob(parentJob)
                .build();

        Job saved = jobRepository.save(job);

        // Audit log
        JobLog log = JobLog.builder()
                .job(saved)
                .logLevel("INFO")
                .message("Job submitted with initial status: " + status + ", scheduled execution: " + runAt)
                .timestamp(OffsetDateTime.now())
                .build();
        jobLogRepository.save(log);

        return ResponseEntity.ok(JobResponse.fromEntity(saved));
    }

    @GetMapping
    public ResponseEntity<Page<JobResponse>> getJobs(
            @RequestParam(required = false) UUID queueId,
            @RequestParam(required = false) JobStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Job> jobsPage;

        if (queueId != null) {
            jobsPage = jobRepository.findByQueueId(queueId, pageable);
        } else if (status != null) {
            jobsPage = jobRepository.findByStatus(status, pageable);
        } else {
            jobsPage = jobRepository.findAll(pageable);
        }

        Page<JobResponse> responsePage = jobsPage.map(JobResponse::fromEntity);
        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getJobById(@PathVariable UUID id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        return ResponseEntity.ok(JobResponse.fromEntity(job));
    }

    @GetMapping("/{id}/executions")
    public ResponseEntity<List<JobExecution>> getJobExecutions(@PathVariable UUID id) {
        return ResponseEntity.ok(jobExecutionRepository.findByJobIdOrderByStartedAtDesc(id));
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<JobLog>> getJobLogs(@PathVariable UUID id) {
        return ResponseEntity.ok(jobLogRepository.findByJobIdOrderByTimestampAsc(id));
    }

    @PostMapping("/{id}/retry")
    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DEVELOPER')")
    public ResponseEntity<?> retryJob(@PathVariable UUID id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));

        if (job.getStatus() != JobStatus.FAILED && job.getStatus() != JobStatus.DLQ) {
            return ResponseEntity.badRequest().body("Only failed or DLQ jobs can be retried.");
        }

        // Remove from DLQ if present
        deadLetterQueueRepository.findByJobId(id).ifPresent(dlq -> deadLetterQueueRepository.delete(dlq));

        job.setStatus(JobStatus.QUEUED);
        job.setRetryCount(0);
        job.setRunAt(OffsetDateTime.now());
        job.setWorker(null);
        Job saved = jobRepository.save(job);

        JobLog log = JobLog.builder()
                .job(saved)
                .logLevel("INFO")
                .message("Job manually reset for retry execution.")
                .timestamp(OffsetDateTime.now())
                .build();
        jobLogRepository.save(log);

        return ResponseEntity.ok(JobResponse.fromEntity(saved));
    }

    @GetMapping("/dlq")
    public ResponseEntity<Page<DeadLetterQueue>> getDeadLetterQueue(
            @RequestParam(required = false) UUID queueId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("failedAt").descending());
        
        if (queueId != null) {
            return ResponseEntity.ok(deadLetterQueueRepository.findByOriginalQueueId(queueId, pageable));
        }
        return ResponseEntity.ok(deadLetterQueueRepository.findAll(pageable));
    }
}
