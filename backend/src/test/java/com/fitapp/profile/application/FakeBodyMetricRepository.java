package com.fitapp.profile.application;

import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.profile.domain.BodyMetricRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** In-memory fake of {@link BodyMetricRepository}. */
public class FakeBodyMetricRepository implements BodyMetricRepository {

  private final Map<UUID, BodyMetric> byId = new HashMap<>();

  @Override
  public Optional<BodyMetric> findByUserIdAndDate(UUID userId, LocalDate date) {
    return byId.values().stream()
        .filter(metric -> metric.userId().equals(userId) && metric.date().equals(date))
        .findFirst();
  }

  @Override
  public Optional<BodyMetric> findById(UUID id) {
    return Optional.ofNullable(byId.get(id));
  }

  @Override
  public void deleteById(UUID id) {
    byId.remove(id);
  }

  @Override
  public List<BodyMetric> findByUserIdAndRange(UUID userId, LocalDate from, LocalDate to) {
    return byId.values().stream()
        .filter(metric -> metric.userId().equals(userId))
        .filter(metric -> from == null || !metric.date().isBefore(from))
        .filter(metric -> to == null || !metric.date().isAfter(to))
        .sorted((a, b) -> a.date().compareTo(b.date()))
        .toList();
  }

  @Override
  public List<BodyMetric> findByUserIdUpdatedSince(UUID userId, Instant since, int limit) {
    return byId.values().stream()
        .filter(metric -> metric.userId().equals(userId) && metric.updatedAt().isAfter(since))
        .sorted((a, b) -> a.updatedAt().compareTo(b.updatedAt()))
        .limit(limit)
        .toList();
  }

  @Override
  public BodyMetric save(BodyMetric metric) {
    byId.put(metric.id(), metric);
    return metric;
  }

  @Override
  public void deleteByUserId(UUID userId) {
    byId.values().removeIf(metric -> metric.userId().equals(userId));
  }
}
