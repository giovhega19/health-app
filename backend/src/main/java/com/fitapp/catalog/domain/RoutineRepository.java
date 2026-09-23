package com.fitapp.catalog.domain;

import java.time.Instant;
import java.util.List;

/** Out-port for predefined routine persistence (analogous to {@link ExerciseRepository}). */
public interface RoutineRepository {
  List<Routine> findAll();

  /** Routines created or modified after {@code since} (RF-02.06 incremental sync). */
  List<Routine> findUpdatedSince(Instant since);
}
