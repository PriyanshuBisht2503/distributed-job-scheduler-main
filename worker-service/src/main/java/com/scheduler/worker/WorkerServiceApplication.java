package com.scheduler.worker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.scheduler")
@EnableJpaRepositories(basePackages = "com.scheduler.core.repository")
@EntityScan(basePackages = "com.scheduler.core.entity")
@EnableScheduling
public class WorkerServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(WorkerServiceApplication.class, args);
    }
}
