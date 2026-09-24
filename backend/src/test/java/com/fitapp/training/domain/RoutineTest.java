package com.fitapp.training.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * A user's own routine (`source: USER | IMPORTED`). Exercises the record's accessors, equality and
 * string representation directly.
 */
class RoutineTest {

  @Test
  void exposesAllFieldsThroughAccessors() {
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    TimerSettings timerDefaults = new TimerSettings(10, 40, 30, 60, 90, true);
    Instant updatedAt = Instant.parse("2026-09-22T10:00:00Z");

    Routine routine =
        new Routine(
            id,
            userId,
            "Full body",
            "My own routine",
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            timerDefaults,
            List.of(),
            1,
            updatedAt);

    assertThat(routine.id()).isEqualTo(id);
    assertThat(routine.userId()).isEqualTo(userId);
    assertThat(routine.name()).isEqualTo("Full body");
    assertThat(routine.description()).isEqualTo("My own routine");
    assertThat(routine.goal()).isEqualTo("LOSE_WEIGHT");
    assertThat(routine.level()).isEqualTo("BEGINNER");
    assertThat(routine.source()).isEqualTo("USER");
    assertThat(routine.timerDefaults()).isEqualTo(timerDefaults);
    assertThat(routine.blocks()).isEmpty();
    assertThat(routine.version()).isEqualTo(1);
    assertThat(routine.updatedAt()).isEqualTo(updatedAt);
  }

  @Test
  void allowsANullDescription() {
    Routine routine =
        new Routine(
            UUID.randomUUID(),
            UUID.randomUUID(),
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "IMPORTED",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            Instant.now());

    assertThat(routine.description()).isNull();
  }

  @Test
  void equalsAndHashCodeAreBasedOnAllFields() {
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Instant updatedAt = Instant.parse("2026-09-22T10:00:00Z");
    TimerSettings timerDefaults = new TimerSettings(10, 40, 30, 60, 90, true);
    Routine a =
        new Routine(
            id,
            userId,
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            timerDefaults,
            List.of(),
            1,
            updatedAt);
    Routine b =
        new Routine(
            id,
            userId,
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            timerDefaults,
            List.of(),
            1,
            updatedAt);
    Routine different =
        new Routine(
            id,
            userId,
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            timerDefaults,
            List.of(),
            2,
            updatedAt);

    assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
    assertThat(a).isNotEqualTo(different);
  }

  @Test
  void toStringIncludesFieldValues() {
    UUID id = UUID.randomUUID();

    Routine routine =
        new Routine(
            id,
            UUID.randomUUID(),
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            Instant.now());

    assertThat(routine.toString()).contains(id.toString(), "Full body", "USER");
  }
}
