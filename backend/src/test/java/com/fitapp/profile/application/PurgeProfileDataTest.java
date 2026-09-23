package com.fitapp.profile.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.profile.domain.BodyMetric;
import com.fitapp.profile.domain.ProfileSnapshot;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Art. 5.4 of 00-constitucion.md / RNF-08: account deletion must also delete `profile`'s own data
 * for the user, not just `identity_users`. Triggered in production by {@code
 * AccountDeletedListener} reacting to {@code identity}'s {@code AccountDeleted} event; this test
 * covers the use case in isolation from the eventing mechanism.
 */
class PurgeProfileDataTest {

  @Test
  void deletesTheProfileAndEveryBodyMetricOfTheUser() {
    FakeProfileRepository profileRepository = new FakeProfileRepository();
    FakeBodyMetricRepository bodyMetricRepository = new FakeBodyMetricRepository();
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
            true, // parqFlagged: health-sensitive data, must be gone too
            Instant.now(),
            Instant.now()));
    bodyMetricRepository.save(
        new BodyMetric(UUID.randomUUID(), userId, LocalDate.now(), 60.0, 80.0, Instant.now()));
    bodyMetricRepository.save(
        new BodyMetric(
            UUID.randomUUID(), userId, LocalDate.now().minusDays(1), 60.5, 80.0, Instant.now()));
    UUID otherUserId = UUID.randomUUID();
    bodyMetricRepository.save(
        new BodyMetric(UUID.randomUUID(), otherUserId, LocalDate.now(), 70.0, 90.0, Instant.now()));
    PurgeProfileData useCase = new PurgeProfileData(profileRepository, bodyMetricRepository);

    useCase.execute(userId);

    assertThat(profileRepository.findByUserId(userId)).isEmpty();
    assertThat(bodyMetricRepository.findByUserIdAndRange(userId, null, null)).isEmpty();
    // Sanity check: only the deleted user's rows are gone, not everyone's.
    assertThat(bodyMetricRepository.findByUserIdAndRange(otherUserId, null, null)).hasSize(1);
  }
}
