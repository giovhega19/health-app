package com.fitapp.shared.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Rate limit for `/auth/*` (06-contratos-api.md §1: "10 req/min por IP"). See {@code
 * fitapp.security.rate-limit.auth.*} in `application.yml`.
 */
@ConfigurationProperties(prefix = "fitapp.security.rate-limit.auth")
public record AuthRateLimitProperties(int maxRequests, Duration window) {

  public AuthRateLimitProperties {
    if (maxRequests <= 0) {
      maxRequests = 10;
    }
    if (window == null) {
      window = Duration.ofMinutes(1);
    }
  }
}
