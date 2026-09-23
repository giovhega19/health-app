package com.fitapp.catalog.domain;

import java.time.Instant;
import java.util.List;

/**
 * In-memory fake of {@link ExerciseRepository} for tests (fakes before mocks for repository ports,
 * 07-estrategia-pruebas.md §2.4). No database, no Testcontainers: this backend module has no
 * datasource/JPA dependency yet (see `backend/build.gradle.kts` H0 note); real persistence
 * integration tests are added by `dev-backend-java` alongside `F02-T06`.
 */
public final class InMemoryExerciseRepository implements ExerciseRepository {
  private final List<Exercise> exercises;

  public InMemoryExerciseRepository(List<Exercise> exercises) {
    this.exercises = List.copyOf(exercises);
  }

  @Override
  public List<Exercise> findAll() {
    return exercises;
  }

  @Override
  public List<Exercise> findUpdatedSince(Instant since) {
    return exercises.stream().filter(exercise -> exercise.updatedAt().isAfter(since)).toList();
  }
}
