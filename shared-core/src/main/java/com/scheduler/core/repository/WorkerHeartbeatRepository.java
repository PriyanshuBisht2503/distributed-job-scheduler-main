package com.scheduler.core.repository;

import com.scheduler.core.entity.WorkerHeartbeat;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkerHeartbeatRepository extends JpaRepository<WorkerHeartbeat, UUID> {
    List<WorkerHeartbeat> findByWorkerIdOrderByTimestampDesc(UUID workerId);

    @Query("SELECT wh FROM WorkerHeartbeat wh WHERE wh.worker.id = :workerId ORDER BY wh.timestamp DESC")
    List<WorkerHeartbeat> findLatestHeartbeats(@Param("workerId") UUID workerId, Pageable pageable);
}
