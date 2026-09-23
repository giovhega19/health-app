package com.fitapp.identity.application;

import com.fitapp.identity.domain.TokenIssuer;
import java.time.Instant;
import java.util.UUID;

/** Deterministic in-memory fake of {@link TokenIssuer} (no real JWT signing in unit tests). */
public class FakeTokenIssuer implements TokenIssuer {

  @Override
  public String issueAccessToken(UUID userId, String email, Instant issuedAt) {
    return "fake-access-token-for-" + userId;
  }
}
