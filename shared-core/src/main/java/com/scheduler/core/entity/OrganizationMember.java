package com.scheduler.core.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "organization_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationMember {

    @EmbeddedId
    private OrganizationMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("organizationId")
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String role = "MEMBER";
}
