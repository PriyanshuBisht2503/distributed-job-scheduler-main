package com.scheduler.core.repository;

import com.scheduler.core.entity.RetryPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RetryPolicyRepository extends JpaRepository<RetryPolicy, UUID> {
    Optional<RetryPolicy> findByName(String name);
}
