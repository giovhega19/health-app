package com.fitapp.identity.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Out port for access token (JWT) issuance (`specs/F01-perfil-onboarding/plan.md` §3: "TokenIssuer
 * (JWT, claims mínimos sub, exp, iat)"). Implemented in {@code identity/adapters/out/security} with
 * Nimbus JOSE+JWT (HS256), validated back by the OAuth2 Resource Server configured in {@code
 * com.fitapp.shared.config.SecurityConfig}.
 */
public interface TokenIssuer {

  /** Issues a signed access token for {@code userId}, valid from {@code issuedAt}. */
  String issueAccessToken(UUID userId, String email, Instant issuedAt);
}
