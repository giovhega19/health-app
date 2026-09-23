package com.fitapp.catalog.domain;

import java.time.Instant;
import java.util.List;

/** In-memory fake of {@link RoutineRepository}, analogous to {@link InMemoryExerciseRepository}. */
public final class InMemoryRoutineRepository implements RoutineRepository {
  private final List<Routine> routines;

  public InMemoryRoutineRepository(List<Routine> routines) {
    this.routines = List.copyOf(routines);
  }

  @Override
  public List<Routine> findAll() {
    return routines;
  }

  @Override
  public List<Routine> findUpdatedSince(Instant since) {
    return routines.stream().filter(routine -> routine.updatedAt().isAfter(since)).toList();
  }
}
