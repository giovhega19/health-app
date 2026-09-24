package com.fitapp.training.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Out port for {@link CustomExercise} persistence (Art. 2.3 of 00-constitucion.md). */
public interface CustomExerciseRepository {

  Optional<CustomExercise> findById(UUID id);

  CustomExercise save(CustomExercise exercise);

  void deleteById(UUID id);

  /** Used by `sync/pull` (F03-T15) to serve incremental changes for `entity: customExercise`. */
  List<CustomExercise> findByUserIdUpdatedSince(UUID userId, Instant since, int limit);

  /**
   * Deletes every custom exercise row for {@code userId} (Art. 5.4 of 00-constitucion.md, same
   * cascade as {@link RoutineRepository#deleteByUserId(UUID)}).
   */
  void deleteByUserId(UUID userId);
}
