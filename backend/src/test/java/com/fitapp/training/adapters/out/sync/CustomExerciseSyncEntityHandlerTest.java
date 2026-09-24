package com.fitapp.training.adapters.out.sync;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.training.application.FakeCustomExerciseRepository;
import com.fitapp.training.domain.CustomExercise;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** {@link CustomExerciseSyncEntityHandler} (RF-03.07, F03-T15), no database. */
class CustomExerciseSyncEntityHandlerTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  private static ObjectMapper newObjectMapper() {
    return new ObjectMapper().findAndRegisterModules();
  }

  private static Map<String, Object> validPayload() {
    return Map.of(
        "name", "Curl concentrado",
        "notes", "En banco",
        "muscleGroups", List.of("BICEPS"),
        "mode", "REPS");
  }

  @Test
  void supportsTheCustomExerciseEntity() {
    var handler =
        new CustomExerciseSyncEntityHandler(new FakeCustomExerciseRepository(), newObjectMapper());

    assertThat(handler.supportedEntity()).isEqualTo("customExercise");
  }

  @Test
  void appliesAValidUpsertForANewCustomExercise() {
    FakeCustomExerciseRepository repository = new FakeCustomExerciseRepository();
    var handler = new CustomExerciseSyncEntityHandler(repository, newObjectMapper());
    UUID userId = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();
    SyncChange change =
        new SyncChange(
            "customExercise", "upsert", exerciseId, Instant.now(FIXED_CLOCK), validPayload());

    SyncApplyResult result = handler.apply(userId, change);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(exerciseId))
        .get()
        .extracting(CustomExercise::name, CustomExercise::userId)
        .containsExactly("Curl concentrado", userId);
  }

  @Test
  void rejectsAnUpsertOverAnotherUsersCustomExercise_antiIDOR() {
    FakeCustomExerciseRepository repository = new FakeCustomExerciseRepository();
    UUID ownerId = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();
    Instant serverUpdatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new CustomExercise(
            exerciseId, ownerId, "Curl", null, null, List.of("BICEPS"), "REPS", serverUpdatedAt));
    var handler = new CustomExerciseSyncEntityHandler(repository, newObjectMapper());
    SyncChange change =
        new SyncChange(
            "customExercise",
            "upsert",
            exerciseId,
            serverUpdatedAt.plusSeconds(10),
            validPayload());

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("FORBIDDEN");
  }

  @Test
  void anOlderOrEqualChangeIsAcceptedAsANoOp_LWW_RN18() {
    FakeCustomExerciseRepository repository = new FakeCustomExerciseRepository();
    UUID userId = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();
    Instant serverUpdatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new CustomExercise(
            exerciseId, userId, "Curl", null, null, List.of("BICEPS"), "REPS", serverUpdatedAt));
    var handler = new CustomExerciseSyncEntityHandler(repository, newObjectMapper());
    SyncChange olderChange =
        new SyncChange(
            "customExercise",
            "upsert",
            exerciseId,
            serverUpdatedAt.minusSeconds(10),
            validPayload());

    SyncApplyResult result = handler.apply(userId, olderChange);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(exerciseId))
        .get()
        .extracting(CustomExercise::name)
        .isEqualTo("Curl");
  }

  @Test
  void rejectsAMalformedPayload() {
    var handler =
        new CustomExerciseSyncEntityHandler(new FakeCustomExerciseRepository(), newObjectMapper());
    SyncChange change =
        new SyncChange(
            "customExercise",
            "upsert",
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Map.of("muscleGroups", "not-a-list"));

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("VALIDATION_ERROR");
  }

  @Test
  void deletingAnOwnedCustomExerciseRemovesIt() {
    FakeCustomExerciseRepository repository = new FakeCustomExerciseRepository();
    UUID userId = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();
    Instant createdAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new CustomExercise(
            exerciseId, userId, "Curl", null, null, List.of("BICEPS"), "REPS", createdAt));
    var handler = new CustomExerciseSyncEntityHandler(repository, newObjectMapper());
    SyncChange deleteChange =
        new SyncChange("customExercise", "delete", exerciseId, createdAt.plusSeconds(10), null);

    SyncApplyResult result = handler.apply(userId, deleteChange);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(exerciseId)).isEmpty();
  }

  @Test
  void deletingAnAlreadyGoneEntryIsIdempotent() {
    var handler =
        new CustomExerciseSyncEntityHandler(new FakeCustomExerciseRepository(), newObjectMapper());
    SyncChange deleteChange =
        new SyncChange(
            "customExercise", "delete", UUID.randomUUID(), Instant.now(FIXED_CLOCK), null);

    SyncApplyResult result = handler.apply(UUID.randomUUID(), deleteChange);

    assertThat(result.accepted()).isTrue();
  }

  @Test
  void pullSinceReturnsOnlyThatUsersEntriesUpdatedAfterTheCursor() {
    FakeCustomExerciseRepository repository = new FakeCustomExerciseRepository();
    UUID userId = UUID.randomUUID();
    repository.save(
        new CustomExercise(
            UUID.randomUUID(),
            userId,
            "Older",
            null,
            null,
            List.of("BICEPS"),
            "REPS",
            Instant.parse("2026-01-01T00:00:00Z")));
    repository.save(
        new CustomExercise(
            UUID.randomUUID(),
            userId,
            "Newer",
            null,
            null,
            List.of("BICEPS"),
            "REPS",
            Instant.parse("2026-02-01T00:00:00Z")));
    var handler = new CustomExerciseSyncEntityHandler(repository, newObjectMapper());

    List<SyncChange> changes =
        handler.pullSince(userId, Instant.parse("2026-01-15T00:00:00Z"), new UUID(0, 0), 500);

    assertThat(changes).hasSize(1);
    assertThat(changes.get(0).entity()).isEqualTo("customExercise");
  }
}
