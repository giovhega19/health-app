package com.fitapp.shared.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT signing configuration (`fitapp.security.jwt.*`, `application.yml`). Access tokens are signed
 * HS256 with {@link #secret()}; the same secret is used by the OAuth2 Resource Server JWT decoder
 * in {@link SecurityConfig} so the backend both issues and validates its own tokens
 * (04-arquitectura.md §2: "Spring Security OAuth2 Resource Server con JWT").
 */
@ConfigurationProperties(prefix = "fitapp.security.jwt")
public record JwtProperties(String secret, Duration accessTokenTtl, Duration refreshTokenTtl) {}
