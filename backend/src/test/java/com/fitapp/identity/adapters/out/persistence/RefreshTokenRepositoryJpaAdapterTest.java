package com.fitapp.identity.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fitapp.identity.domain.RefreshToken;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RefreshTokenRepositoryJpaAdapterTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  @Mock private RefreshTokenJpaRepository jpaRepository;

  @Test
  void savesAndMapsBackToADomainToken() {
    RefreshTokenRepositoryJpaAdapter adapter =
        new RefreshTokenRepositoryJpaAdapter(jpaRepository, FIXED_CLOCK);
    UUID id = UUID.randomUUID();
    RefreshToken token =
        new RefreshToken(
            id,
            UUID.randomUUID(),
            "hash",
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Instant.now(FIXED_CLOCK).plusSeconds(3600),
            null);
    RefreshTokenEntity entity =
        new RefreshTokenEntity(
            id,
            token.userId(),
            "hash",
            token.familyId(),
            token.createdAt(),
            token.expiresAt(),
            null);
    when(jpaRepository.save(any(RefreshTokenEntity.class))).thenReturn(entity);

    RefreshToken saved = adapter.save(token);

    assertThat(saved).isEqualTo(token);
  }

  @Test
  void findByTokenHashReturnsEmptyWhenNotFound() {
    RefreshTokenRepositoryJpaAdapter adapter =
        new RefreshTokenRepositoryJpaAdapter(jpaRepository, FIXED_CLOCK);
    when(jpaRepository.findByTokenHash("missing")).thenReturn(Optional.empty());

    assertThat(adapter.findByTokenHash("missing")).isEmpty();
  }

  @Test
  void revokeReturnsFalseWhenTheTokenDoesNotExistOrWasAlreadyRevoked() {
    RefreshTokenRepositoryJpaAdapter adapter =
        new RefreshTokenRepositoryJpaAdapter(jpaRepository, FIXED_CLOCK);
    UUID id = UUID.randomUUID();
    when(jpaRepository.revokeIfNotRevoked(eq(id), any(Instant.class))).thenReturn(0);

    assertThat(adapter.revoke(id)).isFalse();
  }

  @Test
  void revokeReturnsTrueWhenItAtomicallyFlipsRevokedAt() {
    RefreshTokenRepositoryJpaAdapter adapter =
        new RefreshTokenRepositoryJpaAdapter(jpaRepository, FIXED_CLOCK);
    UUID id = UUID.randomUUID();
    when(jpaRepository.revokeIfNotRevoked(eq(id), any(Instant.class))).thenReturn(1);

    assertThat(adapter.revoke(id)).isTrue();
  }

  /**
   * A1 (H1 security review): only the first of two racing callers may win — modeled here as the
   * underlying atomic query returning 1 (affected) then 0 (already revoked) for the exact same
   * token id, exactly what PostgreSQL's `UPDATE ... WHERE revoked_at IS NULL` guarantees for two
   * concurrent transactions.
   */
  @Test
  void onlyTheFirstOfTwoRevokeCallsForTheSameTokenWins_A1() {
    RefreshTokenRepositoryJpaAdapter adapter =
        new RefreshTokenRepositoryJpaAdapter(jpaRepository, FIXED_CLOCK);
    UUID id = UUID.randomUUID();
    when(jpaRepository.revokeIfNotRevoked(eq(id), any(Instant.class))).thenReturn(1, 0);

    assertThat(adapter.revoke(id)).isTrue();
    assertThat(adapter.revoke(id)).isFalse();
  }

  @Test
  void revokeAllForUserDelegatesToTheBulkUpdateQuery() {
    RefreshTokenRepositoryJpaAdapter adapter =
        new RefreshTokenRepositoryJpaAdapter(jpaRepository, FIXED_CLOCK);
    UUID userId = UUID.randomUUID();

    adapter.revokeAllForUser(userId);

    verify(jpaRepository).revokeAllForUser(eq(userId), any(Instant.class));
  }
}
