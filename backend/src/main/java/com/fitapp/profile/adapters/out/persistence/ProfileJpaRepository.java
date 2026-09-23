package com.fitapp.profile.adapters.out.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface ProfileJpaRepository extends JpaRepository<ProfileEntity, UUID> {

  Optional<ProfileEntity> findByUserId(UUID userId);

  @Modifying(clearAutomatically = true)
  @Query("delete from ProfileEntity p where p.userId = :userId")
  void deleteByUserId(@Param("userId") UUID userId);
}
