package com.scheduler.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "dead_letter_queues")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeadLetterQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false, unique = true)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_queue_id", nullable = false)
    private Queue originalQueue;

    @Column(name = "failed_at", nullable = false)
    private OffsetDateTime failedAt;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @PrePersist
    protected void onCreate() {
        failedAt = OffsetDateTime.now();
    }
}
