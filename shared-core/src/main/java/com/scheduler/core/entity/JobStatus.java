package com.scheduler.core.entity;

public enum JobStatus {
    QUEUED,
    SCHEDULED,
    CLAIMED,
    RUNNING,
    COMPLETED,
    FAILED,
    RETRY,
    DLQ
}
