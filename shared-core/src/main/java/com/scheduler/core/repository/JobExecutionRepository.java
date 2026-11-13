package com.scheduler.core.repository;

import com.scheduler.core.entity.JobExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobExecutionRepository extends JpaRepository<JobExecution, UUID> {
    List<JobExecution> findByJobIdOrderByStartedAtDesc(UUID jobId);
    Page<JobExecution> findByJobId(UUID jobId, Pageable pageable);

    @Query("SELECT AVG(je.durationMs) FROM JobExecution je WHERE je.status = 'COMPLETED'")
    Double getAverageDurationMs();

    @Query("SELECT COUNT(je) FROM JobExecution je WHERE je.status = :status")
    long countByStatus(@Param("status") String status);
}
