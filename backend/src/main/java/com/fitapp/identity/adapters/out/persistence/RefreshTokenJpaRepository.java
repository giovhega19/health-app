package com.fitapp.identity.adapters.out.persistence;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface RefreshTokenJpaRepository extends JpaRepository<RefreshTokenEntity, UUID> {

  Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);

  // clearAutomatically: a bulk update bypasses the persistence context, so any already-loaded
  // RefreshTokenEntity would otherwise look stale (still revokedAt = null) for the rest of the
  // transaction (e.g. RefreshAccessToken re-reading the same token right after revoking a family).
  @Modifying(clearAutomatically = true)
  @Query(
      "update RefreshTokenEntity t set t.revokedAt = :revokedAt "
          + "where t.userId = :userId and t.revokedAt is null")
  void revokeAllForUser(@Param("userId") UUID userId, @Param("revokedAt") Instant revokedAt);

  /**
   * A1 (H1 security review): single atomic conditional write — the {@code revoked_at is null}
   * predicate is checked and updated by PostgreSQL in one statement (row-locked for the duration),
   * so of two concurrent callers racing on the same {@code id} exactly one can affect a row.
   * Returns the number of rows affected (0 or 1); see {@link
   * com.fitapp.identity.domain.RefreshTokenRepository#revoke(UUID)}.
   */
  @Modifying(clearAutomatically = true)
  @Query(
      "update RefreshTokenEntity t set t.revokedAt = :revokedAt "
          + "where t.id = :id and t.revokedAt is null")
  int revokeIfNotRevoked(@Param("id") UUID id, @Param("revokedAt") Instant revokedAt);
}
