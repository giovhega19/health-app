package com.fitapp.profile.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Server-side replica of the profile (`05-modelo-dominio-reglas.md` §1, `UserProfileDto` in
 * `packages/api-contract/openapi.yaml`). The server never recalculates BMI/BMR (RN-02/RN-03 are a
 * client-only UI concern).
 */
public record ProfileSnapshot(
    UUID id,
    UUID userId,
    LocalDate birthDate,
    String gender,
    double heightCm,
    String goal,
    String level,
    int daysPerWeek,
    int minutesPerSession,
    List<String> equipment,
    String unitSystem,
    Double targetWeightKg,
    boolean parqFlagged,
    Instant healthConsentAt,
    Instant updatedAt) {}
