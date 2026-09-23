package com.fitapp.catalog.application;

import com.fitapp.catalog.domain.Exercise;
import com.fitapp.catalog.domain.ExerciseRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * In-port / use case for {@code GET /catalog/exercises?updatedSince=} (RF-02.01, RF-02.06,
 * CA-02.06.1): returns every exercise when {@code updatedSince} is {@code null} (first sync), or
 * only the ones modified after it (incremental sync).
 */
@Component
public final class ListExercisesUpdatedSince {
  private final ExerciseRepository exerciseRepository;

  public ListExercisesUpdatedSince(ExerciseRepository exerciseRepository) {
    this.exerciseRepository = exerciseRepository;
  }

  public List<Exercise> execute(Instant updatedSince) {
    return updatedSince == null
        ? exerciseRepository.findAll()
        : exerciseRepository.findUpdatedSince(updatedSince);
  }
}
