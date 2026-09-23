package com.fitapp.identity.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.PostgresTestContainer;
import com.fitapp.identity.domain.RefreshToken;
import com.fitapp.identity.domain.RefreshTokenRepository;
import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.UserRepository;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real-database integration test for the `identity` module's JPA adapters (Art. 3,
 * `07-estrategia-pruebas.md`: Testcontainers for repository integration, not just fakes). The full
 * Spring context (via {@link PostgresTestContainer}'s {@code @ServiceConnection}) runs the real
 * Flyway migrations (`db/migration/identity/V1__*.sql`) against a disposable PostgreSQL container,
 * then wires the production {@link UserRepositoryJpaAdapter}/{@link
 * RefreshTokenRepositoryJpaAdapter} beans exactly as they run in production. Each test runs in its
 * own rolled-back transaction for isolation.
 */
@SpringBootTest
@Transactional
class UserRepositoryJpaAdapterIntegrationTest extends PostgresTestContainer {

  @Autowired private UserRepository userRepository;
  @Autowired private RefreshTokenRepository refreshTokenRepository;

  @Test
  void savesAndReloadsAUserByEmailAndId() {
    UUID id = UUID.randomUUID();
    User user = new User(id, "integration@fitapp.test", "hash", "1.0", true, Instant.now(), null);

    userRepository.save(user);

    assertThat(userRepository.findByEmail("integration@fitapp.test")).isPresent();
    assertThat(userRepository.findById(id)).isPresent();
  }

  @Test
  void softDeletedUsersAreExcludedFromFindByEmail() {
    UUID id = UUID.randomUUID();
    User user =
        new User(id, "deleted@fitapp.test", "hash", "1.0", true, Instant.now(), Instant.now());

    userRepository.save(user);

    assertThat(userRepository.findByEmail("deleted@fitapp.test")).isEmpty();
    assertThat(userRepository.findById(id)).isPresent();
  }

  @Test
  void refreshTokenRoundTripAndRevocation() {
    UUID userId = UUID.randomUUID();
    userRepository.save(
        new User(userId, "tokens@fitapp.test", "hash", "1.0", true, Instant.now(), null));
    RefreshToken token =
        new RefreshToken(
            UUID.randomUUID(),
            userId,
            "a-token-hash",
            UUID.randomUUID(),
            Instant.now(),
            Instant.now().plusSeconds(3600),
            null);

    refreshTokenRepository.save(token);
    assertThat(refreshTokenRepository.findByTokenHash("a-token-hash")).isPresent();

    refreshTokenRepository.revokeAllForUser(userId);

    assertThat(refreshTokenRepository.findByTokenHash("a-token-hash"))
        .get()
        .extracting(RefreshToken::isRevoked)
        .isEqualTo(true);
  }

  /**
   * A1 (H1 security review): real-PostgreSQL proof that {@code revoke} is atomic and single-use —
   * calling it twice on the same token (simulating two racing callers; the underlying {@code UPDATE
   * ... WHERE revoked_at IS NULL} is what actually enforces "only one wins" under true concurrency,
   * this proves that predicate against the real database) only lets the first call report success.
   */
  @Test
  void revokeIsAtomicOnlyTheFirstCallerWins_A1() {
    UUID userId = UUID.randomUUID();
    userRepository.save(
        new User(userId, "race@fitapp.test", "hash", "1.0", true, Instant.now(), null));
    RefreshToken token =
        new RefreshToken(
            UUID.randomUUID(),
            userId,
            "race-token-hash",
            UUID.randomUUID(),
            Instant.now(),
            Instant.now().plusSeconds(3600),
            null);
    RefreshToken saved = refreshTokenRepository.save(token);

    boolean firstCallerWon = refreshTokenRepository.revoke(saved.id());
    boolean secondCallerWon = refreshTokenRepository.revoke(saved.id());

    assertThat(firstCallerWon).isTrue();
    assertThat(secondCallerWon).isFalse();
  }
}
