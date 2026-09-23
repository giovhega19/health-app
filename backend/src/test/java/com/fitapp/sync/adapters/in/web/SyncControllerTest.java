package com.fitapp.sync.adapters.in.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fitapp.sync.application.PullResult;
import com.fitapp.sync.application.PullSyncChanges;
import com.fitapp.sync.application.PushResult;
import com.fitapp.sync.application.PushSyncChanges;
import com.fitapp.sync.application.SyncRejection;
import com.fitapp.sync.domain.SyncChange;
import java.time.Instant;
import java.util.List;
import java.util.Map;
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
 * CA-01.01.1/CA-01.06.1 {@link SyncController} — `/sync/push` and `/sync/pull`
 * (`packages/api-contract/openapi.yaml`, tag {@code sync}). Same {@code standaloneSetup} +
 * {@code @AuthenticationPrincipal Jwt} approach as the other H1 controller tests; the use cases
 * themselves ({@code PushSyncChangesTest}, {@code PullSyncChangesTest}) already cover the LWW/
 * cursor logic, so this class only exercises the HTTP <-> domain mapping.
 */
@ExtendWith(MockitoExtension.class)
class SyncControllerTest {

  private static final ObjectMapper OBJECT_MAPPER =
      new ObjectMapper().registerModule(new JavaTimeModule());

  @Mock private PushSyncChanges pushSyncChanges;
  @Mock private PullSyncChanges pullSyncChanges;

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
        MockMvcBuilders.standaloneSetup(new SyncController(pushSyncChanges, pullSyncChanges))
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void POST_sync_push_maps_accepted_and_rejected_changes() throws Exception {
    UUID acceptedId = UUID.randomUUID();
    UUID rejectedId = UUID.randomUUID();
    Instant serverTime = Instant.parse("2026-09-22T10:05:00Z");
    when(pushSyncChanges.execute(eq(userId), any()))
        .thenReturn(
            new PushResult(
                List.of(acceptedId),
                List.of(new SyncRejection(rejectedId, "STALE_UPDATE", "Newer version on server.")),
                serverTime));

    SyncPushRequestDto request =
        new SyncPushRequestDto(
            "device-1",
            List.of(
                new SyncChangeDto(
                    "profile",
                    "upsert",
                    acceptedId,
                    Instant.parse("2026-09-22T09:00:00Z"),
                    Map.of("gender", "female")),
                new SyncChangeDto(
                    "profile",
                    "upsert",
                    rejectedId,
                    Instant.parse("2026-09-20T09:00:00Z"),
                    Map.of())));

    mockMvc
        .perform(
            post("/api/v1/sync/push")
                .header("Idempotency-Key", "idem-key-1")
                .contentType("application/json")
                .content(OBJECT_MAPPER.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.accepted[0]").value(acceptedId.toString()))
        .andExpect(jsonPath("$.rejected[0].id").value(rejectedId.toString()))
        .andExpect(jsonPath("$.rejected[0].code").value("STALE_UPDATE"));
  }

  @Test
  void GET_sync_pull_maps_the_page_cursor_and_hasMore_flag() throws Exception {
    UUID changeId = UUID.randomUUID();
    SyncChange change =
        new SyncChange(
            "bodyMetric", "upsert", changeId, Instant.parse("2026-09-22T09:00:00Z"), Map.of());
    when(pullSyncChanges.execute(userId, "cursor-1", 100))
        .thenReturn(new PullResult(List.of(change), "cursor-2", true));

    mockMvc
        .perform(get("/api/v1/sync/pull").param("cursor", "cursor-1").param("limit", "100"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.changes[0].entity").value("bodyMetric"))
        .andExpect(jsonPath("$.nextCursor").value("cursor-2"))
        .andExpect(jsonPath("$.hasMore").value(true));
  }

  @Test
  void GET_sync_pull_defaults_the_limit_to_500_when_absent() throws Exception {
    when(pullSyncChanges.execute(eq(userId), eq((String) null), eq(500)))
        .thenReturn(new PullResult(List.of(), null, false));

    mockMvc
        .perform(get("/api/v1/sync/pull"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.changes").isEmpty())
        .andExpect(jsonPath("$.hasMore").value(false));

    verify(pullSyncChanges).execute(userId, null, 500);
  }
}
