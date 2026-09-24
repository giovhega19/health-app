package com.fitapp.training.application;

import com.fitapp.training.domain.Routine;
import com.fitapp.training.domain.RoutineRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** In-memory {@link RoutineRepository} fake for application/adapter unit tests, no database. */
public class FakeRoutineRepository implements RoutineRepository {

  private final Map<UUID, Routine> byId = new LinkedHashMap<>();

  @Override
  public Optional<Routine> findById(UUID id) {
    return Optional.ofNullable(byId.get(id));
  }

  @Override
  public Routine save(Routine routine) {
    byId.put(routine.id(), routine);
    return routine;
  }

  @Override
  public void deleteById(UUID id) {
    byId.remove(id);
  }

  @Override
  public List<Routine> findByUserIdUpdatedSince(UUID userId, Instant since, int limit) {
    return byId.values().stream()
        .filter(r -> r.userId().equals(userId) && r.updatedAt().isAfter(since))
        .sorted((a, b) -> a.updatedAt().compareTo(b.updatedAt()))
        .limit(limit)
        .toList();
  }

  @Override
  public void deleteByUserId(UUID userId) {
    byId.values().removeIf(r -> r.userId().equals(userId));
  }
}
