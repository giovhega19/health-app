package com.fitapp.identity.domain;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

/**
 * Rotating refresh token (`specs/F01-perfil-onboarding/plan.md` §2/§4: "rotación, revocación,
 * expiración 30 d"). {@code familyId} stays the same across every rotation of a single login
 * session; it is used to revoke a whole family at once when reuse of an already-rotated token is
 * detected (a sign the token may have been stolen).
 */
public record RefreshToken(
    UUID id,
    UUID userId,
    String tokenHash,
    UUID familyId,
    Instant createdAt,
    Instant expiresAt,
    Instant revokedAt) {

  public boolean isRevoked() {
    return revokedAt != null;
  }

  public boolean isExpired(Clock clock) {
    return !expiresAt.isAfter(clock.instant());
  }

  public boolean isUsable(Clock clock) {
    return !isRevoked() && !isExpired(clock);
  }

  public RefreshToken revoke(Instant when) {
    return new RefreshToken(id, userId, tokenHash, familyId, createdAt, expiresAt, when);
  }
}
