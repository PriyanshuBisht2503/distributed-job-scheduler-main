package com.scheduler.core.repository;

import com.scheduler.core.entity.OrganizationMember;
import com.scheduler.core.entity.OrganizationMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, OrganizationMemberId> {
    List<OrganizationMember> findByUserId(UUID userId);
    List<OrganizationMember> findByOrganizationId(UUID organizationId);
}
