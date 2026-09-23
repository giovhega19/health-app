package com.fitapp.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fitapp.identity.domain.InvalidRefreshTokenException;
import com.fitapp.identity.domain.OpaqueTokens;
import com.fitapp.identity.domain.RefreshToken;
import com.fitapp.identity.domain.User;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** RF-01.01 `POST /auth/refresh`: rotation and reuse detection. */
class RefreshAccessTokenTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);
  private static final Duration REFRESH_TTL = Duration.ofDays(30);

  @Test
  void rotatesAValidRefreshTokenAndIssuesNewTokens() {
    FakeUserRepository userRepository = new FakeUserRepository();
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    UUID userId = UUID.randomUUID();
    userRepository.seed(
        new User(userId, "ana@fitapp.test", "hash", "1.0", true, Instant.now(FIXED_CLOCK), null));
    String rawToken = "raw-refresh-token";
    RefreshToken stored =
        new RefreshToken(
            UUID.randomUUID(),
            userId,
            OpaqueTokens.hash(rawToken),
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Instant.now(FIXED_CLOCK).plus(REFRESH_TTL),
            null);
    refreshTokenRepository.save(stored);
    RefreshAccessToken useCase =
        new RefreshAccessToken(
            refreshTokenRepository,
            userRepository,
            new FakeTokenIssuer(),
            FIXED_CLOCK,
            REFRESH_TTL);

    AuthTokensResult result = useCase.execute(rawToken);

    assertThat(result.userId()).isEqualTo(userId);
    assertThat(result.refreshToken()).isNotEqualTo(rawToken);
    assertThat(refreshTokenRepository.findByTokenHash(OpaqueTokens.hash(rawToken)))
        .get()
        .extracting(RefreshToken::isRevoked)
        .isEqualTo(true);
  }

  @Test
  void rejectsAnUnknownRefreshToken_401_AUTH_REFRESH_TOKEN_INVALID() {
    RefreshAccessToken useCase =
        new RefreshAccessToken(
            new FakeRefreshTokenRepository(),
            new FakeUserRepository(),
            new FakeTokenIssuer(),
            FIXED_CLOCK,
            REFRESH_TTL);

    assertThatThrownBy(() -> useCase.execute("does-not-exist"))
        .isInstanceOf(InvalidRefreshTokenException.class);
  }

  @Test
  void reusingAnAlreadyRotatedTokenRevokesEveryTokenOfTheUser() {
    FakeUserRepository userRepository = new FakeUserRepository();
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    UUID userId = UUID.randomUUID();
    userRepository.seed(
        new User(userId, "ana@fitapp.test", "hash", "1.0", true, Instant.now(FIXED_CLOCK), null));
    String rawToken = "raw-refresh-token";
    RefreshToken alreadyRevoked =
        new RefreshToken(
            UUID.randomUUID(),
            userId,
            OpaqueTokens.hash(rawToken),
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Instant.now(FIXED_CLOCK).plus(REFRESH_TTL),
            Instant.now(FIXED_CLOCK));
    refreshTokenRepository.save(alreadyRevoked);
    RefreshAccessToken useCase =
        new RefreshAccessToken(
            refreshTokenRepository,
            userRepository,
            new FakeTokenIssuer(),
            FIXED_CLOCK,
            REFRESH_TTL);

    assertThatThrownBy(() -> useCase.execute(rawToken))
        .isInstanceOf(InvalidRefreshTokenException.class);
    assertThat(refreshTokenRepository.revokedUserIds()).contains(userId);
  }

  /**
   * A1 (H1 security review): two calls racing to rotate the very same refresh token must not both
   * succeed. {@link FakeRefreshTokenRepository#revoke} mirrors the production atomic {@code UPDATE
   * ... WHERE revoked_at IS NULL} (only the first caller to observe {@code revokedAt == null} flips
   * it); driving `execute` twice sequentially with the same raw token exercises exactly the
   * decision {@code RefreshAccessToken} makes when it loses that race — the second call must be
   * rejected as reuse, and, as containment, revoke every remaining token of the user (so a stolen,
   * already-rotated token can never be used to keep a session alive).
   */
  @Test
  void aSecondCallWithTheSameRefreshTokenAfterItWasAlreadyRotatedIsRejectedAsReuse_A1() {
    FakeUserRepository userRepository = new FakeUserRepository();
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    UUID userId = UUID.randomUUID();
    userRepository.seed(
        new User(userId, "ana@fitapp.test", "hash", "1.0", true, Instant.now(FIXED_CLOCK), null));
    String rawToken = "raw-refresh-token";
    RefreshToken stored =
        new RefreshToken(
            UUID.randomUUID(),
            userId,
            OpaqueTokens.hash(rawToken),
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Instant.now(FIXED_CLOCK).plus(REFRESH_TTL),
            null);
    refreshTokenRepository.save(stored);
    RefreshAccessToken useCase =
        new RefreshAccessToken(
            refreshTokenRepository,
            userRepository,
            new FakeTokenIssuer(),
            FIXED_CLOCK,
            REFRESH_TTL);

    // "Winner": the first call to reach the atomic revoke succeeds and rotates normally.
    AuthTokensResult winner = useCase.execute(rawToken);
    assertThat(winner.refreshToken()).isNotEqualTo(rawToken);

    // "Loser": a second call presenting the very same (now-consumed) raw token — in the real race
    // this is a concurrent request that lost the atomic UPDATE; here it is simulated by replaying
    // the same token after it was already rotated. Must be rejected, not silently accepted.
    assertThatThrownBy(() -> useCase.execute(rawToken))
        .isInstanceOf(InvalidRefreshTokenException.class);
    // Containment: every token of the user (including the one just minted for the winner) is
    // revoked defensively.
    assertThat(refreshTokenRepository.revokedUserIds()).contains(userId);
    assertThat(refreshTokenRepository.findByTokenHash(OpaqueTokens.hash(winner.refreshToken())))
        .get()
        .extracting(RefreshToken::isRevoked)
        .isEqualTo(true);
  }

  @Test
  void rejectsAnExpiredRefreshToken() {
    FakeUserRepository userRepository = new FakeUserRepository();
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    UUID userId = UUID.randomUUID();
    userRepository.seed(
        new User(userId, "ana@fitapp.test", "hash", "1.0", true, Instant.now(FIXED_CLOCK), null));
    String rawToken = "raw-refresh-token";
    RefreshToken expired =
        new RefreshToken(
            UUID.randomUUID(),
            userId,
            OpaqueTokens.hash(rawToken),
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK).minus(REFRESH_TTL).minusSeconds(1),
            Instant.now(FIXED_CLOCK).minusSeconds(1),
            null);
    refreshTokenRepository.save(expired);
    RefreshAccessToken useCase =
        new RefreshAccessToken(
            refreshTokenRepository,
            userRepository,
            new FakeTokenIssuer(),
            FIXED_CLOCK,
            REFRESH_TTL);

    assertThatThrownBy(() -> useCase.execute(rawToken))
        .isInstanceOf(InvalidRefreshTokenException.class);
  }
}
