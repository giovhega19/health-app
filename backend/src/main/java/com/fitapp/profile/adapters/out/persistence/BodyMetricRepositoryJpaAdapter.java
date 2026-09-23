package com.fitapp.profile.adapters.out.persistence;

import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.profile.domain.BodyMetricRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Real {@link BodyMetricRepository} adapter over Spring Data JPA / PostgreSQL. */
@Component
public class BodyMetricRepositoryJpaAdapter implements BodyMetricRepository {

  private final BodyMetricJpaRepository jpaRepository;

  public BodyMetricRepositoryJpaAdapter(BodyMetricJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public Optional<BodyMetric> findByUserIdAndDate(UUID userId, LocalDate date) {
    return jpaRepository
        .findByUserIdAndDate(userId, date)
        .map(BodyMetricRepositoryJpaAdapter::toDomain);
  }

  @Override
  public Optional<BodyMetric> findById(UUID id) {
    return jpaRepository.findById(id).map(BodyMetricRepositoryJpaAdapter::toDomain);
  }

  @Override
  public void deleteById(UUID id) {
    jpaRepository.deleteById(id);
  }

  @Override
  public List<BodyMetric> findByUserIdAndRange(UUID userId, LocalDate from, LocalDate to) {
    return jpaRepository.findByUserIdAndRange(userId, from, to).stream()
        .map(BodyMetricRepositoryJpaAdapter::toDomain)
        .toList();
  }

  @Override
  public List<BodyMetric> findByUserIdUpdatedSince(UUID userId, Instant since, int limit) {
    return jpaRepository.findByUserIdUpdatedSince(userId, since).stream()
        .limit(limit)
        .map(BodyMetricRepositoryJpaAdapter::toDomain)
        .toList();
  }

  @Override
  public BodyMetric save(BodyMetric metric) {
    BodyMetricEntity saved =
        jpaRepository.save(
            new BodyMetricEntity(
                metric.id(),
                metric.userId(),
                metric.date(),
                metric.weightKg(),
                metric.waistCm(),
                metric.updatedAt()));
    return toDomain(saved);
  }

  @Override
  public void deleteByUserId(UUID userId) {
    jpaRepository.deleteByUserId(userId);
  }

  private static BodyMetric toDomain(BodyMetricEntity entity) {
    return new BodyMetric(
        entity.getId(),
        entity.getUserId(),
        entity.getDate(),
        entity.getWeightKg(),
        entity.getWaistCm(),
        entity.getUpdatedAt());
  }
}
