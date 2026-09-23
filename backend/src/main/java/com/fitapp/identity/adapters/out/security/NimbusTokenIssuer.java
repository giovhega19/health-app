package com.fitapp.identity.adapters.out.security;

import com.fitapp.identity.domain.TokenIssuer;
import com.fitapp.shared.config.JwtProperties;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Real {@link TokenIssuer} adapter: HS256 JWT with Nimbus JOSE+JWT, claims {@code sub} (user id),
 * {@code email}, {@code iat}, {@code exp} (`specs/F01-perfil-onboarding/plan.md` §3). Validated
 * back by {@code com.fitapp.shared.config.SecurityConfig#jwtDecoder} using the same {@link
 * JwtProperties#secret()}.
 */
@Component
public class NimbusTokenIssuer implements TokenIssuer {

  private final JwtProperties jwtProperties;

  public NimbusTokenIssuer(JwtProperties jwtProperties) {
    this.jwtProperties = jwtProperties;
  }

  @Override
  public String issueAccessToken(UUID userId, String email, Instant issuedAt) {
    try {
      JWTClaimsSet claims =
          new JWTClaimsSet.Builder()
              .subject(userId.toString())
              .claim("email", email)
              .issueTime(Date.from(issuedAt))
              .expirationTime(Date.from(issuedAt.plus(jwtProperties.accessTokenTtl())))
              .build();
      SignedJWT signedJwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
      signedJwt.sign(new MACSigner(jwtProperties.secret().getBytes(StandardCharsets.UTF_8)));
      return signedJwt.serialize();
    } catch (JOSEException e) {
      throw new IllegalStateException("Could not sign access token", e);
    }
  }
}
