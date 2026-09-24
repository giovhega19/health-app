package com.fitapp.training.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** RF-03.07. Exercises the record's accessors, equality and string representation directly. */
class CustomExerciseTest {

  @Test
  void exposesAllFieldsThroughAccessors() {
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Instant updatedAt = Instant.parse("2026-09-22T10:00:00Z");

    CustomExercise exercise =
        new CustomExercise(
            id,
            userId,
            "Curl concentrado",
            "En banco",
            "file://photo.jpg",
            List.of("BICEPS", "FOREARM"),
            "REPS",
            updatedAt);

    assertThat(exercise.id()).isEqualTo(id);
    assertThat(exercise.userId()).isEqualTo(userId);
    assertThat(exercise.name()).isEqualTo("Curl concentrado");
    assertThat(exercise.notes()).isEqualTo("En banco");
    assertThat(exercise.photoUri()).isEqualTo("file://photo.jpg");
    assertThat(exercise.muscleGroups()).containsExactly("BICEPS", "FOREARM");
    assertThat(exercise.mode()).isEqualTo("REPS");
    assertThat(exercise.updatedAt()).isEqualTo(updatedAt);
  }

  @Test
  void allowsNullNotesAndPhoto() {
    CustomExercise exercise =
        new CustomExercise(
            UUID.randomUUID(),
            UUID.randomUUID(),
            "Curl",
            null,
            null,
            List.of(),
            "REPS",
            Instant.now());

    assertThat(exercise.notes()).isNull();
    assertThat(exercise.photoUri()).isNull();
  }

  @Test
  void equalsAndHashCodeAreBasedOnAllFields() {
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Instant updatedAt = Instant.parse("2026-09-22T10:00:00Z");
    CustomExercise a =
        new CustomExercise(id, userId, "Curl", null, null, List.of("BICEPS"), "REPS", updatedAt);
    CustomExercise b =
        new CustomExercise(id, userId, "Curl", null, null, List.of("BICEPS"), "REPS", updatedAt);
    CustomExercise different =
        new CustomExercise(id, userId, "Curl", null, null, List.of("BICEPS"), "TIME", updatedAt);

    assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
    assertThat(a).isNotEqualTo(different);
  }

  @Test
  void toStringIncludesFieldValues() {
    UUID id = UUID.randomUUID();

    CustomExercise exercise =
        new CustomExercise(
            id, UUID.randomUUID(), "Curl", null, null, List.of(), "REPS", Instant.now());

    assertThat(exercise.toString()).contains(id.toString(), "Curl", "REPS");
  }
}
