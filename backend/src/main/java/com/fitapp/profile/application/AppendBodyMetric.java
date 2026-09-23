package com.fitapp.profile.application;

import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.profile.domain.BodyMetricRepository;
import com.fitapp.profile.domain.ProfileRules;
import java.time.Clock;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-01.06 "registrar peso" (CA-01.06.1): upserts by {@code (userId, date)} — "si ya existía un
 * registro de hoy, se reemplaza". Validates the 25–350 kg range (RN-02 validations table, shared
 * with `sync` via {@link ProfileRules}).
 */
@Component
public class AppendBodyMetric {

  private final BodyMetricRepository bodyMetricRepository;
  private final Clock clock;

  public AppendBodyMetric(BodyMetricRepository bodyMetricRepository, Clock clock) {
    this.bodyMetricRepository = bodyMetricRepository;
    this.clock = clock;
  }

  @Transactional
  public BodyMetric execute(AppendBodyMetricCommand command) {
    ProfileRules.requireWeightInRange(command.weightKg(), "weightKg");
    UUID existingId =
        bodyMetricRepository
            .findByUserIdAndDate(command.userId(), command.date())
            .map(BodyMetric::id)
            .orElse(null);
    BodyMetric toSave =
        new BodyMetric(
            existingId != null ? existingId : UUID.randomUUID(),
            command.userId(),
            command.date(),
            command.weightKg(),
            command.waistCm(),
            clock.instant());
    return bodyMetricRepository.save(toSave);
  }
}
