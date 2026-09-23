package com.fitapp.identity.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.identity.domain.OpaqueTokens;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Issues a fresh access/refresh token pair, used by every identity endpoint that logs a user in.
 */
class IssueTokensForUserTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);
  private static final Duration REFRESH_TTL = Duration.ofDays(30);

  @Test
  void issuesAnAccessTokenAndPersistsARefreshTokenHash() {
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    IssueTokensForUser useCase =
        new IssueTokensForUser(
            refreshTokenRepository, new FakeTokenIssuer(), FIXED_CLOCK, REFRESH_TTL);
    UUID userId = UUID.randomUUID();

    AuthTokensResult result = useCase.issue(userId, "ana@fitapp.test");

    assertThat(result.userId()).isEqualTo(userId);
    assertThat(result.email()).isEqualTo("ana@fitapp.test");
    assertThat(result.accessToken()).isNotBlank();
    assertThat(refreshTokenRepository.findByTokenHash(OpaqueTokens.hash(result.refreshToken())))
        .isPresent();
  }

  @Test
  void issuingTwiceProducesDifferentRefreshTokens() {
    FakeRefreshTokenRepository refreshTokenRepository = new FakeRefreshTokenRepository();
    IssueTokensForUser useCase =
        new IssueTokensForUser(
            refreshTokenRepository, new FakeTokenIssuer(), FIXED_CLOCK, REFRESH_TTL);
    UUID userId = UUID.randomUUID();

    AuthTokensResult first = useCase.issue(userId, "ana@fitapp.test");
    AuthTokensResult second = useCase.issue(userId, "ana@fitapp.test");

    assertThat(first.refreshToken()).isNotEqualTo(second.refreshToken());
  }
}
