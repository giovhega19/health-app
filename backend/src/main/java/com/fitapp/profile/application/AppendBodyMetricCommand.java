package com.fitapp.profile.application;

import java.time.LocalDate;
import java.util.UUID;

/** Input of {@link AppendBodyMetric}, mirrors `BodyMetricDto` (write side). */
public record AppendBodyMetricCommand(
    UUID userId, LocalDate date, double weightKg, Double waistCm) {}
