package com.fitapp.training.adapters.out.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.sync.domain.SyncEntityHandler;
import com.fitapp.training.domain.CustomExercise;
import com.fitapp.training.domain.CustomExerciseRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link SyncEntityHandler} for {@code entity: "customExercise"} (F03-T15). Same ownership-checked
 * LWW pattern as {@link RoutineSyncEntityHandler} — see its Javadoc for why the ownership check is
 * needed here but not in `profile`'s H1 handlers.
 */
@Component
public class CustomExerciseSyncEntityHandler implements SyncEntityHandler {

  private final CustomExerciseRepository customExerciseRepository;
  private final ObjectMapper objectMapper;

  public CustomExerciseSyncEntityHandler(
      CustomExerciseRepository customExerciseRepository, ObjectMapper objectMapper) {
    this.customExerciseRepository = customExerciseRepository;
    this.objectMapper = objectMapper;
  }

  @Override
  public String supportedEntity() {
    return "customExercise";
  }

  @Override
  @Transactional
  public SyncApplyResult apply(UUID userId, SyncChange change) {
    if (!change.isUpsert()) {
      return applyDelete(userId, change);
    }
    CustomExercise existing = customExerciseRepository.findById(change.id()).orElse(null);
    if (existing != null && !existing.userId().equals(userId)) {
      return SyncApplyResult.rejected("FORBIDDEN", "This custom exercise belongs to another user.");
    }
    if (existing != null && !change.updatedAt().isAfter(existing.updatedAt())) {
      return SyncApplyResult.ok();
    }
    try {
      CustomExerciseSyncPayload payload =
          objectMapper.convertValue(change.data(), CustomExerciseSyncPayload.class);
      CustomExercise toSave =
          new CustomExercise(
              change.id(),
              userId,
              payload.name(),
              payload.notes(),
              payload.photoUri(),
              payload.muscleGroups() == null ? List.of() : payload.muscleGroups(),
              payload.mode(),
              change.updatedAt());
      customExerciseRepository.save(toSave);
      return SyncApplyResult.ok();
    } catch (RuntimeException e) {
      return SyncApplyResult.rejected("VALIDATION_ERROR", "Malformed customExercise payload.");
    }
  }

  private SyncApplyResult applyDelete(UUID userId, SyncChange change) {
    CustomExercise existing = customExerciseRepository.findById(change.id()).orElse(null);
    if (existing == null || !existing.userId().equals(userId)) {
      return SyncApplyResult.ok();
    }
    if (!change.updatedAt().isAfter(existing.updatedAt())) {
      return SyncApplyResult.ok();
    }
    customExerciseRepository.deleteById(change.id());
    return SyncApplyResult.ok();
  }

  @Override
  public List<SyncChange> pullSince(UUID userId, Instant since, UUID sinceId, int limit) {
    return customExerciseRepository.findByUserIdUpdatedSince(userId, since, limit + 1).stream()
        .filter(exercise -> isAfterCursor(exercise, since, sinceId))
        .limit(limit)
        .map(this::toChange)
        .toList();
  }

  private static boolean isAfterCursor(CustomExercise exercise, Instant since, UUID sinceId) {
    return exercise.updatedAt().isAfter(since)
        || (exercise.updatedAt().equals(since) && exercise.id().compareTo(sinceId) > 0);
  }

  private SyncChange toChange(CustomExercise exercise) {
    Map<String, Object> data =
        objectMapper.convertValue(
            new CustomExerciseSyncPayload(
                exercise.name(),
                exercise.notes(),
                exercise.photoUri(),
                exercise.muscleGroups(),
                exercise.mode()),
            new TypeReference<Map<String, Object>>() {});
    return new SyncChange("customExercise", "upsert", exercise.id(), exercise.updatedAt(), data);
  }
}
