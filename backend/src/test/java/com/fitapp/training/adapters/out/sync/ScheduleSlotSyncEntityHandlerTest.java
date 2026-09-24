package com.fitapp.training.adapters.out.sync;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.training.application.FakeScheduleSlotRepository;
import com.fitapp.training.domain.ScheduleSlot;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** {@link ScheduleSlotSyncEntityHandler} (F04-T10), no database. */
class ScheduleSlotSyncEntityHandlerTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  private static ObjectMapper newObjectMapper() {
    return new ObjectMapper().findAndRegisterModules();
  }

  private static Map<String, Object> validPayload(UUID routineId) {
    return Map.of(
        "routineId",
        routineId.toString(),
        "daysOfWeek",
        List.of(1, 3, 5),
        "startTime",
        "07:30",
        "reminderOffsetMinutes",
        15,
        "active",
        true);
  }

  @Test
  void supportsTheScheduleSlotEntity() {
    var handler =
        new ScheduleSlotSyncEntityHandler(new FakeScheduleSlotRepository(), newObjectMapper());

    assertThat(handler.supportedEntity()).isEqualTo("scheduleSlot");
  }

  @Test
  void appliesAValidUpsertForANewScheduleSlot() {
    FakeScheduleSlotRepository repository = new FakeScheduleSlotRepository();
    var handler = new ScheduleSlotSyncEntityHandler(repository, newObjectMapper());
    UUID userId = UUID.randomUUID();
    UUID slotId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    SyncChange change =
        new SyncChange(
            "scheduleSlot", "upsert", slotId, Instant.now(FIXED_CLOCK), validPayload(routineId));

    SyncApplyResult result = handler.apply(userId, change);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(slotId))
        .get()
        .extracting(ScheduleSlot::routineId, ScheduleSlot::userId, ScheduleSlot::startTime)
        .containsExactly(routineId, userId, "07:30");
  }

  @Test
  void rejectsAnUpsertOverAnotherUsersScheduleSlot_antiIDOR() {
    FakeScheduleSlotRepository repository = new FakeScheduleSlotRepository();
    UUID ownerId = UUID.randomUUID();
    UUID slotId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    Instant serverUpdatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new ScheduleSlot(
            slotId, ownerId, routineId, List.of(1), "07:30", 15, true, serverUpdatedAt));
    var handler = new ScheduleSlotSyncEntityHandler(repository, newObjectMapper());
    SyncChange change =
        new SyncChange(
            "scheduleSlot",
            "upsert",
            slotId,
            serverUpdatedAt.plusSeconds(10),
            validPayload(routineId));

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("FORBIDDEN");
  }

  @Test
  void anOlderOrEqualChangeIsAcceptedAsANoOp_LWW_RN18() {
    FakeScheduleSlotRepository repository = new FakeScheduleSlotRepository();
    UUID userId = UUID.randomUUID();
    UUID slotId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    Instant serverUpdatedAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new ScheduleSlot(
            slotId, userId, routineId, List.of(1), "07:30", 15, true, serverUpdatedAt));
    var handler = new ScheduleSlotSyncEntityHandler(repository, newObjectMapper());
    SyncChange olderChange =
        new SyncChange(
            "scheduleSlot",
            "upsert",
            slotId,
            serverUpdatedAt.minusSeconds(10),
            validPayload(routineId));

    SyncApplyResult result = handler.apply(userId, olderChange);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(slotId))
        .get()
        .extracting(ScheduleSlot::startTime)
        .isEqualTo("07:30");
  }

  @Test
  void rejectsAMalformedPayload() {
    var handler =
        new ScheduleSlotSyncEntityHandler(new FakeScheduleSlotRepository(), newObjectMapper());
    SyncChange change =
        new SyncChange(
            "scheduleSlot",
            "upsert",
            UUID.randomUUID(),
            Instant.now(FIXED_CLOCK),
            Map.of("routineId", "not-a-uuid"));

    SyncApplyResult result = handler.apply(UUID.randomUUID(), change);

    assertThat(result.accepted()).isFalse();
    assertThat(result.rejectionCode()).isEqualTo("VALIDATION_ERROR");
  }

  @Test
  void deletingAnOwnedScheduleSlotRemovesIt() {
    FakeScheduleSlotRepository repository = new FakeScheduleSlotRepository();
    UUID userId = UUID.randomUUID();
    UUID slotId = UUID.randomUUID();
    Instant createdAt = Instant.now(FIXED_CLOCK);
    repository.save(
        new ScheduleSlot(
            slotId, userId, UUID.randomUUID(), List.of(1), "07:30", 15, true, createdAt));
    var handler = new ScheduleSlotSyncEntityHandler(repository, newObjectMapper());
    SyncChange deleteChange =
        new SyncChange("scheduleSlot", "delete", slotId, createdAt.plusSeconds(10), null);

    SyncApplyResult result = handler.apply(userId, deleteChange);

    assertThat(result.accepted()).isTrue();
    assertThat(repository.findById(slotId)).isEmpty();
  }

  @Test
  void deletingAnAlreadyGoneEntryIsIdempotent() {
    var handler =
        new ScheduleSlotSyncEntityHandler(new FakeScheduleSlotRepository(), newObjectMapper());
    SyncChange deleteChange =
        new SyncChange("scheduleSlot", "delete", UUID.randomUUID(), Instant.now(FIXED_CLOCK), null);

    SyncApplyResult result = handler.apply(UUID.randomUUID(), deleteChange);

    assertThat(result.accepted()).isTrue();
  }

  @Test
  void pullSinceReturnsOnlyThatUsersEntriesUpdatedAfterTheCursor() {
    FakeScheduleSlotRepository repository = new FakeScheduleSlotRepository();
    UUID userId = UUID.randomUUID();
    repository.save(
        new ScheduleSlot(
            UUID.randomUUID(),
            userId,
            UUID.randomUUID(),
            List.of(1),
            "07:00",
            null,
            true,
            Instant.parse("2026-01-01T00:00:00Z")));
    repository.save(
        new ScheduleSlot(
            UUID.randomUUID(),
            userId,
            UUID.randomUUID(),
            List.of(2),
            "08:00",
            null,
            true,
            Instant.parse("2026-02-01T00:00:00Z")));
    var handler = new ScheduleSlotSyncEntityHandler(repository, newObjectMapper());

    List<SyncChange> changes =
        handler.pullSince(userId, Instant.parse("2026-01-15T00:00:00Z"), new UUID(0, 0), 500);

    assertThat(changes).hasSize(1);
    assertThat(changes.get(0).entity()).isEqualTo("scheduleSlot");
  }
}
