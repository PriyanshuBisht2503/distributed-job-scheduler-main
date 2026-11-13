package com.scheduler.backend.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.scheduler.core.repository")
@EntityScan(basePackages = "com.scheduler.core.entity")
public class JpaConfig {
}
