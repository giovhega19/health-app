package com.fitapp.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fitapp.identity.domain.InvalidPasswordResetTokenException;
import com.fitapp.identity.domain.OpaqueTokens;
import com.fitapp.identity.domain.PasswordResetToken;
import com.fitapp.identity.domain.User;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** RF-01.01 `POST /auth/password/reset`. */
class ResetPasswordTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  @Test
  void redeemsAUsableTokenAndUpdatesThePasswordHash() {
    FakeUserRepository userRepository = new FakeUserRepository();
    FakePasswordHasher passwordHasher = new FakePasswordHasher();
    UUID userId = UUID.randomUUID();
    userRepository.seed(
        new User(
            userId,
            "ana@fitapp.test",
            passwordHasher.hash("OldPassword1!"),
            "1.0",
            true,
            Instant.now(FIXED_CLOCK),
            null));
    FakePasswordResetTokenRepository tokenRepository = new FakePasswordResetTokenRepository();
    String rawToken = "reset-token";
    tokenRepository.save(
        new PasswordResetToken(
            UUID.randomUUID(),
            userId,
            OpaqueTokens.hash(rawToken),
            Instant.now(FIXED_CLOCK),
            Instant.now(FIXED_CLOCK).plusSeconds(1800),
            null));
    ResetPassword useCase =
        new ResetPassword(tokenRepository, userRepository, passwordHasher, FIXED_CLOCK);

    assertThatCode(() -> useCase.execute(rawToken, "NewPassword1!")).doesNotThrowAnyException();

    assertThat(userRepository.findByEmail("ana@fitapp.test"))
        .get()
        .extracting(User::passwordHash)
        .isEqualTo(passwordHasher.hash("NewPassword1!"));
  }

  @Test
  void rejectsAnUnknownToken_401_AUTH_PASSWORD_RESET_TOKEN_INVALID() {
    ResetPassword useCase =
        new ResetPassword(
            new FakePasswordResetTokenRepository(),
            new FakeUserRepository(),
            new FakePasswordHasher(),
            FIXED_CLOCK);

    assertThatThrownBy(() -> useCase.execute("does-not-exist", "NewPassword1!"))
        .isInstanceOf(InvalidPasswordResetTokenException.class);
  }

  @Test
  void rejectsAnExpiredToken() {
    FakePasswordResetTokenRepository tokenRepository = new FakePasswordResetTokenRepository();
    UUID userId = UUID.randomUUID();
    String rawToken = "reset-token";
    tokenRepository.save(
        new PasswordResetToken(
            UUID.randomUUID(),
            userId,
            OpaqueTokens.hash(rawToken),
            Instant.now(FIXED_CLOCK).minusSeconds(3600),
            Instant.now(FIXED_CLOCK).minusSeconds(1),
            null));
    ResetPassword useCase =
        new ResetPassword(
            tokenRepository, new FakeUserRepository(), new FakePasswordHasher(), FIXED_CLOCK);

    assertThatThrownBy(() -> useCase.execute(rawToken, "NewPassword1!"))
        .isInstanceOf(InvalidPasswordResetTokenException.class);
  }

  @Test
  void rejectsAnAlreadyUsedToken() {
    FakePasswordResetTokenRepository tokenRepository = new FakePasswordResetTokenRepository();
    UUID userId = UUID.randomUUID();
    String rawToken = "reset-token";
    tokenRepository.save(
        new PasswordResetToken(
            UUID.randomUUID(),
            userId,
            OpaqueTokens.hash(rawToken),
            Instant.now(FIXED_CLOCK).minusSeconds(60),
            Instant.now(FIXED_CLOCK).plusSeconds(1800),
            Instant.now(FIXED_CLOCK).minusSeconds(30)));
    ResetPassword useCase =
        new ResetPassword(
            tokenRepository, new FakeUserRepository(), new FakePasswordHasher(), FIXED_CLOCK);

    assertThatThrownBy(() -> useCase.execute(rawToken, "NewPassword1!"))
        .isInstanceOf(InvalidPasswordResetTokenException.class);
  }
}
