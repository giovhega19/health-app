package com.fitapp.identity.application;

import com.fitapp.identity.domain.InvalidRefreshTokenException;
import com.fitapp.identity.domain.OpaqueTokens;
import com.fitapp.identity.domain.RefreshToken;
import com.fitapp.identity.domain.RefreshTokenRepository;
import com.fitapp.identity.domain.TokenIssuer;
import com.fitapp.identity.domain.User;
import com.fitapp.identity.domain.UserRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-01.01 `POST /auth/refresh`: rotates the refresh token (the one presented is revoked; a new one
 * is issued in the same {@code familyId}) and issues a new access token.
 *
 * <p>Reuse detection: if the presented refresh token was already revoked (i.e. it was already
 * rotated once before, or explicitly logged out), that is a signal it may have leaked — every
 * refresh token of the user is revoked defensively, forcing a fresh login everywhere.
 *
 * <p>A1 (H1 security review): "already revoked" is decided by the return value of {@link
 * RefreshTokenRepository#revoke(UUID)} itself (an atomic, single-use conditional write), not by a
 * separate, stale {@code isRevoked()} read taken earlier — reading first and revoking later is
 * exactly the race that let two concurrent {@code /auth/refresh} calls for the same token both mint
 * a valid new token. See that method's Javadoc.
 */
public class RefreshAccessToken {

  private final RefreshTokenRepository refreshTokenRepository;
  private final UserRepository userRepository;
  private final TokenIssuer tokenIssuer;
  private final Clock clock;
  private final Duration refreshTokenTtl;

  public RefreshAccessToken(
      RefreshTokenRepository refreshTokenRepository,
      UserRepository userRepository,
      TokenIssuer tokenIssuer,
      Clock clock,
      Duration refreshTokenTtl) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.userRepository = userRepository;
    this.tokenIssuer = tokenIssuer;
    this.clock = clock;
    this.refreshTokenTtl = refreshTokenTtl;
  }

  @Transactional
  public AuthTokensResult execute(String rawRefreshToken) {
    RefreshToken existing =
        refreshTokenRepository
            .findByTokenHash(OpaqueTokens.hash(rawRefreshToken))
            .orElseThrow(InvalidRefreshTokenException::new);
    if (existing.isExpired(clock)) {
      throw new InvalidRefreshTokenException();
    }
    if (!refreshTokenRepository.revoke(existing.id())) {
      // 0 rows affected by the atomic UPDATE: this token was already revoked — either a
      // legitimate earlier rotation/logout being replayed, or (the race this fixes) a concurrent
      // /auth/refresh call for the very same token that won the atomic update first. A single-use
      // refresh token being presented a second time is reuse either way: revoke every token of the
      // user defensively (possible token theft containment).
      refreshTokenRepository.revokeAllForUser(existing.userId());
      throw new InvalidRefreshTokenException();
    }
    User user =
        userRepository
            .findById(existing.userId())
            .filter(candidate -> !candidate.isDeleted())
            .orElseThrow(InvalidRefreshTokenException::new);

    Instant now = clock.instant();
    String accessToken = tokenIssuer.issueAccessToken(user.id(), user.email(), now);
    String newRawRefreshToken = OpaqueTokens.generate();
    RefreshToken rotated =
        new RefreshToken(
            UUID.randomUUID(),
            user.id(),
            OpaqueTokens.hash(newRawRefreshToken),
            existing.familyId(),
            now,
            now.plus(refreshTokenTtl),
            null);
    refreshTokenRepository.save(rotated);
    return new AuthTokensResult(accessToken, newRawRefreshToken, user.id(), user.email());
  }
}
