package com.fitapp.training.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * `05-modelo-dominio-reglas.md` §1 (class TimerSettings, RN-05). Exercises the record's accessors,
 * equality and string representation directly.
 */
class TimerSettingsTest {

  @Test
  void exposesAllFieldsThroughAccessors() {
    TimerSettings settings = new TimerSettings(10, 30, 15, 20, 60, true);

    assertThat(settings.prepSeconds()).isEqualTo(10);
    assertThat(settings.workSeconds()).isEqualTo(30);
    assertThat(settings.restBetweenSetsSeconds()).isEqualTo(15);
    assertThat(settings.restBetweenExercisesSeconds()).isEqualTo(20);
    assertThat(settings.restBetweenRoundsSeconds()).isEqualTo(60);
    assertThat(settings.halfwayCue()).isTrue();
  }

  @Test
  void allowsNullFieldsForPartialOverrides() {
    TimerSettings partial = new TimerSettings(null, null, null, null, null, null);

    assertThat(partial.prepSeconds()).isNull();
    assertThat(partial.halfwayCue()).isNull();
  }

  @Test
  void equalsAndHashCodeAreBasedOnAllFields() {
    TimerSettings a = new TimerSettings(10, 30, 15, 20, 60, true);
    TimerSettings b = new TimerSettings(10, 30, 15, 20, 60, true);
    TimerSettings different = new TimerSettings(10, 30, 15, 20, 60, false);

    assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
    assertThat(a).isNotEqualTo(different);
  }

  @Test
  void toStringIncludesFieldValues() {
    TimerSettings settings = new TimerSettings(10, 30, 15, 20, 60, true);

    assertThat(settings.toString()).contains("10", "30", "15", "20", "60", "true");
  }
}
