package com.fitapp.profile.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * A single body weight entry (`BodyMetricDto` in openapi.yaml, RF-01.06). CA-01.06.1: registering a
 * new weight for a date that already has an entry replaces it (upsert by {@code (userId, date)}).
 */
public record BodyMetric(
    UUID id, UUID userId, LocalDate date, double weightKg, Double waistCm, Instant updatedAt) {}
