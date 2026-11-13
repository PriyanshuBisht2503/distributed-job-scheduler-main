package com.scheduler.core.repository;

import com.scheduler.core.entity.JobLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobLogRepository extends JpaRepository<JobLog, UUID> {
    List<JobLog> findByJobIdOrderByTimestampAsc(UUID jobId);
    Page<JobLog> findByJobId(UUID jobId, Pageable pageable);
}
