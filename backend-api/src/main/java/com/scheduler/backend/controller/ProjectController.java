package com.scheduler.backend.controller;

import com.scheduler.backend.exception.ResourceNotFoundException;
import com.scheduler.core.entity.Organization;
import com.scheduler.core.entity.Project;
import com.scheduler.core.repository.OrganizationRepository;
import com.scheduler.core.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects(@RequestParam(required = false) UUID organizationId) {
        if (organizationId != null) {
            return ResponseEntity.ok(projectRepository.findByOrganizationId(organizationId));
        }
        return ResponseEntity.ok(projectRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestParam UUID organizationId, @RequestBody Project project) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        project.setOrganization(org);
        return ResponseEntity.ok(projectRepository.save(project));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable UUID id) {
        Project proj = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        return ResponseEntity.ok(proj);
    }
}
