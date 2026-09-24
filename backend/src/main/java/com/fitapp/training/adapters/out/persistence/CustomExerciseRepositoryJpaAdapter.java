package com.fitapp.training.adapters.out.persistence;

import com.fitapp.training.domain.CustomExercise;
import com.fitapp.training.domain.CustomExerciseRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Real {@link CustomExerciseRepository} adapter over Spring Data JPA / PostgreSQL. */
@Component
public class CustomExerciseRepositoryJpaAdapter implements CustomExerciseRepository {

  static final String SEPARATOR = "\u001F";

  private final CustomExerciseJpaRepository jpaRepository;

  public CustomExerciseRepositoryJpaAdapter(CustomExerciseJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public Optional<CustomExercise> findById(UUID id) {
    return jpaRepository.findById(id).map(CustomExerciseRepositoryJpaAdapter::toDomain);
  }

  @Override
  public CustomExercise save(CustomExercise exercise) {
    CustomExerciseEntity saved =
        jpaRepository.save(
            new CustomExerciseEntity(
                exercise.id(),
                exercise.userId(),
                exercise.name(),
                exercise.notes(),
                exercise.photoUri(),
                join(exercise.muscleGroups()),
                exercise.mode(),
                exercise.updatedAt()));
    return toDomain(saved);
  }

  @Override
  public void deleteById(UUID id) {
    jpaRepository.deleteById(id);
  }

  @Override
  public List<CustomExercise> findByUserIdUpdatedSince(UUID userId, Instant since, int limit) {
    return jpaRepository.findByUserIdUpdatedSince(userId, since).stream()
        .limit(limit)
        .map(CustomExerciseRepositoryJpaAdapter::toDomain)
        .toList();
  }

  @Override
  public void deleteByUserId(UUID userId) {
    jpaRepository.deleteByUserId(userId);
  }

  private static CustomExercise toDomain(CustomExerciseEntity entity) {
    return new CustomExercise(
        entity.getId(),
        entity.getUserId(),
        entity.getName(),
        entity.getNotes(),
        entity.getPhotoUri(),
        split(entity.getMuscleGroups()),
        entity.getMode(),
        entity.getUpdatedAt());
  }

  private static List<String> split(String value) {
    return value == null || value.isEmpty() ? List.of() : List.of(value.split(SEPARATOR, -1));
  }

  static String join(List<String> values) {
    return values == null ? "" : String.join(SEPARATOR, values);
  }
}
