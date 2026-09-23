package com.fitapp.identity.application;

import com.fitapp.identity.domain.OpaqueTokens;
import com.fitapp.identity.domain.RefreshToken;
import com.fitapp.identity.domain.RefreshTokenRepository;
import com.fitapp.identity.domain.TokenIssuer;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

/**
 * Issues a fresh access/refresh token pair for an already-identified user. Deliberately not part of
 * {@link RegisterUser}/{@link LoginUser} (whose constructors are already fixed by {@code
 * RegisterUserTest}/{@code LoginUserTest}): the web adapter (`AuthController`) calls the relevant
 * use case first, then this class, and assembles the `AuthTokens` HTTP response.
 */
public class IssueTokensForUser {

  private final RefreshTokenRepository refreshTokenRepository;
  private final TokenIssuer tokenIssuer;
  private final Clock clock;
  private final Duration refreshTokenTtl;

  public IssueTokensForUser(
      RefreshTokenRepository refreshTokenRepository,
      TokenIssuer tokenIssuer,
      Clock clock,
      Duration refreshTokenTtl) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.tokenIssuer = tokenIssuer;
    this.clock = clock;
    this.refreshTokenTtl = refreshTokenTtl;
  }

  @Transactional
  public AuthTokensResult issue(UUID userId, String email) {
    Instant now = clock.instant();
    String accessToken = tokenIssuer.issueAccessToken(userId, email, now);
    String rawRefreshToken = OpaqueTokens.generate();
    RefreshToken refreshToken =
        new RefreshToken(
            UUID.randomUUID(),
            userId,
            OpaqueTokens.hash(rawRefreshToken),
            UUID.randomUUID(),
            now,
            now.plus(refreshTokenTtl),
            null);
    refreshTokenRepository.save(refreshToken);
    return new AuthTokensResult(accessToken, rawRefreshToken, userId, email);
  }
}
