package com.fitapp.profile.adapters.in.web;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Mirrors `UserProfileDto` in `packages/api-contract/openapi.yaml`. */
public record UserProfileDto(
    UUID id,
    @NotNull LocalDate birthDate,
    @NotBlank String gender,
    @DecimalMin("100") @DecimalMax("250") double heightCm,
    @NotBlank String goal,
    @NotBlank String level,
    @Min(1) @Max(7) int daysPerWeek,
    @Min(10) @Max(120) int minutesPerSession,
    List<String> equipment,
    @NotBlank String unitSystem,
    Double targetWeightKg,
    boolean parqFlagged,
    Instant healthConsentAt,
    Instant updatedAt) {}
