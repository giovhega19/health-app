package com.fitapp.identity.adapters.out.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface PasswordResetTokenJpaRepository extends JpaRepository<PasswordResetTokenEntity, UUID> {

  Optional<PasswordResetTokenEntity> findByTokenHash(String tokenHash);
}
