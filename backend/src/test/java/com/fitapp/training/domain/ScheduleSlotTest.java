package com.fitapp.training.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * `specs/F04-programacion-recordatorios/plan.md` §2. Exercises the record's accessors, equality and
 * string representation directly.
 */
class ScheduleSlotTest {

  @Test
  void exposesAllFieldsThroughAccessors() {
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    Instant updatedAt = Instant.parse("2026-09-22T10:00:00Z");

    ScheduleSlot slot =
        new ScheduleSlot(id, userId, routineId, List.of(1, 3, 5), "07:30", 15, true, updatedAt);

    assertThat(slot.id()).isEqualTo(id);
    assertThat(slot.userId()).isEqualTo(userId);
    assertThat(slot.routineId()).isEqualTo(routineId);
    assertThat(slot.daysOfWeek()).containsExactly(1, 3, 5);
    assertThat(slot.startTime()).isEqualTo("07:30");
    assertThat(slot.reminderOffsetMinutes()).isEqualTo(15);
    assertThat(slot.active()).isTrue();
    assertThat(slot.updatedAt()).isEqualTo(updatedAt);
  }

  @Test
  void allowsANullReminderOffset() {
    ScheduleSlot slot =
        new ScheduleSlot(
            UUID.randomUUID(),
            UUID.randomUUID(),
            UUID.randomUUID(),
            List.of(1),
            "07:30",
            null,
            false,
            Instant.now());

    assertThat(slot.reminderOffsetMinutes()).isNull();
    assertThat(slot.active()).isFalse();
  }

  @Test
  void equalsAndHashCodeAreBasedOnAllFields() {
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    Instant updatedAt = Instant.parse("2026-09-22T10:00:00Z");
    ScheduleSlot a =
        new ScheduleSlot(id, userId, routineId, List.of(1), "07:30", 15, true, updatedAt);
    ScheduleSlot b =
        new ScheduleSlot(id, userId, routineId, List.of(1), "07:30", 15, true, updatedAt);
    ScheduleSlot different =
        new ScheduleSlot(id, userId, routineId, List.of(1), "08:00", 15, true, updatedAt);

    assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
    assertThat(a).isNotEqualTo(different);
  }

  @Test
  void toStringIncludesFieldValues() {
    UUID id = UUID.randomUUID();

    ScheduleSlot slot =
        new ScheduleSlot(
            id, UUID.randomUUID(), UUID.randomUUID(), List.of(1), "07:30", 15, true, Instant.now());

    assertThat(slot.toString()).contains(id.toString(), "07:30");
  }
}
