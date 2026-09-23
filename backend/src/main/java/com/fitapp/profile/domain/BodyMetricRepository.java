package com.fitapp.profile.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Out port for {@link BodyMetric} persistence (Art. 2.3 of 00-constitucion.md). */
public interface BodyMetricRepository {

  Optional<BodyMetric> findByUserIdAndDate(UUID userId, LocalDate date);

  Optional<BodyMetric> findById(UUID id);

  void deleteById(UUID id);

  /** Inclusive range; {@code from}/{@code to} may be {@code null} (open-ended). */
  List<BodyMetric> findByUserIdAndRange(UUID userId, LocalDate from, LocalDate to);

  /** Used by `sync/pull` (CA-01.01.1) to serve incremental changes for `entity: bodyMetric`. */
  List<BodyMetric> findByUserIdUpdatedSince(UUID userId, Instant since, int limit);

  BodyMetric save(BodyMetric metric);

  /**
   * Deletes every body metric row for {@code userId} (Art. 5.4: account deletion cascades to this
   * module's data, see {@code PurgeProfileData} / {@code AccountDeletedListener}).
   */
  void deleteByUserId(UUID userId);
}
