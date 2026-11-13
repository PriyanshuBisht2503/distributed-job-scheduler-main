package com.scheduler.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobRequest {
    @NotBlank
    private String name;

    @NotNull
    private UUID queueId;

    private String payload;

    private Integer priority = 0;

    private Long delaySeconds; // for delayed jobs

    private String cronExpression; // for scheduled recurring jobs

    private UUID retryPolicyId;

    private Integer maxRetries = 3;

    private UUID parentJobId; // Workflow dependency
}
