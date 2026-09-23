package com.fitapp.profile.domain;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

/**
 * RN-01/RN-02 shared between `PUT /me/profile` ({@code UpsertProfile}) and `sync`
 * (`ProfileSyncEntityHandler`/`BodyMetricSyncEntityHandler`) — see {@link ProfileRules}.
 */
class ProfileRulesTest {

  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-09-22T10:00:00Z"), ZoneOffset.UTC);

  @Test
  void acceptsAnAgeOfExactly16_RN01_D2() {
    assertThatCode(() -> ProfileRules.requireMinimumAge(LocalDate.of(2010, 9, 22), FIXED_CLOCK))
        .doesNotThrowAnyException();
  }

  @Test
  void rejectsAnAgeBelow16() {
    assertThatThrownBy(() -> ProfileRules.requireMinimumAge(LocalDate.of(2010, 9, 23), FIXED_CLOCK))
        .isInstanceOf(AgeBelowMinimumException.class);
  }

  @Test
  void acceptsAHeightWithinRange() {
    assertThatCode(() -> ProfileRules.requireHeightInRange(165)).doesNotThrowAnyException();
  }

  @Test
  void rejectsAHeightBelowTheMinimum() {
    assertThatThrownBy(() -> ProfileRules.requireHeightInRange(50))
        .isInstanceOf(ProfileValidationException.class);
  }

  @Test
  void rejectsAHeightAboveTheMaximum() {
    assertThatThrownBy(() -> ProfileRules.requireHeightInRange(300))
        .isInstanceOf(ProfileValidationException.class);
  }

  @Test
  void acceptsAWeightWithinRange() {
    assertThatCode(() -> ProfileRules.requireWeightInRange(70, "weightKg"))
        .doesNotThrowAnyException();
  }

  @Test
  void rejectsAWeightBelowTheMinimum() {
    assertThatThrownBy(() -> ProfileRules.requireWeightInRange(10, "weightKg"))
        .isInstanceOf(ProfileValidationException.class);
  }

  @Test
  void rejectsAWeightAboveTheMaximum() {
    assertThatThrownBy(() -> ProfileRules.requireWeightInRange(400, "weightKg"))
        .isInstanceOf(ProfileValidationException.class);
  }
}
