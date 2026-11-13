package com.scheduler.worker.service;

import com.scheduler.core.entity.Worker;
import com.scheduler.core.entity.WorkerStatus;
import com.scheduler.core.repository.WorkerRepository;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.time.OffsetDateTime;

@Service
public class WorkerRegistration implements CommandLineRunner, DisposableBean {
    private static final Logger logger = LoggerFactory.getLogger(WorkerRegistration.class);

    @Value("${worker.name}")
    private String workerName;

    @Autowired
    private WorkerRepository workerRepository;

    @Getter
    private Worker registeredWorker;

    @Override
    public void run(String... args) {
        String host = "unknown-host";
        try {
            host = InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            logger.warn("Could not determine hostname, defaulting to unknown-host");
        }

        // Register worker or update status if it exists
        Worker worker = workerRepository.findByName(workerName)
                .orElse(Worker.builder().name(workerName).build());

        worker.setHost(host);
        worker.setStatus(WorkerStatus.ACTIVE);
        worker.setLastHeartbeat(OffsetDateTime.now());

        registeredWorker = workerRepository.save(worker);
        logger.info("Worker registered successfully. ID: {}, Name: {}, Host: {}", 
                registeredWorker.getId(), registeredWorker.getName(), registeredWorker.getHost());
    }

    @Override
    public void destroy() {
        if (registeredWorker != null) {
            logger.info("Worker shutting down. Deregistering/marking inactive: {}", workerName);
            try {
                workerRepository.findById(registeredWorker.getId()).ifPresent(worker -> {
                    worker.setStatus(WorkerStatus.INACTIVE);
                    worker.setUpdatedAt(OffsetDateTime.now());
                    workerRepository.save(worker);
                });
                logger.info("Worker marked inactive in DB.");
            } catch (Exception e) {
                logger.error("Failed to mark worker inactive during shutdown", e);
            }
        }
    }
}
