package com.fitapp.profile.application;

import com.fitapp.profile.domain.BodyMetricRepository;
import com.fitapp.profile.domain.ProfileRepository;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deletes every {@code profile}-owned row for a user: {@code profile_profiles} and {@code
 * profile_body_metrics} (Art. 5.4 of 00-constitucion.md, RNF-08: right of erasure). Triggered by
 * {@code AccountDeletedListener} when {@code identity} publishes {@code AccountDeleted}; kept as
 * its own use case (rather than inline in the listener) so it stays testable/callable independently
 * of the eventing mechanism.
 */
@Component
public class PurgeProfileData {

  private final ProfileRepository profileRepository;
  private final BodyMetricRepository bodyMetricRepository;

  public PurgeProfileData(
      ProfileRepository profileRepository, BodyMetricRepository bodyMetricRepository) {
    this.profileRepository = profileRepository;
    this.bodyMetricRepository = bodyMetricRepository;
  }

  @Transactional
  public void execute(UUID userId) {
    profileRepository.deleteByUserId(userId);
    bodyMetricRepository.deleteByUserId(userId);
  }
}
