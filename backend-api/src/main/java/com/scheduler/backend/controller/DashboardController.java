package com.scheduler.backend.controller;

import com.scheduler.backend.dto.DashboardStats;
import com.scheduler.core.entity.JobStatus;
import com.scheduler.core.entity.WorkerStatus;
import com.scheduler.core.repository.DeadLetterQueueRepository;
import com.scheduler.core.repository.JobExecutionRepository;
import com.scheduler.core.repository.JobRepository;
import com.scheduler.core.repository.WorkerRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private JobExecutionRepository jobExecutionRepository;

    @Autowired
    private DeadLetterQueueRepository deadLetterQueueRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        long totalJobs = jobRepository.count();
        long queuedJobs = jobRepository.countByStatus(JobStatus.QUEUED) 
                + jobRepository.countByStatus(JobStatus.SCHEDULED) 
                + jobRepository.countByStatus(JobStatus.RETRY);
        long runningJobs = jobRepository.countByStatus(JobStatus.RUNNING) 
                + jobRepository.countByStatus(JobStatus.CLAIMED);
        long completedJobs = jobRepository.countCompletedJobs();
        long failedJobs = jobRepository.countFailedJobs();
        long dlqJobs = deadLetterQueueRepository.count();
        long activeWorkers = workerRepository.findByStatus(WorkerStatus.ACTIVE).size();

        Double avgDuration = jobExecutionRepository.getAverageDurationMs();
        if (avgDuration == null) {
            avgDuration = 0.0;
        }

        // Fetch jobs by queue
        Map<String, Long> jobsByQueue = new HashMap<>();
        List<Object[]> queueStats = entityManager.createQuery(
                "SELECT q.name, COUNT(j) FROM Job j JOIN j.queue q GROUP BY q.name", Object[].class)
                .getResultList();
        for (Object[] row : queueStats) {
            jobsByQueue.put((String) row[0], (Long) row[1]);
        }

        // Fetch execution statuses counts
        Map<String, Long> executionsOverTime = new HashMap<>();
        List<Object[]> execStats = entityManager.createNativeQuery(
                "SELECT DATE_FORMAT(started_at, '%Y-%m-%d %H:00'), COUNT(*) " +
                "FROM job_executions " +
                "WHERE started_at >= NOW() - INTERVAL 24 HOUR " +
                "GROUP BY DATE_FORMAT(started_at, '%Y-%m-%d %H:00') " +
                "ORDER BY DATE_FORMAT(started_at, '%Y-%m-%d %H:00') ASC")
                .getResultList();
        for (Object[] row : execStats) {
            executionsOverTime.put((String) row[0], ((Number) row[1]).longValue());
        }

        DashboardStats stats = DashboardStats.builder()
                .totalJobs(totalJobs)
                .queuedJobs(queuedJobs)
                .runningJobs(runningJobs)
                .completedJobs(completedJobs)
                .failedJobs(failedJobs)
                .dlqJobs(dlqJobs)
                .activeWorkers(activeWorkers)
                .averageExecutionTimeMs(avgDuration)
                .jobsByQueue(jobsByQueue)
                .executionsOverTime(executionsOverTime)
                .build();

        return ResponseEntity.ok(stats);
    }
}
