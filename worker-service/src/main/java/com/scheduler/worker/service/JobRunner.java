package com.scheduler.worker.service;

import com.scheduler.core.entity.Job;
import com.scheduler.core.entity.JobExecution;
import com.scheduler.core.entity.RetryPolicy;
import com.scheduler.core.entity.RetryStrategy;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.UUID;

@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class JobRunner implements Runnable {
    private static final Logger logger = LoggerFactory.getLogger(JobRunner.class);

    @Setter
    private Job job;

    @Setter
    private JobExecutionEngine engine;

    @Autowired
    private JobTransactionService transactionService;

    @Autowired
    private WorkerRegistration workerRegistration;

    @Override
    public void run() {
        if (job == null || engine == null) {
            logger.error("JobRunner not properly initialized.");
            return;
        }

        long startTime = System.currentTimeMillis();
        JobExecution execution = null;

        try {
            // Step 1: Transition status to RUNNING and save execution log
            execution = transactionService.startExecution(job.getId(), workerRegistration.getRegisteredWorker());
            
            // Step 2: Execute Job logic simulation
            executeJobPayload(job.getPayload());

            // Step 3: Job completed successfully
            long duration = System.currentTimeMillis() - startTime;
            transactionService.completeExecution(job.getId(), execution.getId(), duration);
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            logger.warn("Job execution failed. ID: {}, Error: {}", job.getId(), errorMsg);

            // Step 4: Handle failure and retries
            UUID execId = (execution != null) ? execution.getId() : null;
            handleFailure(job, execId, errorMsg, duration);
        } finally {
            engine.getActiveJobsCount().decrementAndGet();
        }
    }

    private void executeJobPayload(String payload) throws Exception {
        // Simple simulator based on JSON content
        int sleepMs = 500;
        if (payload != null) {
            if (payload.contains("\"duration\":")) {
                // parse value of duration e.g. "duration": 2000
                String search = "\"duration\":";
                int idx = payload.indexOf(search);
                int endIdx = payload.indexOf(",", idx);
                if (endIdx == -1) {
                    endIdx = payload.indexOf("}", idx);
                }
                if (idx != -1 && endIdx != -1) {
                    try {
                        String val = payload.substring(idx + search.length(), endIdx).trim();
                        sleepMs = Integer.parseInt(val);
                    } catch (Exception e) {
                        logger.debug("Failed parsing sleep duration: {}", e.getMessage());
                    }
                }
            }

            if (payload.contains("\"fail\":true") || payload.contains("\"fail\": true")) {
                Thread.sleep(sleepMs);
                throw new RuntimeException("Simulated job failure based on payload directive.");
            }
        }

        // Simulate execution computation
        Thread.sleep(sleepMs);
    }

    private void handleFailure(Job failedJob, UUID executionId, String errorMsg, long duration) {
        int nextRetryNumber = failedJob.getRetryCount() + 1;
        int maxRetries = failedJob.getMaxRetries();

        if (nextRetryNumber <= maxRetries) {
            // Apply Retry Strategy Backoff
            long backoffMs = 1000; // default 1s
            RetryStrategy strategy = RetryStrategy.FIXED;

            RetryPolicy policy = failedJob.getRetryPolicy();
            if (policy != null) {
                backoffMs = policy.getBackoffMs();
                strategy = policy.getStrategy();
            }

            long calculatedDelay = backoffMs;
            if (strategy == RetryStrategy.LINEAR) {
                calculatedDelay = backoffMs * nextRetryNumber;
            } else if (strategy == RetryStrategy.EXPONENTIAL) {
                calculatedDelay = (long) (backoffMs * Math.pow(2, nextRetryNumber - 1));
            }

            OffsetDateTime nextRunAt = OffsetDateTime.now().plusWeeks(0).plusSeconds(calculatedDelay / 1000);
            if (calculatedDelay % 1000 > 0) {
                nextRunAt = nextRunAt.plusNanos((calculatedDelay % 1000) * 1000000);
            }

            transactionService.failAndReschedule(failedJob.getId(), executionId, errorMsg, nextRunAt, duration);
        } else {
            // Max retries exhausted -> Move to DLQ
            transactionService.failAndSendToDlq(failedJob.getId(), executionId, errorMsg, duration);
        }
    }
}
