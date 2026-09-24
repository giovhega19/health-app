package com.fitapp.training.adapters.out.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.sync.domain.SyncEntityHandler;
import com.fitapp.training.domain.Routine;
import com.fitapp.training.domain.RoutineRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link SyncEntityHandler} for {@code entity: "routine"} (F03-T15). Same last-write-wins pattern
 * as {@code profile.adapters.out.sync.ProfileSyncEntityHandler}/{@code BodyMetricSyncEntityHandler}
 * (RN-18, ADR-007), plus one check those two don't need: unlike a singleton profile or an
 * upsert-by-date body metric, a routine's id is entirely client-generated and could in principle
 * collide with another user's row, so every upsert/delete first confirms the existing row (if any)
 * belongs to the requesting {@code userId} — anti-IDOR, `specs/F03-editor-rutinas/plan.md` §2
 * "userId derivado del JWT, nunca de un parámetro de la petición".
 */
@Component
public class RoutineSyncEntityHandler implements SyncEntityHandler {

  private final RoutineRepository routineRepository;
  private final ObjectMapper objectMapper;

  public RoutineSyncEntityHandler(RoutineRepository routineRepository, ObjectMapper objectMapper) {
    this.routineRepository = routineRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public String supportedEntity() {
    return "routine";
  }

  @Override
  @Transactional
  public SyncApplyResult apply(UUID userId, SyncChange change) {
    if (!change.isUpsert()) {
      return applyDelete(userId, change);
    }
    Routine existing = routineRepository.findById(change.id()).orElse(null);
    if (existing != null && !existing.userId().equals(userId)) {
      return SyncApplyResult.rejected("FORBIDDEN", "This routine belongs to another user.");
    }
    if (existing != null && !change.updatedAt().isAfter(existing.updatedAt())) {
      return SyncApplyResult.ok();
    }
    try {
      RoutineSyncPayload payload =
          objectMapper.convertValue(change.data(), RoutineSyncPayload.class);
      Routine toSave =
          new Routine(
              change.id(),
              userId,
              payload.name(),
              payload.description(),
              payload.goal(),
              payload.level(),
              payload.source(),
              payload.timerDefaults(),
              payload.blocks() == null ? List.of() : payload.blocks(),
              payload.version(),
              change.updatedAt());
      routineRepository.save(toSave);
      return SyncApplyResult.ok();
    } catch (RuntimeException e) {
      return SyncApplyResult.rejected("VALIDATION_ERROR", "Malformed routine payload.");
    }
  }

  private SyncApplyResult applyDelete(UUID userId, SyncChange change) {
    Routine existing = routineRepository.findById(change.id()).orElse(null);
    if (existing == null || !existing.userId().equals(userId)) {
      // Already gone (or never existed / belongs to someone else): deleting is idempotent and
      // must not leak whether another user's id exists, so this is accepted either way.
      return SyncApplyResult.ok();
    }
    if (!change.updatedAt().isAfter(existing.updatedAt())) {
      return SyncApplyResult.ok();
    }
    routineRepository.deleteById(change.id());
    return SyncApplyResult.ok();
  }

  @Override
  public List<SyncChange> pullSince(UUID userId, Instant since, UUID sinceId, int limit) {
    return routineRepository.findByUserIdUpdatedSince(userId, since, limit + 1).stream()
        .filter(routine -> isAfterCursor(routine, since, sinceId))
        .limit(limit)
        .map(this::toChange)
        .toList();
  }

  private static boolean isAfterCursor(Routine routine, Instant since, UUID sinceId) {
    return routine.updatedAt().isAfter(since)
        || (routine.updatedAt().equals(since) && routine.id().compareTo(sinceId) > 0);
  }

  private SyncChange toChange(Routine routine) {
    Map<String, Object> data =
        objectMapper.convertValue(
            new RoutineSyncPayload(
                routine.name(),
                routine.description(),
                routine.goal(),
                routine.level(),
                routine.source(),
                routine.timerDefaults(),
                routine.blocks(),
                routine.version()),
            new TypeReference<Map<String, Object>>() {});
    return new SyncChange("routine", "upsert", routine.id(), routine.updatedAt(), data);
  }
}
