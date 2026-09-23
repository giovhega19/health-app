package com.fitapp.profile.adapters.out.sync;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.profile.domain.ProfileRepository;
import com.fitapp.profile.domain.ProfileRules;
import com.fitapp.profile.domain.ProfileSnapshot;
import com.fitapp.shared.domain.ApiException;
import com.fitapp.sync.domain.SyncApplyResult;
import com.fitapp.sync.domain.SyncChange;
import com.fitapp.sync.domain.SyncEntityHandler;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link SyncEntityHandler} for {@code entity: "profile"} (CA-01.01.1). Implements last-write-wins
 * conflict resolution (RN-18, ADR-007): a change older than or equal to what the server already has
 * is treated as an accepted no-op (this also makes push retries idempotent).
 */
@Component
public class ProfileSyncEntityHandler implements SyncEntityHandler {

  private final ProfileRepository profileRepository;
  private final ObjectMapper objectMapper;
  private final Clock clock;

  public ProfileSyncEntityHandler(
      ProfileRepository profileRepository, ObjectMapper objectMapper, Clock clock) {
    this.profileRepository = profileRepository;
    this.objectMapper = objectMapper;
    this.clock = clock;
  }

  @Override
  public String supportedEntity() {
    return "profile";
  }

  @Override
  @Transactional
  public SyncApplyResult apply(UUID userId, SyncChange change) {
    if (!change.isUpsert()) {
      return SyncApplyResult.rejected(
          "VALIDATION_ERROR", "The profile cannot be deleted via sync.");
    }
    ProfileSnapshot existing = profileRepository.findByUserId(userId).orElse(null);
    if (existing != null && !change.updatedAt().isAfter(existing.updatedAt())) {
      return SyncApplyResult.ok();
    }
    try {
      ProfileSyncPayload payload =
          objectMapper.convertValue(change.data(), ProfileSyncPayload.class);
      ProfileRules.requireMinimumAge(payload.birthDate(), clock);
      ProfileRules.requireHeightInRange(payload.heightCm());
      if (payload.targetWeightKg() != null) {
        ProfileRules.requireWeightInRange(payload.targetWeightKg(), "targetWeightKg");
      }
      ProfileSnapshot toSave =
          new ProfileSnapshot(
              existing != null ? existing.id() : change.id(),
              userId,
              payload.birthDate(),
              payload.gender(),
              payload.heightCm(),
              payload.goal(),
              payload.level(),
              payload.daysPerWeek(),
              payload.minutesPerSession(),
              payload.equipment() == null ? List.of() : payload.equipment(),
              payload.unitSystem(),
              payload.targetWeightKg(),
              payload.parqFlagged(),
              existing != null ? existing.healthConsentAt() : change.updatedAt(),
              change.updatedAt());
      profileRepository.save(toSave);
      return SyncApplyResult.ok();
    } catch (ApiException e) {
      return SyncApplyResult.rejected(e.code(), e.getMessage());
    } catch (RuntimeException e) {
      return SyncApplyResult.rejected("VALIDATION_ERROR", "Malformed profile payload.");
    }
  }

  @Override
  public List<SyncChange> pullSince(UUID userId, Instant since, UUID sinceId, int limit) {
    return profileRepository
        .findByUserId(userId)
        .filter(profile -> isAfterCursor(profile, since, sinceId))
        .map(profile -> List.of(toChange(profile)))
        .orElseGet(List::of);
  }

  private static boolean isAfterCursor(ProfileSnapshot profile, Instant since, UUID sinceId) {
    return profile.updatedAt().isAfter(since)
        || (profile.updatedAt().equals(since) && profile.id().compareTo(sinceId) > 0);
  }

  private SyncChange toChange(ProfileSnapshot profile) {
    Map<String, Object> data =
        objectMapper.convertValue(
            new ProfileSyncPayload(
                profile.birthDate(),
                profile.gender(),
                profile.heightCm(),
                profile.goal(),
                profile.level(),
                profile.daysPerWeek(),
                profile.minutesPerSession(),
                profile.equipment(),
                profile.unitSystem(),
                profile.targetWeightKg(),
                profile.parqFlagged()),
            new TypeReference<Map<String, Object>>() {});
    return new SyncChange("profile", "upsert", profile.id(), profile.updatedAt(), data);
  }
}
