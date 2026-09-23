package com.fitapp.profile.application;

import com.fitapp.profile.domain.AgeBelowMinimumException;
import com.fitapp.profile.domain.ProfileRepository;
import com.fitapp.profile.domain.ProfileRules;
import com.fitapp.profile.domain.ProfileSnapshot;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * RF-01.03/RF-01.06 `PUT /me/profile` use case (`specs/F01-perfil-onboarding/plan.md` §2, task
 * F01-T06).
 *
 * <p>Computes the age from {@code command.birthDate()} using {@code clock} (Art. 2.4: the clock is
 * a port, RN-01 needs "today") and rejects it with {@link AgeBelowMinimumException} when it is
 * below 16 (CA-01.03.1, D2); also validates height/weight ranges (RN-02,
 * `specs/F01-perfil-onboarding/spec.md` "Validaciones", shared with `sync` via {@link
 * ProfileRules}) before persisting via {@link ProfileRepository}. Upserts by {@code userId} (one
 * profile per user).
 */
@Component
public class UpsertProfile {

  private final ProfileRepository profileRepository;
  private final Clock clock;

  public UpsertProfile(ProfileRepository profileRepository, Clock clock) {
    this.profileRepository = profileRepository;
    this.clock = clock;
  }

  @Transactional
  public UpsertProfileResult execute(UpsertProfileCommand command) {
    ProfileRules.requireMinimumAge(command.birthDate(), clock);
    ProfileRules.requireHeightInRange(command.heightCm());
    if (command.targetWeightKg() != null) {
      ProfileRules.requireWeightInRange(command.targetWeightKg(), "targetWeightKg");
    }

    ProfileSnapshot existing = profileRepository.findByUserId(command.userId()).orElse(null);
    Instant now = clock.instant();
    ProfileSnapshot toSave =
        new ProfileSnapshot(
            existing != null ? existing.id() : UUID.randomUUID(),
            command.userId(),
            command.birthDate(),
            command.gender(),
            command.heightCm(),
            command.goal(),
            command.level(),
            command.daysPerWeek(),
            command.minutesPerSession(),
            command.equipment(),
            command.unitSystem(),
            command.targetWeightKg(),
            command.parqFlagged(),
            existing != null ? existing.healthConsentAt() : now,
            now);
    ProfileSnapshot saved = profileRepository.save(toSave);
    return new UpsertProfileResult(saved.id());
  }
}
