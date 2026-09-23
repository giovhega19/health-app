package com.fitapp.sync.adapters.in.web;

import com.fitapp.sync.application.PullResult;
import com.fitapp.sync.application.PullSyncChanges;
import com.fitapp.sync.application.PushResult;
import com.fitapp.sync.application.PushSyncChanges;
import com.fitapp.sync.application.SyncRejection;
import com.fitapp.sync.domain.SyncChange;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for `/sync/*` (`packages/api-contract/openapi.yaml`, tag {@code sync}). The
 * `Idempotency-Key` header is accepted (contract requirement) but not separately deduplicated: see
 * {@link PushSyncChanges} javadoc for why the LWW upsert semantics already make retries safe.
 */
@RestController
public class SyncController {

  private final PushSyncChanges pushSyncChanges;
  private final PullSyncChanges pullSyncChanges;

  public SyncController(PushSyncChanges pushSyncChanges, PullSyncChanges pullSyncChanges) {
    this.pushSyncChanges = pushSyncChanges;
    this.pullSyncChanges = pullSyncChanges;
  }

  @PostMapping("/api/v1/sync/push")
  public SyncPushResponseDto push(
      @AuthenticationPrincipal Jwt jwt,
      @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
      @Valid @RequestBody SyncPushRequestDto request) {
    List<SyncChange> changes = request.changes().stream().map(SyncController::toDomain).toList();
    PushResult result = pushSyncChanges.execute(userId(jwt), changes);
    return new SyncPushResponseDto(
        result.accepted(),
        result.rejected().stream().map(SyncController::toDto).toList(),
        result.serverTime());
  }

  @GetMapping("/api/v1/sync/pull")
  public SyncPullResponseDto pull(
      @AuthenticationPrincipal Jwt jwt,
      @RequestParam(required = false) String cursor,
      @RequestParam(required = false, defaultValue = "500") int limit) {
    PullResult result = pullSyncChanges.execute(userId(jwt), cursor, limit);
    return new SyncPullResponseDto(
        result.changes().stream().map(SyncController::toDto).toList(),
        result.nextCursor(),
        result.hasMore());
  }

  private static UUID userId(Jwt jwt) {
    return UUID.fromString(jwt.getSubject());
  }

  private static SyncChange toDomain(SyncChangeDto dto) {
    return new SyncChange(dto.entity(), dto.op(), dto.id(), dto.updatedAt(), dto.data());
  }

  private static SyncChangeDto toDto(SyncChange change) {
    return new SyncChangeDto(
        change.entity(), change.op(), change.id(), change.updatedAt(), change.data());
  }

  private static SyncRejectionDto toDto(SyncRejection rejection) {
    return new SyncRejectionDto(rejection.id(), rejection.code(), rejection.detail());
  }
}
