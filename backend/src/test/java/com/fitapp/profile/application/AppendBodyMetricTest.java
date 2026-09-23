package com.fitapp.profile.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fitapp.profile.domain.ProfileValidationException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** RF-01.06 "registrar peso" (CA-01.06.1). */
class AppendBodyMetricTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  @Test
  void appendsANewBodyMetric() {
    FakeBodyMetricRepository repository = new FakeBodyMetricRepository();
    AppendBodyMetric useCase = new AppendBodyMetric(repository, FIXED_CLOCK);
    UUID userId = UUID.randomUUID();

    useCase.execute(new AppendBodyMetricCommand(userId, LocalDate.of(2026, 9, 22), 59.5, null));

    assertThat(repository.findByUserIdAndDate(userId, LocalDate.of(2026, 9, 22)))
        .get()
        .extracting(metric -> metric.weightKg())
        .isEqualTo(59.5);
  }

  @Test
  void replacesTheEntryOfTheSameDate_CA0106_1() {
    FakeBodyMetricRepository repository = new FakeBodyMetricRepository();
    AppendBodyMetric useCase = new AppendBodyMetric(repository, FIXED_CLOCK);
    UUID userId = UUID.randomUUID();
    LocalDate today = LocalDate.of(2026, 9, 22);

    useCase.execute(new AppendBodyMetricCommand(userId, today, 60.0, null));
    useCase.execute(new AppendBodyMetricCommand(userId, today, 59.5, null));

    assertThat(repository.findByUserIdAndRange(userId, null, null)).hasSize(1);
    assertThat(repository.findByUserIdAndDate(userId, today))
        .get()
        .extracting(m -> m.weightKg())
        .isEqualTo(59.5);
  }

  @Test
  void rejectsAWeightOutOfRange() {
    AppendBodyMetric useCase = new AppendBodyMetric(new FakeBodyMetricRepository(), FIXED_CLOCK);

    assertThatThrownBy(
            () ->
                useCase.execute(
                    new AppendBodyMetricCommand(
                        UUID.randomUUID(), LocalDate.now(FIXED_CLOCK), 5, null)))
        .isInstanceOf(ProfileValidationException.class);
  }
}
