package com.scheduler.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QueueRequest {
    @NotBlank
    private String name;

    @NotNull
    private UUID projectId;

    @Min(1)
    @Max(100)
    private Integer priority = 1;

    @Min(1)
    @Max(1000)
    private Integer maxConcurrency = 10;
}
