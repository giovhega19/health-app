package com.fitapp.training.domain;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Out port for {@link ScheduleSlot} persistence (Art. 2.3 of 00-constitucion.md). */
public interface ScheduleSlotRepository {

  Optional<ScheduleSlot> findById(UUID id);

  ScheduleSlot save(ScheduleSlot slot);

  void deleteById(UUID id);

  /** Used by `sync/pull` (F04-T10) to serve incremental changes for `entity: scheduleSlot`. */
  List<ScheduleSlot> findByUserIdUpdatedSince(UUID userId, Instant since, int limit);

  /**
   * Deletes every schedule slot row for {@code userId} (Art. 5.4 of 00-constitucion.md, same
   * cascade as {@link RoutineRepository#deleteByUserId(UUID)}).
   */
  void deleteByUserId(UUID userId);
}
