package com.fitapp.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fitapp.identity.domain.InvalidRefreshTokenException;
import com.fitapp.identity.domain.OpaqueTokens;
import com.fitapp.identity.domain.RefreshToken;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** RF-01.01 `POST /auth/logout`. */
class LogoutUserTest {

  @Test
  void revokesTheRefreshTokenPresented() {
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    String rawToken = "raw-refresh-token";
    RefreshToken token =
        new RefreshToken(
            UUID.randomUUID(),
            UUID.randomUUID(),
            OpaqueTokens.hash(rawToken),
            UUID.randomUUID(),
            Instant.now(),
            Instant.now().plusSeconds(3600),
            null);
    refreshTokenRepository.save(token);
    LogoutUser useCase = new LogoutUser(refreshTokenRepository);

    assertThatCode(() -> useCase.execute(rawToken)).doesNotThrowAnyException();

    assertThat(refreshTokenRepository.findByTokenHash(OpaqueTokens.hash(rawToken)))
        .get()
        .extracting(RefreshToken::isRevoked)
        .isEqualTo(true);
  }

  @Test
  void rejectsAnUnknownOrAlreadyRevokedToken_401_AUTH_REFRESH_TOKEN_INVALID() {
    LogoutUser useCase = new LogoutUser(new FakeRefreshTokenRepository());

    assertThatThrownBy(() -> useCase.execute("does-not-exist"))
        .isInstanceOf(InvalidRefreshTokenException.class);
  }

  /** A1 (H1 security review): logging out twice with the same token must fail the second time. */
  @Test
  void rejectsATokenThatWasAlreadyRevoked_A1() {
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    String rawToken = "raw-refresh-token";
    RefreshToken token =
        new RefreshToken(
            UUID.randomUUID(),
            UUID.randomUUID(),
            OpaqueTokens.hash(rawToken),
            UUID.randomUUID(),
            Instant.now(),
            Instant.now().plusSeconds(3600),
            null);
    refreshTokenRepository.save(token);
    LogoutUser useCase = new LogoutUser(refreshTokenRepository);
    useCase.execute(rawToken);

    assertThatThrownBy(() -> useCase.execute(rawToken))
        .isInstanceOf(InvalidRefreshTokenException.class);
  }
}
