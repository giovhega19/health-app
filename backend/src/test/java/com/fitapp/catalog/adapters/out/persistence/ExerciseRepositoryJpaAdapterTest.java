package com.fitapp.catalog.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.fitapp.catalog.domain.Exercise;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExerciseRepositoryJpaAdapterTest {

  @Mock private ExerciseJpaRepository jpaRepository;

  private static ExerciseEntity anEntity(UUID id, Instant updatedAt) {
    return new ExerciseEntity(
        id,
        "push-up",
        "Flexión de pecho",
        ExerciseRepositoryJpaAdapter.join(List.of("CHEST")),
        ExerciseRepositoryJpaAdapter.join(List.of("NONE")),
        1,
        "REPS",
        3.8,
        ExerciseRepositoryJpaAdapter.join(List.of("Paso 1", "Paso 2", "Paso 3")),
        ExerciseRepositoryJpaAdapter.join(List.of("Error 1", "Error 2")),
        "https://cdn.fitapp.test/img.png",
        null,
        null,
        updatedAt);
  }

  @Test
  void mapsEveryFieldFromEntityToDomain() {
    ExerciseRepositoryJpaAdapter adapter = new ExerciseRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    Instant updatedAt = Instant.parse("2026-02-01T00:00:00Z");
    when(jpaRepository.findAll()).thenReturn(List.of(anEntity(id, updatedAt)));

    List<Exercise> exercises = adapter.findAll();

    assertThat(exercises).hasSize(1);
    Exercise exercise = exercises.get(0);
    assertThat(exercise.id()).isEqualTo(id);
    assertThat(exercise.muscleGroups()).containsExactly("CHEST");
    assertThat(exercise.equipment()).containsExactly("NONE");
    assertThat(exercise.instructions()).hasSize(3);
    assertThat(exercise.commonMistakes()).hasSize(2);
    assertThat(exercise.updatedAt()).isEqualTo(updatedAt);
  }

  @Test
  void findUpdatedSinceDelegatesToTheRepositoryQuery() {
    ExerciseRepositoryJpaAdapter adapter = new ExerciseRepositoryJpaAdapter(jpaRepository);
    Instant since = Instant.parse("2026-01-15T00:00:00Z");
    when(jpaRepository.findByUpdatedAtAfter(since))
        .thenReturn(List.of(anEntity(UUID.randomUUID(), Instant.parse("2026-02-01T00:00:00Z"))));

    assertThat(adapter.findUpdatedSince(since)).hasSize(1);
  }

  @Test
  void joinAndSplitAreInverses() {
    List<String> values = List.of("a", "b", "c, with a comma");

    assertThat(
            List.of(
                ExerciseRepositoryJpaAdapter.join(values)
                    .split(ExerciseRepositoryJpaAdapter.SEPARATOR, -1)))
        .isEqualTo(values);
  }
}
