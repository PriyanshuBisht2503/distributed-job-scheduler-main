package com.scheduler.worker.service;

import com.scheduler.core.entity.Job;
import com.scheduler.core.entity.JobStatus;
import com.scheduler.core.entity.Worker;
import com.scheduler.core.repository.JobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionalClaimer {
    private static final Logger logger = LoggerFactory.getLogger(TransactionalClaimer.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private WorkerRegistration workerRegistration;

    @Transactional
    public List<Job> claimJobs(int limit) {
        Worker worker = workerRegistration.getRegisteredWorker();
        if (worker == null) {
            logger.warn("Worker not registered yet. Skipping job claim.");
            return Collections.emptyList();
        }

        // Step 1: Query IDs with SELECT ... FOR UPDATE SKIP LOCKED
        List<UUID> ids = jobRepository.selectJobsToClaim(OffsetDateTime.now(), limit);
        if (ids.isEmpty()) {
            return Collections.emptyList();
        }

        logger.debug("Found {} lockable jobs to claim: {}", ids.size(), ids);

        // Step 2: Transition the jobs atomically to CLAIMED under this worker
        int updatedCount = jobRepository.updateJobsStatusAndWorker(
                ids, 
                JobStatus.CLAIMED, 
                worker, 
                OffsetDateTime.now()
        );

        logger.info("Successfully claimed {} jobs for worker: {}", updatedCount, worker.getName());

        // Step 3: Fetch and return full entities to be processed in thread pool
        return jobRepository.findAllById(ids);
    }
}
