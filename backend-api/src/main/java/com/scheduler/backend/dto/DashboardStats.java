package com.scheduler.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {
    private long totalJobs;
    private long queuedJobs;
    private long runningJobs;
    private long completedJobs;
    private long failedJobs;
    private long dlqJobs;
    private long activeWorkers;
    private Double averageExecutionTimeMs;
    private Map<String, Long> jobsByQueue;
    private Map<String, Long> executionsOverTime; // hourly/daily aggregations
}
