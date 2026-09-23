package com.fitapp.identity;

import com.fitapp.identity.application.IssueTokensForUser;
import com.fitapp.identity.application.RefreshAccessToken;
import com.fitapp.identity.domain.RefreshTokenRepository;
import com.fitapp.identity.domain.TokenIssuer;
import com.fitapp.identity.domain.UserRepository;
import com.fitapp.shared.config.JwtProperties;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires the two identity use cases that need a scalar configuration value (the refresh token TTL)
 * rather than only Spring-managed collaborators — {@code @Component} constructor injection cannot
 * resolve a bare {@link java.time.Duration}, so they are built explicitly here instead of being
 * self-annotated like the rest of {@code identity.application} (see {@link
 * com.fitapp.identity.application.RegisterUser} and siblings).
 */
@Configuration
public class IdentityUseCaseConfig {

  @Bean
  public IssueTokensForUser issueTokensForUser(
      RefreshTokenRepository refreshTokenRepository,
      TokenIssuer tokenIssuer,
      Clock clock,
      JwtProperties jwtProperties) {
    return new IssueTokensForUser(
        refreshTokenRepository, tokenIssuer, clock, jwtProperties.refreshTokenTtl());
  }

  @Bean
  public RefreshAccessToken refreshAccessToken(
      RefreshTokenRepository refreshTokenRepository,
      UserRepository userRepository,
      TokenIssuer tokenIssuer,
      Clock clock,
      JwtProperties jwtProperties) {
    return new RefreshAccessToken(
        refreshTokenRepository,
        userRepository,
        tokenIssuer,
        clock,
        jwtProperties.refreshTokenTtl());
  }
}
