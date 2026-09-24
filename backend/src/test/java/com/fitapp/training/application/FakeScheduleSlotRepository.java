package com.fitapp.training.application;

import com.fitapp.training.domain.ScheduleSlot;
import com.fitapp.training.domain.ScheduleSlotRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * In-memory {@link ScheduleSlotRepository} fake for application/adapter unit tests, no database.
 */
public class FakeScheduleSlotRepository implements ScheduleSlotRepository {

  private final Map<UUID, ScheduleSlot> byId = new LinkedHashMap<>();

  @Override
  public Optional<ScheduleSlot> findById(UUID id) {
    return Optional.ofNullable(byId.get(id));
  }

  @Override
  public ScheduleSlot save(ScheduleSlot slot) {
    byId.put(slot.id(), slot);
    return slot;
  }

  @Override
  public void deleteById(UUID id) {
    byId.remove(id);
  }

  @Override
  public List<ScheduleSlot> findByUserIdUpdatedSince(UUID userId, Instant since, int limit) {
    return byId.values().stream()
        .filter(s -> s.userId().equals(userId) && s.updatedAt().isAfter(since))
        .sorted((a, b) -> a.updatedAt().compareTo(b.updatedAt()))
        .limit(limit)
        .toList();
  }

  @Override
  public void deleteByUserId(UUID userId) {
    byId.values().removeIf(s -> s.userId().equals(userId));
  }
}
