package com.fitapp.training.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fitapp.training.domain.CustomExercise;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomExerciseRepositoryJpaAdapterTest {

  @Mock private CustomExerciseJpaRepository jpaRepository;

  @Test
  void savesAndMapsBackToADomainCustomExercise() {
    CustomExerciseRepositoryJpaAdapter adapter =
        new CustomExerciseRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    CustomExercise exercise =
        new CustomExercise(
            id, userId, "Curl", "notes", null, List.of("BICEPS", "FOREARM"), "REPS", Instant.now());
    CustomExerciseEntity entity =
        new CustomExerciseEntity(
            id,
            userId,
            "Curl",
            "notes",
            null,
            CustomExerciseRepositoryJpaAdapter.join(List.of("BICEPS", "FOREARM")),
            "REPS",
            exercise.updatedAt());
    when(jpaRepository.save(any(CustomExerciseEntity.class))).thenReturn(entity);

    CustomExercise saved = adapter.save(exercise);

    assertThat(saved).isEqualTo(exercise);
  }

  @Test
  void findByIdReturnsEmptyWhenNotFound() {
    CustomExerciseRepositoryJpaAdapter adapter =
        new CustomExerciseRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    when(jpaRepository.findById(id)).thenReturn(Optional.empty());

    assertThat(adapter.findById(id)).isEmpty();
  }

  @Test
  void findByUserIdUpdatedSinceRespectsTheLimit() {
    CustomExerciseRepositoryJpaAdapter adapter =
        new CustomExerciseRepositoryJpaAdapter(jpaRepository);
    UUID userId = UUID.randomUUID();
    Instant since = Instant.EPOCH;
    CustomExerciseEntity first =
        new CustomExerciseEntity(
            UUID.randomUUID(), userId, "Curl", null, null, "", "REPS", Instant.now());
    CustomExerciseEntity second =
        new CustomExerciseEntity(
            UUID.randomUUID(), userId, "Press", null, null, "", "REPS", Instant.now());
    when(jpaRepository.findByUserIdUpdatedSince(userId, since)).thenReturn(List.of(first, second));

    assertThat(adapter.findByUserIdUpdatedSince(userId, since, 1)).hasSize(1);
  }

  @Test
  void deleteByIdDelegatesToTheJpaRepository() {
    CustomExerciseRepositoryJpaAdapter adapter =
        new CustomExerciseRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();

    adapter.deleteById(id);

    verify(jpaRepository).deleteById(id);
  }

  @Test
  void deleteByUserIdDelegatesToTheJpaRepository() {
    CustomExerciseRepositoryJpaAdapter adapter =
        new CustomExerciseRepositoryJpaAdapter(jpaRepository);
    UUID userId = UUID.randomUUID();

    adapter.deleteByUserId(userId);

    verify(jpaRepository).deleteByUserId(userId);
  }

  @Test
  void mapsAnEmptyMuscleGroupsStringToAnEmptyList() {
    CustomExerciseRepositoryJpaAdapter adapter =
        new CustomExerciseRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    CustomExerciseEntity entity =
        new CustomExerciseEntity(
            id, UUID.randomUUID(), "Curl", null, null, "", "REPS", Instant.now());
    when(jpaRepository.findById(id)).thenReturn(Optional.of(entity));

    assertThat(adapter.findById(id))
        .get()
        .extracting(CustomExercise::muscleGroups)
        .isEqualTo(List.of());
  }
}
