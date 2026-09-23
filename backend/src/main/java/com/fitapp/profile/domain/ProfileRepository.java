package com.fitapp.profile.domain;

import java.util.Optional;
import java.util.UUID;

/**
 * Out port for {@link ProfileSnapshot} persistence (Art. 2.3 of 00-constitucion.md). Implemented by
 * {@code profile/adapters/out/persistence} in F01-T06.
 */
public interface ProfileRepository {

  Optional<ProfileSnapshot> findByUserId(UUID userId);

  ProfileSnapshot save(ProfileSnapshot profile);

  /**
   * Deletes the profile row(s) for {@code userId}, if any (Art. 5.4: account deletion cascades to
   * this module's data, see {@code PurgeProfileData} / {@code AccountDeletedListener}).
   */
  void deleteByUserId(UUID userId);
}
