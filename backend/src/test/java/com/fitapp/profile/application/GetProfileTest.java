package com.fitapp.profile.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fitapp.profile.domain.ProfileSnapshot;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** RF-01.03 `GET /me/profile`. */
class GetProfileTest {

  @Test
  void returnsTheProfileOfTheGivenUser() {
    FakeProfileRepository profileRepository = new FakeProfileRepository();
    UUID userId = UUID.randomUUID();
    profileRepository.save(
        new ProfileSnapshot(
            UUID.randomUUID(),
            userId,
            LocalDate.of(1996, 1, 1),
            "FEMALE",
            165.0,
            "GENERAL_HEALTH",
            "BEGINNER",
            3,
            30,
            List.of("NONE"),
            "METRIC",
            null,
            false,
            Instant.now(),
            Instant.now()));
    GetProfile useCase = new GetProfile(profileRepository);

    assertThat(useCase.execute(userId).userId()).isEqualTo(userId);
  }

  @Test
  void throwsWhenTheUserHasNoProfileYet() {
    GetProfile useCase = new GetProfile(new FakeProfileRepository());

    assertThatThrownBy(() -> useCase.execute(UUID.randomUUID()))
        .isInstanceOf(NoSuchElementException.class);
  }
}
