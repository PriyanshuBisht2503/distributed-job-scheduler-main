package com.scheduler.backend.controller;

import com.scheduler.backend.exception.ResourceNotFoundException;
import com.scheduler.core.entity.Worker;
import com.scheduler.core.entity.WorkerHeartbeat;
import com.scheduler.core.repository.WorkerHeartbeatRepository;
import com.scheduler.core.repository.WorkerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WorkerMonitorController {

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private WorkerHeartbeatRepository workerHeartbeatRepository;

    @GetMapping
    public ResponseEntity<List<Worker>> getAllWorkers() {
        return ResponseEntity.ok(workerRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Worker> getWorkerById(@PathVariable UUID id) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found"));
        return ResponseEntity.ok(worker);
    }

    @GetMapping("/{id}/heartbeats")
    public ResponseEntity<List<WorkerHeartbeat>> getWorkerHeartbeats(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "20") int limit) {
        workerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found"));

        return ResponseEntity.ok(workerHeartbeatRepository.findLatestHeartbeats(id, PageRequest.of(0, limit)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteWorker(@PathVariable UUID id) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Worker not found"));
        workerRepository.delete(worker);
        return ResponseEntity.ok().build();
    }
}
