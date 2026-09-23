package com.fitapp.identity.adapters.out.persistence;

import com.fitapp.identity.domain.PasswordResetToken;
import com.fitapp.identity.domain.PasswordResetTokenRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** Real {@link PasswordResetTokenRepository} adapter over Spring Data JPA / PostgreSQL. */
@Component
public class PasswordResetTokenRepositoryJpaAdapter implements PasswordResetTokenRepository {

  private final PasswordResetTokenJpaRepository jpaRepository;

  public PasswordResetTokenRepositoryJpaAdapter(PasswordResetTokenJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public PasswordResetToken save(PasswordResetToken token) {
    PasswordResetTokenEntity saved =
        jpaRepository.save(
            new PasswordResetTokenEntity(
                token.id(),
                token.userId(),
                token.tokenHash(),
                token.createdAt(),
                token.expiresAt(),
                token.usedAt()));
    return toDomain(saved);
  }

  @Override
  public Optional<PasswordResetToken> findByTokenHash(String tokenHash) {
    return jpaRepository
        .findByTokenHash(tokenHash)
        .map(PasswordResetTokenRepositoryJpaAdapter::toDomain);
  }

  private static PasswordResetToken toDomain(PasswordResetTokenEntity entity) {
    return new PasswordResetToken(
        entity.getId(),
        entity.getUserId(),
        entity.getTokenHash(),
        entity.getCreatedAt(),
        entity.getExpiresAt(),
        entity.getUsedAt());
  }
}
