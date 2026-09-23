package com.fitapp.profile.adapters.in.web;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Mirrors `BodyMetricDto` in openapi.yaml. */
public record BodyMetricDto(
    UUID id, LocalDate date, double weightKg, Double waistCm, Instant updatedAt) {}
