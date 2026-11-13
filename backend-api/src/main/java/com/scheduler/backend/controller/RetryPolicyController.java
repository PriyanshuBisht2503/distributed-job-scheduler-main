package com.scheduler.backend.controller;

import com.scheduler.backend.exception.ResourceNotFoundException;
import com.scheduler.core.entity.RetryPolicy;
import com.scheduler.core.repository.RetryPolicyRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/retry-policies")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RetryPolicyController {

    @Autowired
    private RetryPolicyRepository retryPolicyRepository;

    @GetMapping
    public ResponseEntity<List<RetryPolicy>> getAllPolicies() {
        return ResponseEntity.ok(retryPolicyRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<RetryPolicy> createPolicy(@Valid @RequestBody RetryPolicy policy) {
        return ResponseEntity.ok(retryPolicyRepository.save(policy));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> deletePolicy(@PathVariable UUID id) {
        RetryPolicy policy = retryPolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Retry policy not found"));
        retryPolicyRepository.delete(policy);
        return ResponseEntity.ok().build();
    }
}
