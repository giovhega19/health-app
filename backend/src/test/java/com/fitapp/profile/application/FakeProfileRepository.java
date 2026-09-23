package com.fitapp.profile.application;

import com.fitapp.profile.domain.ProfileRepository;
import com.fitapp.profile.domain.ProfileSnapshot;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * In-memory fake of {@link ProfileRepository} ("fakes before mocks for repository ports",
 * `07-estrategia-pruebas.md` §2.4).
 */
public class FakeProfileRepository implements ProfileRepository {

  private final Map<UUID, ProfileSnapshot> byUserId = new HashMap<>();

  @Override
  public Optional<ProfileSnapshot> findByUserId(UUID userId) {
    return Optional.ofNullable(byUserId.get(userId));
  }

  @Override
  public ProfileSnapshot save(ProfileSnapshot profile) {
    byUserId.put(profile.userId(), profile);
    return profile;
  }

  @Override
  public void deleteByUserId(UUID userId) {
    byUserId.remove(userId);
  }
}
