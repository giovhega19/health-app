package com.fitapp.profile.adapters.in.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fitapp.profile.application.GetBodyMetrics;
import com.fitapp.profile.application.GetProfile;
import com.fitapp.profile.application.UpsertProfile;
import com.fitapp.profile.application.UpsertProfileCommand;
import com.fitapp.profile.application.UpsertProfileResult;
import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.profile.domain.ProfileSnapshot;
import com.fitapp.shared.web.ApiExceptionHandler;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * RF-01.03/RF-01.06 {@link ProfileController} — `/me/profile` and `/me/body-metrics`
 * (`packages/api-contract/openapi.yaml`, tag {@code profile}). Same {@code standaloneSetup} +
 * {@code @AuthenticationPrincipal Jwt} resolution approach as {@code MeControllerTest}, plus the
 * real {@link ApiExceptionHandler} for the "no profile yet" (404) case.
 */
@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

  private static final ObjectMapper OBJECT_MAPPER =
      new ObjectMapper().registerModule(new JavaTimeModule());

  @Mock private GetProfile getProfile;
  @Mock private UpsertProfile upsertProfile;
  @Mock private GetBodyMetrics getBodyMetrics;

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
        MockMvcBuilders.standaloneSetup(
                new ProfileController(getProfile, upsertProfile, getBodyMetrics))
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .setControllerAdvice(new ApiExceptionHandler())
            .build();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  private static ProfileSnapshot aSnapshot(UUID userId) {
    return new ProfileSnapshot(
        UUID.randomUUID(),
        userId,
        LocalDate.of(1995, 6, 1),
        "female",
        170.0,
        "lose_weight",
        "beginner",
        3,
        45,
        List.of("dumbbells"),
        "METRIC",
        65.0,
        false,
        Instant.parse("2026-01-01T00:00:00Z"),
        Instant.parse("2026-09-01T00:00:00Z"));
  }

  @Test
  void CA_01_03_GET_me_profile_returns_the_stored_snapshot() throws Exception {
    when(getProfile.execute(userId)).thenReturn(aSnapshot(userId));

    mockMvc
        .perform(get("/api/v1/me/profile"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.gender").value("female"))
        .andExpect(jsonPath("$.goal").value("lose_weight"))
        .andExpect(jsonPath("$.daysPerWeek").value(3));
  }

  @Test
  void GET_me_profile_maps_a_missing_profile_to_404() throws Exception {
    when(getProfile.execute(userId)).thenThrow(new java.util.NoSuchElementException("no profile"));

    mockMvc
        .perform(get("/api/v1/me/profile"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("NOT_FOUND"));
  }

  @Test
  void CA_01_03_PUT_me_profile_upserts_and_returns_the_fresh_snapshot() throws Exception {
    when(upsertProfile.execute(any(UpsertProfileCommand.class)))
        .thenReturn(new UpsertProfileResult(UUID.randomUUID()));
    when(getProfile.execute(userId)).thenReturn(aSnapshot(userId));

    UserProfileDto request =
        new UserProfileDto(
            null,
            LocalDate.of(1995, 6, 1),
            "female",
            170.0,
            "lose_weight",
            "beginner",
            3,
            45,
            null,
            "METRIC",
            65.0,
            false,
            null,
            null);

    mockMvc
        .perform(
            put("/api/v1/me/profile")
                .contentType("application/json")
                .content(OBJECT_MAPPER.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.gender").value("female"));

    ArgumentCaptor<UpsertProfileCommand> captor =
        ArgumentCaptor.forClass(UpsertProfileCommand.class);
    org.mockito.Mockito.verify(upsertProfile).execute(captor.capture());
    assertThat(captor.getValue().userId()).isEqualTo(userId);
    // A null `equipment` in the request body is normalized to an empty list (line 58 of the
    // controller), not passed through as null.
    assertThat(captor.getValue().equipment()).isEmpty();
  }

  @Test
  void CA_01_06_1_GET_me_body_metrics_returns_the_items_in_the_requested_range() throws Exception {
    BodyMetric metric =
        new BodyMetric(
            UUID.randomUUID(),
            userId,
            LocalDate.of(2026, 9, 1),
            72.5,
            80.0,
            Instant.parse("2026-09-01T08:00:00Z"));
    when(getBodyMetrics.execute(userId, LocalDate.of(2026, 8, 1), LocalDate.of(2026, 9, 30)))
        .thenReturn(List.of(metric));

    mockMvc
        .perform(
            get("/api/v1/me/body-metrics").param("from", "2026-08-01").param("to", "2026-09-30"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items[0].weightKg").value(72.5))
        .andExpect(jsonPath("$.items[0].waistCm").value(80.0));
  }
}
