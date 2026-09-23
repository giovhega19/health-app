package com.fitapp.profile.adapters.in.event;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.identity.domain.events.AccountDeleted;
import com.fitapp.profile.application.FakeBodyMetricRepository;
import com.fitapp.profile.application.FakeProfileRepository;
import com.fitapp.profile.application.PurgeProfileData;
import com.fitapp.profile.domain.ProfileSnapshot;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Confirms the inbound adapter for {@code identity}'s {@link AccountDeleted} event correctly
 * triggers {@link PurgeProfileData} (Art. 5.4 of 00-constitucion.md).
 */
class AccountDeletedListenerTest {

  @Test
  void purgesProfileDataWhenAnAccountDeletedEventArrives() {
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
            false,
            Instant.now(),
            Instant.now()));
    AccountDeletedListener listener =
        new AccountDeletedListener(new PurgeProfileData(profileRepository, bodyMetricRepository));

    listener.on(new AccountDeleted(userId, Instant.now()));

    assertThat(profileRepository.findByUserId(userId)).isEmpty();
  }
}
