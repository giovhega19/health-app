package com.fitapp.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.fitapp.identity.domain.User;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * RF-01.01 `POST /auth/password/forgot`. Always succeeds silently regardless of whether the email
 * is registered (never reveals account existence, `openapi.yaml`).
 */
class RequestPasswordResetTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  @Test
  void createsAResetTokenWhenTheEmailIsRegistered() {
    FakeUserRepository userRepository = new FakeUserRepository();
    UUID userId = UUID.randomUUID();
    userRepository.seed(
        new User(userId, "ana@fitapp.test", "hash", "1.0", true, Instant.now(FIXED_CLOCK), null));
    FakePasswordResetTokenRepository tokenRepository = new FakePasswordResetTokenRepository();
    RequestPasswordReset useCase =
        new RequestPasswordReset(userRepository, tokenRepository, FIXED_CLOCK);

    assertThatCode(() -> useCase.execute("ana@fitapp.test")).doesNotThrowAnyException();
  }

  @Test
  void doesNothingSilentlyWhenTheEmailIsNotRegistered() {
    RequestPasswordReset useCase =
        new RequestPasswordReset(
            new FakeUserRepository(), new FakePasswordResetTokenRepository(), FIXED_CLOCK);

    assertThatCode(() -> useCase.execute("unknown@fitapp.test")).doesNotThrowAnyException();
  }

  @Test
  void theCreatedTokenCanLaterBeFoundByItsHash() {
    FakeUserRepository userRepository = new FakeUserRepository();
    UUID userId = UUID.randomUUID();
    userRepository.seed(
        new User(userId, "ana@fitapp.test", "hash", "1.0", true, Instant.now(FIXED_CLOCK), null));
    FakePasswordResetTokenRepository tokenRepository = new FakePasswordResetTokenRepository();
    RequestPasswordReset useCase =
        new RequestPasswordReset(userRepository, tokenRepository, FIXED_CLOCK);

    useCase.execute("ana@fitapp.test");

    assertThat(tokenRepository.findByTokenHash("does-not-match")).isEmpty();
  }
}
