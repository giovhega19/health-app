package com.fitapp.profile.application;

import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.profile.domain.BodyMetricRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** RF-01.06 `GET /me/body-metrics?from=&to=` use case. */
@Component
public class GetBodyMetrics {

  private final BodyMetricRepository bodyMetricRepository;

  public GetBodyMetrics(BodyMetricRepository bodyMetricRepository) {
    this.bodyMetricRepository = bodyMetricRepository;
  }

  public List<BodyMetric> execute(UUID userId, LocalDate from, LocalDate to) {
    return bodyMetricRepository.findByUserIdAndRange(userId, from, to);
  }
}
