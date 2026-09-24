package com.fitapp.training.application;

import com.fitapp.training.domain.CustomExercise;
import com.fitapp.training.domain.CustomExerciseRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * In-memory {@link CustomExerciseRepository} fake for application/adapter unit tests, no database.
 */
public class FakeCustomExerciseRepository implements CustomExerciseRepository {

  private final Map<UUID, CustomExercise> byId = new LinkedHashMap<>();

  @Override
  public Optional<CustomExercise> findById(UUID id) {
    return Optional.ofNullable(byId.get(id));
  }

  @Override
  public CustomExercise save(CustomExercise exercise) {
    byId.put(exercise.id(), exercise);
    return exercise;
  }

  @Override
  public void deleteById(UUID id) {
    byId.remove(id);
  }

  @Override
  public List<CustomExercise> findByUserIdUpdatedSince(UUID userId, Instant since, int limit) {
    return byId.values().stream()
        .filter(e -> e.userId().equals(userId) && e.updatedAt().isAfter(since))
        .sorted((a, b) -> a.updatedAt().compareTo(b.updatedAt()))
        .limit(limit)
        .toList();
  }

  @Override
  public void deleteByUserId(UUID userId) {
    byId.values().removeIf(e -> e.userId().equals(userId));
  }
}
