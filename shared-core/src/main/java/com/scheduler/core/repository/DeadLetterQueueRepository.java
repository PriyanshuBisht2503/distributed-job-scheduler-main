package com.scheduler.core.repository;

import com.scheduler.core.entity.DeadLetterQueue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeadLetterQueueRepository extends JpaRepository<DeadLetterQueue, UUID> {
    Optional<DeadLetterQueue> findByJobId(UUID jobId);
    Page<DeadLetterQueue> findByOriginalQueueId(UUID originalQueueId, Pageable pageable);
}
