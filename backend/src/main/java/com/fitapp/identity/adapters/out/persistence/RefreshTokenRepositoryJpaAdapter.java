package com.fitapp.identity.adapters.out.persistence;

import com.fitapp.identity.domain.RefreshToken;
import com.fitapp.identity.domain.RefreshTokenRepository;
import java.time.Clock;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Real {@link RefreshTokenRepository} adapter over Spring Data JPA / PostgreSQL. */
@Component
public class RefreshTokenRepositoryJpaAdapter implements RefreshTokenRepository {

  private final RefreshTokenJpaRepository jpaRepository;
  private final Clock clock;

  public RefreshTokenRepositoryJpaAdapter(RefreshTokenJpaRepository jpaRepository, Clock clock) {
    this.jpaRepository = jpaRepository;
    this.clock = clock;
  }

  @Override
  public RefreshToken save(RefreshToken token) {
    RefreshTokenEntity saved =
        jpaRepository.save(
            new RefreshTokenEntity(
                token.id(),
                token.userId(),
                token.tokenHash(),
                token.familyId(),
                token.createdAt(),
                token.expiresAt(),
                token.revokedAt()));
    return toDomain(saved);
  }

  @Override
  public Optional<RefreshToken> findByTokenHash(String tokenHash) {
    return jpaRepository.findByTokenHash(tokenHash).map(RefreshTokenRepositoryJpaAdapter::toDomain);
  }

  @Override
  public boolean revoke(UUID tokenId) {
    // A1 (H1 security review): a single atomic `UPDATE ... WHERE revoked_at IS NULL` instead of
    // the previous findById -> check -> save pattern, which raced under concurrency (two
    // concurrent callers could both read revokedAt == null before either wrote, so both would
    // "win"). See RefreshTokenRepository#revoke's Javadoc for the full rationale.
    return jpaRepository.revokeIfNotRevoked(tokenId, clock.instant()) == 1;
  }

  @Override
  public void revokeAllForUser(UUID userId) {
    jpaRepository.revokeAllForUser(userId, clock.instant());
  }

  private static RefreshToken toDomain(RefreshTokenEntity entity) {
    return new RefreshToken(
        entity.getId(),
        entity.getUserId(),
        entity.getTokenHash(),
        entity.getFamilyId(),
        entity.getCreatedAt(),
        entity.getExpiresAt(),
        entity.getRevokedAt());
  }
}
