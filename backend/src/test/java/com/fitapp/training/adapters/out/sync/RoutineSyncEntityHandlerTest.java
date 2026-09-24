package com.fitapp.training.adapters.out.sync;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.training.application.FakeRoutineRepository;
import com.fitapp.training.domain.Routine;
import com.fitapp.training.domain.TimerSettings;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** {@link RoutineSyncEntityHandler} (F03-T15), no database. */
class RoutineSyncEntityHandlerTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  private static ObjectMapper newObjectMapper() {
    return new ObjectMapper().findAndRegisterModules();
  }

  private static Map<String, Object> validPayload() {
    return Map.of(
        "name", "Full body",
        "description", "My own routine",
        "goal", "LOSE_WEIGHT",
        "level", "BEGINNER",
        "source", "USER",
        "timerDefaults",
            Map.of(
                "prepSeconds", 10,
                "workSeconds", 40,
                "restBetweenSetsSeconds", 30,
                "restBetweenExercisesSeconds", 60,
                "restBetweenRoundsSeconds", 90,
                "halfwayCue", true),
        "blocks", List.of(),
        "version", 1);
  }

  @Test
  void supportsTheRoutineEntity() {
    var handler = new RoutineSyncEntityHandler(new FakeRoutineRepository(), newObjectMapper());

    assertThat(handler.supportedEntity()).isEqualTo("routine");
  }

  @Test
  void appliesAValidUpsertForANewRoutine() {
    FakeRoutineRepository repository = new FakeRoutineRepository();
    var handler = new RoutineSyncEntityHandler(repository, newObjectMapper());
    UUID userId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    SyncChange change =
        new SyncChange("routine", "upsert", routineId, Instant.now(FIXED_CLOCK), validPayload());

    SyncApplyResult result = handler.apply(userId, change);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(routineId))
        .get()
        .extracting(Routine::name, Routine::userId)
        .containsExactly("Full body", userId);
  }

  @Test
  void rejectsAnUpsertOverAnotherUsersRoutine_antiIDOR() {
    FakeRoutineRepository repository = new FakeRoutineRepository();
    UUID ownerId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    Instant serverUpdatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new Routine(
            routineId,
            ownerId,
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            serverUpdatedAt));
    var handler = new RoutineSyncEntityHandler(repository, newObjectMapper());
    UUID attackerId = UUID.randomUUID();
    SyncChange change =
        new SyncChange(
            "routine", "upsert", routineId, serverUpdatedAt.plusSeconds(10), validPayload());

    SyncApplyResult result = handler.apply(attackerId, change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("FORBIDDEN");
    assertThat(repository.findById(routineId)).get().extracting(Routine::userId).isEqualTo(ownerId);
  }

  @Test
  void anOlderOrEqualChangeIsAcceptedAsANoOp_LWW_RN18() {
    FakeRoutineRepository repository = new FakeRoutineRepository();
    UUID userId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    Instant serverUpdatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new Routine(
            routineId,
            userId,
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            serverUpdatedAt));
    var handler = new RoutineSyncEntityHandler(repository, newObjectMapper());
    SyncChange olderChange =
        new SyncChange(
            "routine", "upsert", routineId, serverUpdatedAt.minusSeconds(10), validPayload());

    SyncApplyResult result = handler.apply(userId, olderChange);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(routineId)).get().extracting(Routine::version).isEqualTo(1);
  }

  @Test
  void rejectsAMalformedPayload() {
    var handler = new RoutineSyncEntityHandler(new FakeRoutineRepository(), newObjectMapper());
    SyncChange change =
        new SyncChange(
            "routine",
            "upsert",
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Map.of("version", "not-a-number"));

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("VALIDATION_ERROR");
  }

  @Test
  void deletingAnOwnedRoutineRemovesIt() {
    FakeRoutineRepository repository = new FakeRoutineRepository();
    UUID userId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    Instant createdAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new Routine(
            routineId,
            userId,
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            createdAt));
    var handler = new RoutineSyncEntityHandler(repository, newObjectMapper());
    SyncChange deleteChange =
        new SyncChange("routine", "delete", routineId, createdAt.plusSeconds(10), null);

    SyncApplyResult result = handler.apply(userId, deleteChange);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(routineId)).isEmpty();
  }

  @Test
  void deletingAnAlreadyGoneEntryIsIdempotent() {
    var handler = new RoutineSyncEntityHandler(new FakeRoutineRepository(), newObjectMapper());
    SyncChange deleteChange =
        new SyncChange("routine", "delete", UUID.randomUUID(), Instant.now(FIXED_CLOCK), null);

    SyncApplyResult result = handler.apply(UUID.randomUUID(), deleteChange);

    assertThat(result.accepted()).isTrue();
  }

  @Test
  void deletingAnotherUsersRoutineIsAcceptedAsANoOp_antiIDOR() {
    FakeRoutineRepository repository = new FakeRoutineRepository();
    UUID ownerId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    Instant createdAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new Routine(
            routineId,
            ownerId,
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            createdAt));
    var handler = new RoutineSyncEntityHandler(repository, newObjectMapper());
    SyncChange deleteChange =
        new SyncChange("routine", "delete", routineId, createdAt.plusSeconds(10), null);

    SyncApplyResult result = handler.apply(UUID.randomUUID(), deleteChange);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(routineId)).isPresent();
  }

  @Test
  void pullSinceReturnsOnlyThatUsersEntriesUpdatedAfterTheCursor() {
    FakeRoutineRepository repository = new FakeRoutineRepository();
    UUID userId = UUID.randomUUID();
    repository.save(
        new Routine(
            UUID.randomUUID(),
            userId,
            "Older",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            Instant.parse("2026-01-01T00:00:00Z")));
    repository.save(
        new Routine(
            UUID.randomUUID(),
            userId,
            "Newer",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            Instant.parse("2026-02-01T00:00:00Z")));
    repository.save(
        new Routine(
            UUID.randomUUID(),
            UUID.randomUUID(),
            "Other user's",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            Instant.parse("2026-02-01T00:00:00Z")));
    var handler = new RoutineSyncEntityHandler(repository, newObjectMapper());

    List<SyncChange> changes =
        handler.pullSince(userId, Instant.parse("2026-01-15T00:00:00Z"), new UUID(0, 0), 500);

    assertThat(changes).hasSize(1);
    assertThat(changes.get(0).entity()).isEqualTo("routine");
    assertThat(changes.get(0).op()).isEqualTo("upsert");
  }
}
