package com.scheduler.backend.controller;

import com.scheduler.backend.dto.QueueRequest;
import com.scheduler.backend.exception.ResourceNotFoundException;
import com.scheduler.core.entity.Project;
import com.scheduler.core.entity.Queue;
import com.scheduler.core.repository.ProjectRepository;
import com.scheduler.core.repository.QueueRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/queues")
@CrossOrigin(origins = "*", maxAge = 3600)
public class QueueController {

    @Autowired
    private QueueRepository queueRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping
    public ResponseEntity<List<Queue>> getAllQueues(@RequestParam(required = false) UUID projectId) {
        if (projectId != null) {
            return ResponseEntity.ok(queueRepository.findByProjectId(projectId));
        }
        return ResponseEntity.ok(queueRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Queue> createQueue(@Valid @RequestBody QueueRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Queue queue = Queue.builder()
                .name(request.getName())
                .project(project)
                .priority(request.getPriority())
                .maxConcurrency(request.getMaxConcurrency())
                .isPaused(false)
                .build();

        return ResponseEntity.ok(queueRepository.save(queue));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Queue> getQueueById(@PathVariable UUID id) {
        Queue queue = queueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));
        return ResponseEntity.ok(queue);
    }

    @PutMapping("/{id}/pause")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Queue> pauseQueue(@PathVariable UUID id) {
        Queue queue = queueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));
        queue.setIsPaused(true);
        return ResponseEntity.ok(queueRepository.save(queue));
    }

    @PutMapping("/{id}/resume")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Queue> resumeQueue(@PathVariable UUID id) {
        Queue queue = queueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));
        queue.setIsPaused(false);
        return ResponseEntity.ok(queueRepository.save(queue));
    }

    @PutMapping("/{id}/settings")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Queue> updateQueueSettings(
            @PathVariable UUID id,
            @RequestParam Integer priority,
            @RequestParam Integer maxConcurrency) {
        Queue queue = queueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));
        queue.setPriority(priority);
        queue.setMaxConcurrency(maxConcurrency);
        return ResponseEntity.ok(queueRepository.save(queue));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> deleteQueue(@PathVariable UUID id) {
        Queue queue = queueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Queue not found"));
        queueRepository.delete(queue);
        return ResponseEntity.ok().build();
    }
}
