package com.fitapp.profile.application;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Input of {@link UpsertProfile}, mirrors `UserProfileDto` in `packages/api-contract/openapi.yaml`.
 *
 * <p>The 8-argument constructor below is kept for source-compatibility with {@code
 * UpsertProfileTest} (written before {@code equipment}/{@code unitSystem}/{@code
 * targetWeightKg}/{@code parqFlagged} were added to the full profile shape): it delegates to the
 * canonical constructor with sensible defaults. The real web adapter ({@code ProfileController})
 * always uses the canonical (12-argument) constructor with the full `UserProfileDto` payload.
 */
public record UpsertProfileCommand(
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
    boolean parqFlagged) {

  public UpsertProfileCommand(
      UUID userId,
      LocalDate birthDate,
      String gender,
      double heightCm,
      String goal,
      String level,
      int daysPerWeek,
      int minutesPerSession) {
    this(
        userId,
        birthDate,
        gender,
        heightCm,
        goal,
        level,
        daysPerWeek,
        minutesPerSession,
        List.of(),
        "METRIC",
        null,
        false);
  }
}
