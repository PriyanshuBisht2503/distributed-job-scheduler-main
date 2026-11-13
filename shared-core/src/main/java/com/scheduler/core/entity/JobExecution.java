package com.scheduler.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_executions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id")
    private Worker worker;

    @Column(nullable = false, length = 50)
    private String status; // RUNNING, COMPLETED, FAILED

    @Column(name = "started_at", updatable = false)
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "retry_number", nullable = false)
    @Builder.Default
    private Integer retryNumber = 0;

    @PrePersist
    protected void onCreate() {
        startedAt = OffsetDateTime.now();
    }
}
