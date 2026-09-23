package com.fitapp.profile.adapters.out.persistence;

import com.fitapp.profile.domain.ProfileRepository;
import com.fitapp.profile.domain.ProfileSnapshot;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Real {@link ProfileRepository} adapter over Spring Data JPA / PostgreSQL. */
@Component
public class ProfileRepositoryJpaAdapter implements ProfileRepository {

  private final ProfileJpaRepository jpaRepository;

  public ProfileRepositoryJpaAdapter(ProfileJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public Optional<ProfileSnapshot> findByUserId(UUID userId) {
    return jpaRepository.findByUserId(userId).map(ProfileRepositoryJpaAdapter::toDomain);
  }

  @Override
  public ProfileSnapshot save(ProfileSnapshot profile) {
    ProfileEntity saved =
        jpaRepository.save(
            new ProfileEntity(
                profile.id(),
                profile.userId(),
                profile.birthDate(),
                profile.gender(),
                profile.heightCm(),
                profile.goal(),
                profile.level(),
                profile.daysPerWeek(),
                profile.minutesPerSession(),
                String.join(",", profile.equipment()),
                profile.unitSystem(),
                profile.targetWeightKg(),
                profile.parqFlagged(),
                profile.healthConsentAt(),
                profile.updatedAt()));
    return toDomain(saved);
  }

  @Override
  public void deleteByUserId(UUID userId) {
    jpaRepository.deleteByUserId(userId);
  }

  private static ProfileSnapshot toDomain(ProfileEntity entity) {
    List<String> equipment =
        entity.getEquipment() == null || entity.getEquipment().isBlank()
            ? List.of()
            : List.of(entity.getEquipment().split(","));
    return new ProfileSnapshot(
        entity.getId(),
        entity.getUserId(),
        entity.getBirthDate(),
        entity.getGender(),
        entity.getHeightCm(),
        entity.getGoal(),
        entity.getLevel(),
        entity.getDaysPerWeek(),
        entity.getMinutesPerSession(),
        equipment,
        entity.getUnitSystem(),
        entity.getTargetWeightKg(),
        entity.isParqFlagged(),
        entity.getHealthConsentAt(),
        entity.getUpdatedAt());
  }
}
