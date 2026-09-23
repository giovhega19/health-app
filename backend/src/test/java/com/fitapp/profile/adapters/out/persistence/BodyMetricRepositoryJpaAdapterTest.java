package com.fitapp.profile.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fitapp.profile.domain.BodyMetric;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BodyMetricRepositoryJpaAdapterTest {

  @Mock private BodyMetricJpaRepository jpaRepository;

  @Test
  void savesAndMapsBackToADomainBodyMetric() {
    BodyMetricRepositoryJpaAdapter adapter = new BodyMetricRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    BodyMetric metric =
        new BodyMetric(id, userId, LocalDate.of(2026, 9, 22), 59.5, 70.0, Instant.now());
    BodyMetricEntity entity =
        new BodyMetricEntity(
            id, userId, metric.date(), metric.weightKg(), metric.waistCm(), metric.updatedAt());
    when(jpaRepository.save(any(BodyMetricEntity.class))).thenReturn(entity);

    BodyMetric saved = adapter.save(metric);

    assertThat(saved).isEqualTo(metric);
  }

  @Test
  void findByUserIdAndDateReturnsEmptyWhenNotFound() {
    BodyMetricRepositoryJpaAdapter adapter = new BodyMetricRepositoryJpaAdapter(jpaRepository);
    UUID userId = UUID.randomUUID();
    when(jpaRepository.findByUserIdAndDate(userId, LocalDate.of(2026, 9, 22)))
        .thenReturn(Optional.empty());

    assertThat(adapter.findByUserIdAndDate(userId, LocalDate.of(2026, 9, 22))).isEmpty();
  }

  @Test
  void findByUserIdAndRangeMapsEveryEntity() {
    BodyMetricRepositoryJpaAdapter adapter = new BodyMetricRepositoryJpaAdapter(jpaRepository);
    UUID userId = UUID.randomUUID();
    BodyMetricEntity entity =
        new BodyMetricEntity(
            UUID.randomUUID(), userId, LocalDate.of(2026, 9, 22), 59.5, null, Instant.now());
    when(jpaRepository.findByUserIdAndRange(userId, null, null)).thenReturn(List.of(entity));

    assertThat(adapter.findByUserIdAndRange(userId, null, null)).hasSize(1);
  }

  @Test
  void findByUserIdUpdatedSinceRespectsTheLimit() {
    BodyMetricRepositoryJpaAdapter adapter = new BodyMetricRepositoryJpaAdapter(jpaRepository);
    UUID userId = UUID.randomUUID();
    BodyMetricEntity first =
        new BodyMetricEntity(
            UUID.randomUUID(), userId, LocalDate.of(2026, 9, 22), 59.5, null, Instant.now());
    BodyMetricEntity second =
        new BodyMetricEntity(
            UUID.randomUUID(), userId, LocalDate.of(2026, 9, 23), 59.0, null, Instant.now());
    when(jpaRepository.findByUserIdUpdatedSince(userId, Instant.EPOCH))
        .thenReturn(List.of(first, second));

    assertThat(adapter.findByUserIdUpdatedSince(userId, Instant.EPOCH, 1)).hasSize(1);
  }

  @Test
  void deleteByIdDelegatesToTheJpaRepository() {
    BodyMetricRepositoryJpaAdapter adapter = new BodyMetricRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();

    adapter.deleteById(id);

    verify(jpaRepository).deleteById(id);
  }

  @Test
  void findByIdReturnsEmptyWhenNotFound() {
    BodyMetricRepositoryJpaAdapter adapter = new BodyMetricRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    when(jpaRepository.findById(id)).thenReturn(Optional.empty());

    assertThat(adapter.findById(id)).isEmpty();
  }
}
