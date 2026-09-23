package com.fitapp.catalog.adapters.out.persistence;

import com.fitapp.catalog.domain.Exercise;
import com.fitapp.catalog.domain.ExerciseRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Component;

/** Real {@link ExerciseRepository} adapter over Spring Data JPA / PostgreSQL. */
@Component
public class ExerciseRepositoryJpaAdapter implements ExerciseRepository {

  static final String SEPARATOR = "\u001F";

  private final ExerciseJpaRepository jpaRepository;

  public ExerciseRepositoryJpaAdapter(ExerciseJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public List<Exercise> findAll() {
    return jpaRepository.findAll().stream().map(ExerciseRepositoryJpaAdapter::toDomain).toList();
  }

  @Override
  public List<Exercise> findUpdatedSince(Instant since) {
    return jpaRepository.findByUpdatedAtAfter(since).stream()
        .map(ExerciseRepositoryJpaAdapter::toDomain)
        .toList();
  }

  private static Exercise toDomain(ExerciseEntity entity) {
    return new Exercise(
        entity.getId(),
        entity.getSlug(),
        entity.getName(),
        split(entity.getMuscleGroups()),
        split(entity.getEquipment()),
        entity.getDifficulty(),
        entity.getMode(),
        entity.getMet(),
        split(entity.getInstructions()),
        split(entity.getCommonMistakes()),
        entity.getImageUrl(),
        entity.getAnimationUrl(),
        entity.getVideoUrl(),
        entity.getUpdatedAt());
  }

  private static List<String> split(String value) {
    return value == null || value.isEmpty() ? List.of() : List.of(value.split(SEPARATOR, -1));
  }

  static String join(List<String> values) {
    return values == null ? "" : String.join(SEPARATOR, values);
  }
}
