package com.fitapp.identity.domain;

import java.util.Optional;
import java.util.UUID;

/**
 * Out port for refresh token persistence, rotation and revocation (rotation on `/auth/refresh`,
 * revocation on `DELETE /me` and `/auth/logout`, `specs/F01-perfil-onboarding/plan.md` §2/§3).
 */
public interface RefreshTokenRepository {

  RefreshToken save(RefreshToken token);

  /** {@code tokenHash} is the hash of the raw opaque token value sent by the client. */
  Optional<RefreshToken> findByTokenHash(String tokenHash);

  /**
   * Atomically revokes the token, but only if it was not already revoked — implementations must
   * back this with a single conditional write (e.g. {@code UPDATE ... WHERE id = :id AND revoked_at
   * IS NULL}, checking exactly one row was affected), not a separate read-then-write.
   *
   * <p>This is what makes refresh-token rotation safe under concurrency (A1, H1 security review):
   * two concurrent {@code /auth/refresh} calls presenting the same, still-valid refresh token both
   * used to read {@code revokedAt == null} before either had revoked it, so both could go on to
   * mint a new token from the same single-use token. With an atomic conditional write, only one
   * caller's revoke can ever return {@code true}; the loser gets {@code false} and must treat that
   * as reuse of an already-consumed token, not silently retry.
   *
   * @return {@code true} if this call is the one that flipped {@code revokedAt} from {@code null}
   *     to now (i.e. this caller "won"); {@code false} if the token was already revoked (by an
   *     earlier legitimate rotation/logout, or by a concurrent caller that won the race) or does
   *     not exist.
   */
  boolean revoke(UUID tokenId);

  /** Revokes every refresh token of a user (account deletion, or reuse-detection response). */
  void revokeAllForUser(UUID userId);
}
