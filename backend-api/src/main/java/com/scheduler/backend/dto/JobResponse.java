package com.scheduler.backend.dto;

import com.scheduler.core.entity.Job;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResponse {
    private UUID id;
    private String name;
    private UUID queueId;
    private String queueName;
    private String status;
    private String payload;
    private Integer priority;
    private OffsetDateTime runAt;
    private String cronExpression;
    private UUID retryPolicyId;
    private String retryPolicyName;
    private Integer retryCount;
    private Integer maxRetries;
    private UUID workerId;
    private String workerName;
    private UUID parentJobId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static JobResponse fromEntity(Job job) {
        if (job == null) return null;
        return JobResponse.builder()
                .id(job.getId())
                .name(job.getName())
                .queueId(job.getQueue().getId())
                .queueName(job.getQueue().getName())
                .status(job.getStatus().name())
                .payload(job.getPayload())
                .priority(job.getPriority())
                .runAt(job.getRunAt())
                .cronExpression(job.getCronExpression())
                .retryPolicyId(job.getRetryPolicy() != null ? job.getRetryPolicy().getId() : null)
                .retryPolicyName(job.getRetryPolicy() != null ? job.getRetryPolicy().getName() : null)
                .retryCount(job.getRetryCount())
                .maxRetries(job.getMaxRetries())
                .workerId(job.getWorker() != null ? job.getWorker().getId() : null)
                .workerName(job.getWorker() != null ? job.getWorker().getName() : null)
                .parentJobId(job.getParentJob() != null ? job.getParentJob().getId() : null)
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
