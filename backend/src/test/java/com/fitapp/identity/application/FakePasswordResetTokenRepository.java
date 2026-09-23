package com.fitapp.identity.application;

import com.fitapp.identity.domain.PasswordResetToken;
import com.fitapp.identity.domain.PasswordResetTokenRepository;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** In-memory fake of {@link PasswordResetTokenRepository}. */
public class FakePasswordResetTokenRepository implements PasswordResetTokenRepository {

  private final Map<UUID, PasswordResetToken> byId = new HashMap<>();

  @Override
  public PasswordResetToken save(PasswordResetToken token) {
    byId.put(token.id(), token);
    return token;
  }

  @Override
  public Optional<PasswordResetToken> findByTokenHash(String tokenHash) {
    return byId.values().stream().filter(token -> token.tokenHash().equals(tokenHash)).findFirst();
  }
}
