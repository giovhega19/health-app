package com.fitapp.shared.config;

import com.fitapp.shared.web.AuthRateLimitFilter;
import com.fitapp.shared.web.ProblemAuthenticationEntryPoint;
import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * OAuth2 Resource Server security (04-arquitectura.md §2: "Spring Security OAuth2 Resource Server
 * con JWT"). Stateless (no HTTP session, Art. 4: the mobile client is offline-first and carries its
 * own bearer token). `/auth/*` and `/catalog/*` are public per `openapi.yaml` (`security: []`);
 * everything else (`/me/**`, `/sync/**`) requires a valid access token.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private static final String[] PUBLIC_PATHS = {
    "/api/v1/auth/**", "/api/v1/catalog/**", "/actuator/health/**"
  };

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http,
      JwtDecoder jwtDecoder,
      ProblemAuthenticationEntryPoint entryPoint,
      AuthRateLimitFilter authRateLimitFilter)
      throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            authorize ->
                authorize.requestMatchers(PUBLIC_PATHS).permitAll().anyRequest().authenticated())
        .oauth2ResourceServer(
            oauth2 ->
                oauth2.jwt(jwt -> jwt.decoder(jwtDecoder)).authenticationEntryPoint(entryPoint))
        .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  /**
   * Validates the HS256 access tokens issued by {@code
   * identity.adapters.out.security.NimbusTokenIssuer} using the same shared secret (this backend
   * both issues and validates its own tokens; there is no external Authorization Server).
   */
  @Bean
  public JwtDecoder jwtDecoder(JwtProperties jwtProperties) {
    SecretKeySpec key =
        new SecretKeySpec(jwtProperties.secret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
  }
}
