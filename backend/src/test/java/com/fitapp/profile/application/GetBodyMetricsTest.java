package com.fitapp.profile.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.profile.domain.BodyMetric;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** RF-01.06 `GET /me/body-metrics?from=&to=`. */
class GetBodyMetricsTest {

  @Test
  void returnsOnlyTheEntriesOfTheGivenUserWithinRange() {
    FakeBodyMetricRepository repository = new FakeBodyMetricRepository();
    UUID userId = UUID.randomUUID();
    UUID otherUserId = UUID.randomUUID();
    repository.save(
        new BodyMetric(
            UUID.randomUUID(), userId, LocalDate.of(2026, 1, 10), 60, null, Instant.now()));
    repository.save(
        new BodyMetric(
            UUID.randomUUID(), userId, LocalDate.of(2026, 2, 10), 59, null, Instant.now()));
    repository.save(
        new BodyMetric(
            UUID.randomUUID(), otherUserId, LocalDate.of(2026, 1, 15), 70, null, Instant.now()));
    GetBodyMetrics useCase = new GetBodyMetrics(repository);

    var result = useCase.execute(userId, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 3, 1));

    assertThat(result).hasSize(1);
    assertThat(result.get(0).weightKg()).isEqualTo(59);
  }
}
