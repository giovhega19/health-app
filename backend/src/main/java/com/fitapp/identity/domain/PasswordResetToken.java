package com.fitapp.identity.domain;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

/**
 * Single-use password recovery token (RF-01.01, `06-contratos-api.md` §2: "token de un solo uso (30
 * min)"). {@code usedAt} is set the first time it is redeemed via {@code ResetPassword}; reused or
 * expired tokens are rejected with {@link InvalidPasswordResetTokenException}.
 */
public record PasswordResetToken(
    UUID id, UUID userId, String tokenHash, Instant createdAt, Instant expiresAt, Instant usedAt) {

  public boolean isUsable(Clock clock) {
    return usedAt == null && expiresAt.isAfter(clock.instant());
  }

  public PasswordResetToken markUsed(Instant when) {
    return new PasswordResetToken(id, userId, tokenHash, createdAt, expiresAt, when);
  }
}
