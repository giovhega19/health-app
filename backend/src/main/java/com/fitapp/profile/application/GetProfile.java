package com.fitapp.profile.application;

import com.fitapp.profile.domain.ProfileRepository;
import com.fitapp.profile.domain.ProfileSnapshot;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** RF-01.03 `GET /me/profile` use case. */
@Component
public class GetProfile {

  private final ProfileRepository profileRepository;

  public GetProfile(ProfileRepository profileRepository) {
    this.profileRepository = profileRepository;
  }

  public ProfileSnapshot execute(UUID userId) {
    return profileRepository
        .findByUserId(userId)
        .orElseThrow(() -> new NoSuchElementException("No profile for user: " + userId));
  }
}
