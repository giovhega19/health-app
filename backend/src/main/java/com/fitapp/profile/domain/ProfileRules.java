package com.fitapp.profile.domain;

import java.time.Clock;
import java.time.LocalDate;
import java.time.Period;

/**
 * Pure validation rules shared by {@code UpsertProfile}/{@code AppendBodyMetric} (application) and
 * the `sync` handlers ({@code ProfileSyncEntityHandler}/{@code BodyMetricSyncEntityHandler}) so
 * both entry points (`PUT /me/profile` and `POST /sync/push`) enforce the exact same RN-01/RN-02
 * rules without duplicating the logic (`specs/F01-perfil-onboarding/spec.md` "Validaciones").
 */
public final class ProfileRules {

  public static final double MIN_HEIGHT_CM = 100;
  public static final double MAX_HEIGHT_CM = 250;
  public static final double MIN_WEIGHT_KG = 25;
  public static final double MAX_WEIGHT_KG = 350;

  private ProfileRules() {}

  public static void requireMinimumAge(LocalDate birthDate, Clock clock) {
    int age = Period.between(birthDate, LocalDate.now(clock)).getYears();
    if (age < AgeBelowMinimumException.MINIMUM_AGE) {
      throw new AgeBelowMinimumException(age);
    }
  }

  public static void requireHeightInRange(double heightCm) {
    if (heightCm < MIN_HEIGHT_CM || heightCm > MAX_HEIGHT_CM) {
      throw new ProfileValidationException(
          "heightCm", "Height must be between " + MIN_HEIGHT_CM + " and " + MAX_HEIGHT_CM + " cm.");
    }
  }

  public static void requireWeightInRange(double weightKg, String field) {
    if (weightKg < MIN_WEIGHT_KG || weightKg > MAX_WEIGHT_KG) {
      throw new ProfileValidationException(
          field, "Weight must be between " + MIN_WEIGHT_KG + " and " + MAX_WEIGHT_KG + " kg.");
    }
  }
}
