package com.scheduler.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "worker_heartbeats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerHeartbeat {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Column(nullable = false)
    private OffsetDateTime timestamp;

    @Column(name = "cpu_usage", nullable = false)
    private Double cpuUsage;

    @Column(name = "memory_usage", nullable = false)
    private Double memoryUsage;

    @Column(name = "active_jobs", nullable = false)
    @Builder.Default
    private Integer activeJobs = 0;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = OffsetDateTime.now();
        }
    }
}
