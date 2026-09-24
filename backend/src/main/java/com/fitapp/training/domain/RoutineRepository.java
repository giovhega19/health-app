package com.fitapp.training.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Out port for {@link Routine} persistence (Art. 2.3 of 00-constitucion.md). */
public interface RoutineRepository {

  Optional<Routine> findById(UUID id);

  Routine save(Routine routine);

  void deleteById(UUID id);

  /** Used by `sync/pull` (F03-T15) to serve incremental changes for `entity: routine`. */
  List<Routine> findByUserIdUpdatedSince(UUID userId, Instant since, int limit);

  /**
   * Deletes every routine row for {@code userId} (Art. 5.4 of 00-constitucion.md: account deletion
   * cascades to this module's data, see {@code PurgeTrainingData} / {@code
   * AccountDeletedListener}).
   */
  void deleteByUserId(UUID userId);
}
