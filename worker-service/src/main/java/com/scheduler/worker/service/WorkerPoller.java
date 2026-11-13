package com.scheduler.worker.service;

import com.scheduler.core.entity.Job;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WorkerPoller {
    private static final Logger logger = LoggerFactory.getLogger(WorkerPoller.class);

    @Autowired
    private JobExecutionEngine executionEngine;

    @Autowired
    private TransactionalClaimer transactionalClaimer;

    @Scheduled(fixedDelayString = "${worker.poll-interval-ms:1000}")
    public void poll() {
        if (!executionEngine.hasCapacity()) {
            logger.debug("ThreadPool is fully saturated. Skipping database poll.");
            return;
        }

        int capacity = executionEngine.getAvailableCapacity();
        try {
            List<Job> claimedJobs = transactionalClaimer.claimJobs(capacity);
            for (Job job : claimedJobs) {
                logger.info("Scheduling job {} for immediate worker execution", job.getId());
                executionEngine.execute(job);
            }
        } catch (Exception e) {
            logger.error("Error during polling for available jobs", e);
        }
    }
}
