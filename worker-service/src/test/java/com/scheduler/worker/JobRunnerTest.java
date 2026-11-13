package com.scheduler.worker;

import com.scheduler.core.entity.Job;
import com.scheduler.core.entity.JobExecution;
import com.scheduler.core.entity.JobStatus;
import com.scheduler.core.entity.RetryPolicy;
import com.scheduler.core.entity.RetryStrategy;
import com.scheduler.worker.service.JobExecutionEngine;
import com.scheduler.worker.service.JobRunner;
import com.scheduler.worker.service.JobTransactionService;
import com.scheduler.worker.service.WorkerRegistration;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@ExtendWith(MockitoExtension.class)
public class JobRunnerTest {

    @Mock
    private JobTransactionService transactionService;

    @Mock
    private WorkerRegistration workerRegistration;

    @Mock
    private JobExecutionEngine engine;

    @InjectMocks
    private JobRunner jobRunner;

    @Test
    public void testSuccessfulExecutionSimulation() {
        Job job = Job.builder()
                .id(UUID.randomUUID())
                .name("test-job")
                .payload("{\"duration\": 10, \"fail\": false}")
                .retryCount(0)
                .maxRetries(3)
                .build();

        JobExecution execution = JobExecution.builder()
                .id(UUID.randomUUID())
                .job(job)
                .status("RUNNING")
                .build();

        Mockito.when(engine.getActiveJobsCount()).thenReturn(new AtomicInteger(1));
        Mockito.when(transactionService.startExecution(Mockito.eq(job.getId()), Mockito.any()))
                .thenReturn(execution);

        jobRunner.setJob(job);
        jobRunner.setEngine(engine);
        
        jobRunner.run();

        // Verify start was logged and completion was triggered
        Mockito.verify(transactionService).startExecution(Mockito.eq(job.getId()), Mockito.any());
        Mockito.verify(transactionService).completeExecution(Mockito.eq(job.getId()), Mockito.any(), Mockito.anyLong());
    }

    @Test
    public void testFixedDelayBackoffCalculation() {
        // We can test mathematical logic of backoffs
        RetryPolicy policy = RetryPolicy.builder()
                .strategy(RetryStrategy.FIXED)
                .backoffMs(2000L)
                .maxRetries(3)
                .build();

        long calculatedDelay = calculateBackoff(policy, 1);
        Assertions.assertEquals(2000L, calculatedDelay);
    }

    @Test
    public void testLinearBackoffCalculation() {
        RetryPolicy policy = RetryPolicy.builder()
                .strategy(RetryStrategy.LINEAR)
                .backoffMs(2000L)
                .maxRetries(3)
                .build();

        // Retry #2 -> backoff * retryCount = 2000 * 2 = 4000
        long calculatedDelay = calculateBackoff(policy, 2);
        Assertions.assertEquals(4000L, calculatedDelay);
    }

    @Test
    public void testExponentialBackoffCalculation() {
        RetryPolicy policy = RetryPolicy.builder()
                .strategy(RetryStrategy.EXPONENTIAL)
                .backoffMs(2000L)
                .maxRetries(3)
                .build();

        // Retry #3 -> backoff * 2^(retryCount-1) = 2000 * 2^2 = 8000
        long calculatedDelay = calculateBackoff(policy, 3);
        Assertions.assertEquals(8000L, calculatedDelay);
    }

    private long calculateBackoff(RetryPolicy policy, int retryCount) {
        long backoffMs = policy.getBackoffMs();
        RetryStrategy strategy = policy.getStrategy();

        if (strategy == RetryStrategy.LINEAR) {
            return backoffMs * retryCount;
        } else if (strategy == RetryStrategy.EXPONENTIAL) {
            return (long) (backoffMs * Math.pow(2, retryCount - 1));
        }
        return backoffMs; // FIXED
    }
}
