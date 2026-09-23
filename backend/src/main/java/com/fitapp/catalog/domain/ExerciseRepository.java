package com.fitapp.catalog.domain;

import java.time.Instant;
import java.util.List;

/**
 * Out-port for exercise persistence (04-arquitectura.md §4.1: ports live in {@code domain}, real
 * implementations in {@code adapters.out.persistence}, not implemented yet — F02-T06).
 */
public interface ExerciseRepository {
  List<Exercise> findAll();

  /** Exercises created or modified after {@code since} (RF-02.06 incremental sync). */
  List<Exercise> findUpdatedSince(Instant since);
}
