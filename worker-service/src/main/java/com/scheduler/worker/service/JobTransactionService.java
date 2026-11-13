package com.scheduler.worker.service;

import com.scheduler.core.entity.*;
import com.scheduler.core.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class JobTransactionService {
    private static final Logger logger = LoggerFactory.getLogger(JobTransactionService.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobExecutionRepository jobExecutionRepository;

    @Autowired
    private DeadLetterQueueRepository deadLetterQueueRepository;

    @Autowired
    private JobLogRepository jobLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public JobExecution startExecution(UUID jobId, Worker worker) {
        Job job = jobRepository.findById(jobId).orElseThrow();
        job.setStatus(JobStatus.RUNNING);
        job.setWorker(worker);
        jobRepository.save(job);

        JobExecution execution = JobExecution.builder()
                .job(job)
                .worker(worker)
                .status("RUNNING")
                .retryNumber(job.getRetryCount())
                .build();
        JobExecution savedExecution = jobExecutionRepository.save(execution);

        writeLog(job, savedExecution, "INFO", "Job execution started on worker thread.");
        return savedExecution;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void completeExecution(UUID jobId, UUID executionId, long durationMs) {
        Job job = jobRepository.findById(jobId).orElseThrow();
        JobExecution execution = jobExecutionRepository.findById(executionId).orElseThrow();

        execution.setStatus("COMPLETED");
        execution.setFinishedAt(OffsetDateTime.now());
        execution.setDurationMs(durationMs);
        jobExecutionRepository.save(execution);

        writeLog(job, execution, "INFO", "Job execution completed successfully in " + durationMs + "ms.");

        // Check if recurring cron job
        if (job.getCronExpression() != null) {
            CronExpression cron = CronExpression.parse(job.getCronExpression());
            OffsetDateTime nextRun = cron.next(OffsetDateTime.now());
            
            job.setStatus(JobStatus.SCHEDULED);
            job.setRunAt(nextRun);
            job.setRetryCount(0); // Reset retry count for the next occurrence
            job.setWorker(null);
            jobRepository.save(job);

            writeLog(job, execution, "INFO", "Recurring Cron job rescheduled. Next run time: " + nextRun);
        } else {
            job.setStatus(JobStatus.COMPLETED);
            job.setWorker(null);
            jobRepository.save(job);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void failAndReschedule(UUID jobId, UUID executionId, String error, OffsetDateTime nextRunAt, long durationMs) {
        Job job = jobRepository.findById(jobId).orElseThrow();
        JobExecution execution = jobExecutionRepository.findById(executionId).orElseThrow();

        execution.setStatus("FAILED");
        execution.setFinishedAt(OffsetDateTime.now());
        execution.setDurationMs(durationMs);
        execution.setErrorMessage(error);
        jobExecutionRepository.save(execution);

        writeLog(job, execution, "WARNING", "Execution failed: " + error);

        job.setStatus(JobStatus.RETRY);
        job.setRetryCount(job.getRetryCount() + 1);
        job.setRunAt(nextRunAt);
        job.setWorker(null);
        jobRepository.save(job);

        writeLog(job, execution, "INFO", "Job scheduled for retry #" + job.getRetryCount() + " at: " + nextRunAt);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void failAndSendToDlq(UUID jobId, UUID executionId, String error, long durationMs) {
        Job job = jobRepository.findById(jobId).orElseThrow();
        JobExecution execution = jobExecutionRepository.findById(executionId).orElseThrow();

        execution.setStatus("FAILED");
        execution.setFinishedAt(OffsetDateTime.now());
        execution.setDurationMs(durationMs);
        execution.setErrorMessage(error);
        jobExecutionRepository.save(execution);

        writeLog(job, execution, "ERROR", "Job permanently failed after exhausting all retries. Error: " + error);

        job.setStatus(JobStatus.DLQ);
        job.setWorker(null);
        jobRepository.save(job);

        // Put into DLQ table
        DeadLetterQueue dlq = DeadLetterQueue.builder()
                .job(job)
                .originalQueue(job.getQueue())
                .reason(error)
                .build();
        deadLetterQueueRepository.save(dlq);
        
        writeLog(job, execution, "ERROR", "Job routed to Dead Letter Queue (DLQ).");
    }

    public void writeLog(Job job, JobExecution execution, String level, String message) {
        JobLog log = JobLog.builder()
                .job(job)
                .execution(execution)
                .logLevel(level)
                .message(message)
                .timestamp(OffsetDateTime.now())
                .build();
        jobLogRepository.save(log);
    }
}
