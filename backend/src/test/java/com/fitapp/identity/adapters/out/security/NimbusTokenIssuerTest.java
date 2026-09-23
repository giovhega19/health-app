package com.fitapp.identity.adapters.out.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.shared.config.JwtProperties;
import com.nimbusds.jwt.SignedJWT;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class NimbusTokenIssuerTest {

  private final JwtProperties properties =
      new JwtProperties(
          "unit-test-secret-at-least-32-bytes-long-0123456789",
          Duration.ofMinutes(15),
          Duration.ofDays(30));
  private final NimbusTokenIssuer issuer = new NimbusTokenIssuer(properties);

  @Test
  void issuesAJwtWithTheExpectedClaims() throws Exception {
    UUID userId = UUID.randomUUID();
    Instant now = Instant.parse("2026-09-22T10:00:00Z");

    String token = issuer.issueAccessToken(userId, "ana@fitapp.test", now);

    SignedJWT parsed = SignedJWT.parse(token);
    assertThat(parsed.getJWTClaimsSet().getSubject()).isEqualTo(userId.toString());
    assertThat(parsed.getJWTClaimsSet().getStringClaim("email")).isEqualTo("ana@fitapp.test");
    assertThat(parsed.getJWTClaimsSet().getExpirationTime().toInstant())
        .isEqualTo(now.plus(properties.accessTokenTtl()));
  }
}
