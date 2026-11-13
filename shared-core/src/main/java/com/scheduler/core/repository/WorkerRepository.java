package com.scheduler.core.repository;

import com.scheduler.core.entity.Worker;
import com.scheduler.core.entity.WorkerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, UUID> {
    Optional<Worker> findByName(String name);
    List<Worker> findByStatus(WorkerStatus status);
    List<Worker> findByLastHeartbeatBefore(OffsetDateTime threshold);
}
