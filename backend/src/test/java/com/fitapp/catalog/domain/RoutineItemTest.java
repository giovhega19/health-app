package com.fitapp.catalog.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * `05-modelo-dominio-reglas.md` §1 (class RoutineItem). Exercises the record's accessors, equality
 * and string representation directly.
 */
class RoutineItemTest {

  @Test
  void exposesAllFieldsThroughAccessors() {
    UUID id = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();
    TimerSettings overrides = new TimerSettings(5, 20, 10, 10, 30, false);

    RoutineItem item = new RoutineItem(id, exerciseId, 3, 12, null, 20.5, overrides);

    assertThat(item.id()).isEqualTo(id);
    assertThat(item.exerciseId()).isEqualTo(exerciseId);
    assertThat(item.sets()).isEqualTo(3);
    assertThat(item.targetReps()).isEqualTo(12);
    assertThat(item.targetSeconds()).isNull();
    assertThat(item.weightKg()).isEqualTo(20.5);
    assertThat(item.timerOverrides()).isEqualTo(overrides);
  }

  @Test
  void allowsNullOptionalFields() {
    UUID id = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();

    RoutineItem item = new RoutineItem(id, exerciseId, 1, null, 45, null, null);

    assertThat(item.targetReps()).isNull();
    assertThat(item.targetSeconds()).isEqualTo(45);
    assertThat(item.weightKg()).isNull();
    assertThat(item.timerOverrides()).isNull();
  }

  @Test
  void equalsAndHashCodeAreBasedOnAllFields() {
    UUID id = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();
    RoutineItem a = new RoutineItem(id, exerciseId, 3, 12, null, 20.5, null);
    RoutineItem b = new RoutineItem(id, exerciseId, 3, 12, null, 20.5, null);
    RoutineItem different = new RoutineItem(id, exerciseId, 4, 12, null, 20.5, null);

    assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
    assertThat(a).isNotEqualTo(different);
  }

  @Test
  void toStringIncludesFieldValues() {
    UUID id = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();

    RoutineItem item = new RoutineItem(id, exerciseId, 3, 12, null, 20.5, null);

    assertThat(item.toString()).contains(id.toString(), exerciseId.toString(), "3", "12", "20.5");
  }
}
