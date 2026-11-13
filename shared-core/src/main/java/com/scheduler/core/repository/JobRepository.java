package com.scheduler.core.repository;

import com.scheduler.core.entity.Job;
import com.scheduler.core.entity.JobStatus;
import com.scheduler.core.entity.Worker;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {

    @Query(value = "SELECT j.id FROM jobs j JOIN queues q ON j.queue_id = q.id " +
            "WHERE q.is_paused = false AND j.status IN ('QUEUED', 'SCHEDULED', 'RETRY') AND j.run_at <= :now " +
            "AND (SELECT COUNT(*) FROM jobs active WHERE active.queue_id = j.queue_id AND active.status IN ('CLAIMED', 'RUNNING')) < q.max_concurrency " +
            "ORDER BY q.priority DESC, j.priority DESC, j.created_at ASC " +
            "LIMIT :limit FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<UUID> selectJobsToClaim(@Param("now") OffsetDateTime now, @Param("limit") int limit);

    @Modifying
    @Query("UPDATE Job j SET j.status = :status, j.worker = :worker, j.updatedAt = :now WHERE j.id IN :ids")
    int updateJobsStatusAndWorker(@Param("ids") List<UUID> ids, @Param("status") JobStatus status, @Param("worker") Worker worker, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("UPDATE Job j SET j.status = :status, j.updatedAt = :now WHERE j.id = :id")
    int updateJobStatus(@Param("id") UUID id, @Param("status") JobStatus status, @Param("now") OffsetDateTime now);

    Page<Job> findByQueueId(UUID queueId, Pageable pageable);
    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    @Query("SELECT j FROM Job j JOIN j.queue q WHERE q.project.id = :projectId")
    Page<Job> findByProjectId(@Param("projectId") UUID projectId, Pageable pageable);

    long countByStatus(JobStatus status);

    @Query("SELECT COUNT(j) FROM Job j WHERE j.status = 'FAILED'")
    long countFailedJobs();

    @Query("SELECT COUNT(j) FROM Job j WHERE j.status = 'COMPLETED'")
    long countCompletedJobs();
}
