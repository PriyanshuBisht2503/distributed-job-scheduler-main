package com.scheduler.backend.controller;

import com.scheduler.backend.exception.ResourceNotFoundException;
import com.scheduler.core.entity.Organization;
import com.scheduler.core.entity.OrganizationMember;
import com.scheduler.core.entity.OrganizationMemberId;
import com.scheduler.core.entity.User;
import com.scheduler.core.repository.OrganizationMemberRepository;
import com.scheduler.core.repository.OrganizationRepository;
import com.scheduler.core.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizations")
@CrossOrigin(origins = "*", maxAge = 3600)
public class OrganizationController {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private OrganizationMemberRepository organizationMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Organization>> getAllOrganizations() {
        return ResponseEntity.ok(organizationRepository.findAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Organization>> getMyOrganizations() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = ((UserDetails) principal).getUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<OrganizationMember> memberships = organizationMemberRepository.findByUserId(user.getId());
        List<Organization> orgs = memberships.stream()
                .map(OrganizationMember::getOrganization)
                .collect(Collectors.toList());
        return ResponseEntity.ok(orgs);
    }

    @PostMapping
    public ResponseEntity<Organization> createOrganization(@RequestBody Organization org) {
        Organization saved = organizationRepository.save(org);
        
        // Auto assign creator as Owner/Admin
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = ((UserDetails) principal).getUsername();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            OrganizationMemberId memberId = OrganizationMemberId.builder()
                    .organizationId(saved.getId())
                    .userId(user.getId())
                    .build();
            OrganizationMember member = OrganizationMember.builder()
                    .id(memberId)
                    .organization(saved)
                    .user(user)
                    .role("OWNER")
                    .build();
            organizationMemberRepository.save(member);
        }

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Organization> getOrganizationById(@PathVariable UUID id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        return ResponseEntity.ok(org);
    }
}
