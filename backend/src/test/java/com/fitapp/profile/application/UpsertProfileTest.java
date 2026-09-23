package com.fitapp.profile.application;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fitapp.profile.domain.AgeBelowMinimumException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * RF-01.03 / RN-01 (`05-modelo-dominio-reglas.md` §2, minimum age 16, decision D2). CA-01.03.1: the
 * server also validates RN-01 on `PUT /me/profile` (`packages/api-contract/openapi.yaml`: 422
 * `AGE_BELOW_MINIMUM`), not only the mobile client. {@code UpsertProfile.execute} still throws
 * {@code UnsupportedOperationException} on purpose (minimal skeleton, F01-T06 implements the real
 * behaviour).
 */
class UpsertProfileTest {

  private static final LocalDate TODAY = LocalDate.of(2026, 9, 22);
  private static final Clock FIXED_CLOCK =
      Clock.fixed(TODAY.atStartOfDay(ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);

  @Test
  void savesAProfileForAnAdultUser() {
    FakeProfileRepository profileRepository = new FakeProfileRepository();
    UpsertProfile useCase = new UpsertProfile(profileRepository, FIXED_CLOCK);
    UpsertProfileCommand command =
        new UpsertProfileCommand(
            UUID.randomUUID(),
            TODAY.minusYears(30),
            "FEMALE",
            165.0,
            "GENERAL_HEALTH",
            "BEGINNER",
            3,
            30);

    assertThatCode(() -> useCase.execute(command)).doesNotThrowAnyException();
  }

  @Test
  void rejectsAProfileWithAnAgeBelowTheMinimumOf16_CA0103_1_422_AGE_BELOW_MINIMUM() {
    FakeProfileRepository profileRepository = new FakeProfileRepository();
    UpsertProfile useCase = new UpsertProfile(profileRepository, FIXED_CLOCK);
    UpsertProfileCommand command =
        new UpsertProfileCommand(
            UUID.randomUUID(),
            TODAY.minusYears(15),
            "FEMALE",
            165.0,
            "GENERAL_HEALTH",
            "BEGINNER",
            3,
            30);

    assertThatThrownBy(() -> useCase.execute(command)).isInstanceOf(AgeBelowMinimumException.class);
  }

  @Test
  void acceptsAProfileWithExactlyTheMinimumAgeOf16_RN01_D2() {
    FakeProfileRepository profileRepository = new FakeProfileRepository();
    UpsertProfile useCase = new UpsertProfile(profileRepository, FIXED_CLOCK);
    UpsertProfileCommand command =
        new UpsertProfileCommand(
            UUID.randomUUID(),
            TODAY.minusYears(16),
            "MALE",
            180.0,
            "STRENGTH",
            "INTERMEDIATE",
            4,
            60);

    assertThatCode(() -> useCase.execute(command)).doesNotThrowAnyException();
  }

  @Test
  void rejectsAProfileOneDayShortOfTheMinimumAge() {
    FakeProfileRepository profileRepository = new FakeProfileRepository();
    UpsertProfile useCase = new UpsertProfile(profileRepository, FIXED_CLOCK);
    UpsertProfileCommand command =
        new UpsertProfileCommand(
            UUID.randomUUID(),
            TODAY.minusYears(16).plusDays(1),
            "MALE",
            180.0,
            "STRENGTH",
            "INTERMEDIATE",
            4,
            60);

    assertThatThrownBy(() -> useCase.execute(command)).isInstanceOf(AgeBelowMinimumException.class);
  }
}
