package com.scheduler.worker.service;

import com.scheduler.core.entity.Job;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class JobExecutionEngine {
    private static final Logger logger = LoggerFactory.getLogger(JobExecutionEngine.class);

    @Value("${worker.concurrency:10}")
    private int concurrencyLimit;

    @Autowired
    private ApplicationContext applicationContext;

    private ExecutorService executorService;

    @Getter
    private final AtomicInteger activeJobsCount = new AtomicInteger(0);

    @PostConstruct
    public void init() {
        logger.info("Initializing JobExecutionEngine with thread pool size: {}", concurrencyLimit);
        // Custom thread factory to name threads descriptively
        ThreadFactory threadFactory = new ThreadFactory() {
            private final AtomicInteger count = new AtomicInteger(0);
            @Override
            public Thread newThread(Runnable r) {
                return new Thread(r, "job-worker-thread-" + count.incrementAndGet());
            }
        };

        executorService = new ThreadPoolExecutor(
                concurrencyLimit,
                concurrencyLimit,
                0L, TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<>(),
                threadFactory
        );
    }

    public boolean hasCapacity() {
        return activeJobsCount.get() < concurrencyLimit;
    }

    public int getAvailableCapacity() {
        return Math.max(0, concurrencyLimit - activeJobsCount.get());
    }

    public void execute(Job job) {
        activeJobsCount.incrementAndGet();
        try {
            // Instantiate prototype/scoped Runner to avoid share state issues
            JobRunner runner = applicationContext.getBean(JobRunner.class);
            runner.setJob(job);
            runner.setEngine(this);
            executorService.submit(runner);
        } catch (Exception e) {
            activeJobsCount.decrementAndGet();
            logger.error("Failed to submit job execution to thread pool. Job ID: {}", job.getId(), e);
        }
    }

    @PreDestroy
    public void shutdown() {
        logger.info("Initiating graceful shutdown of JobExecutionEngine...");
        executorService.shutdown();
        try {
            // Wait up to 30 seconds for active jobs to complete
            if (!executorService.awaitTermination(30, TimeUnit.SECONDS)) {
                logger.warn("Forcing shutdown. Some jobs did not finish within the grace period.");
                executorService.shutdownNow();
            } else {
                logger.info("All execution threads terminated gracefully.");
            }
        } catch (InterruptedException e) {
            logger.error("Interrupted during worker thread pool shutdown", e);
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
