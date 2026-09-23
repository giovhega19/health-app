package com.fitapp.identity.adapters.in.web;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fitapp.identity.application.DeleteAccount;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * RF-01.08 {@link MeController} — `DELETE /me` (CA-01.08.1): the JWT `sub` claim is resolved into
 * the {@code userId} passed to {@link DeleteAccount}, and the endpoint answers `202 Accepted`
 * (async purge, Art. 5.4). {@code standaloneSetup} plus {@link
 * AuthenticationPrincipalArgumentResolver} so {@code @AuthenticationPrincipal Jwt} resolves the
 * same way it does in the real Spring Security resource-server filter chain, without needing the
 * full Spring context.
 */
@ExtendWith(MockitoExtension.class)
class MeControllerTest {

  @Mock private DeleteAccount deleteAccount;

  private MockMvc mockMvc;
  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    Jwt jwt =
        Jwt.withTokenValue("a-jwt-token")
            .header("alg", "RS256")
            .claim("sub", userId.toString())
            .issuedAt(Instant.parse("2026-09-22T10:00:00Z"))
            .expiresAt(Instant.parse("2026-09-22T11:00:00Z"))
            .build();
    SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));

    mockMvc =
        MockMvcBuilders.standaloneSetup(new MeController(deleteAccount))
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void CA_01_08_1_DELETE_me_soft_deletes_the_authenticated_account() throws Exception {
    mockMvc.perform(delete("/api/v1/me")).andExpect(status().isAccepted());

    verify(deleteAccount).execute(userId);
  }
}
