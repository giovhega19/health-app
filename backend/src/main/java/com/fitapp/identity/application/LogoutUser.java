package com.fitapp.identity.application;

import com.fitapp.identity.domain.InvalidRefreshTokenException;
import com.fitapp.identity.domain.OpaqueTokens;
import com.fitapp.identity.domain.RefreshToken;
import com.fitapp.identity.domain.RefreshTokenRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-01.01 `POST /auth/logout`: revokes the presented refresh token.
 *
 * <p>A1 (H1 security review): whether the token "was usable" is decided by the atomic {@link
 * RefreshTokenRepository#revoke(UUID)} call itself, not by a separate, stale {@code isRevoked()}
 * pre-check (same race as {@code RefreshAccessToken}, see that class's Javadoc) — a token
 * concurrently revoked by another request between the read and the write must not be reported as
 * "logged out successfully" here.
 */
@Component
public class LogoutUser {

  private final RefreshTokenRepository refreshTokenRepository;

  public LogoutUser(RefreshTokenRepository refreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  @Transactional
  public void execute(String rawRefreshToken) {
    RefreshToken token =
        refreshTokenRepository
            .findByTokenHash(OpaqueTokens.hash(rawRefreshToken))
            .orElseThrow(InvalidRefreshTokenException::new);
    if (!refreshTokenRepository.revoke(token.id())) {
      throw new InvalidRefreshTokenException();
    }
  }
}
