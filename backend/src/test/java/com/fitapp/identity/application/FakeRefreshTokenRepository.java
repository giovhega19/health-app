package com.fitapp.identity.application;

import com.fitapp.identity.domain.RefreshToken;
import com.fitapp.identity.domain.RefreshTokenRepository;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** In-memory fake of {@link RefreshTokenRepository}. */
public class FakeRefreshTokenRepository implements RefreshTokenRepository {

  private final Map<UUID, RefreshToken> byId = new HashMap<>();
  private final Set<UUID> revokedUsers = new HashSet<>();

  @Override
  public RefreshToken save(RefreshToken token) {
    byId.put(token.id(), token);
    return token;
  }

  @Override
  public Optional<RefreshToken> findByTokenHash(String tokenHash) {
    return byId.values().stream().filter(token -> token.tokenHash().equals(tokenHash)).findFirst();
  }

  @Override
  public synchronized boolean revoke(UUID tokenId) {
    RefreshToken token = byId.get(tokenId);
    // Mirrors the production atomic `UPDATE ... WHERE revoked_at IS NULL`: only the first caller
    // to observe `revokedAt == null` wins and actually flips it; every other call (already
    // revoked) returns false. `synchronized` so this fake is also safe if a test drives it from
    // multiple threads.
    if (token == null || token.isRevoked()) {
      return false;
    }
    byId.put(tokenId, token.revoke(Instant.now()));
    return true;
  }

  @Override
  public void revokeAllForUser(UUID userId) {
    revokedUsers.add(userId);
    byId.replaceAll(
        (id, token) ->
            token.userId().equals(userId) && !token.isRevoked()
                ? token.revoke(Instant.now())
                : token);
  }

  /** Users for whom {@link #revokeAllForUser(UUID)} was called at least once. */
  public Set<UUID> revokedUserIds() {
    return revokedUsers;
  }
}
