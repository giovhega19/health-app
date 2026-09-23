package com.fitapp.profile.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fitapp.profile.domain.ProfileSnapshot;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProfileRepositoryJpaAdapterTest {

  @Mock private ProfileJpaRepository jpaRepository;

  private static ProfileSnapshot aSnapshot(UUID id, UUID userId, List<String> equipment) {
    Instant now = Instant.parse("2026-01-01T00:00:00Z");
    return new ProfileSnapshot(
        id,
        userId,
        LocalDate.of(1996, 1, 1),
        "FEMALE",
        165.0,
        "GENERAL_HEALTH",
        "BEGINNER",
        3,
        30,
        equipment,
        "METRIC",
        60.0,
        false,
        now,
        now);
  }

  @Test
  void savesAndMapsTheEquipmentListBackCorrectly() {
    ProfileRepositoryJpaAdapter adapter = new ProfileRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    ProfileSnapshot snapshot = aSnapshot(id, userId, List.of("NONE", "DUMBBELLS"));
    ProfileEntity entity =
        new ProfileEntity(
            id,
            userId,
            snapshot.birthDate(),
            snapshot.gender(),
            snapshot.heightCm(),
            snapshot.goal(),
            snapshot.level(),
            snapshot.daysPerWeek(),
            snapshot.minutesPerSession(),
            "NONE,DUMBBELLS",
            snapshot.unitSystem(),
            snapshot.targetWeightKg(),
            snapshot.parqFlagged(),
            snapshot.healthConsentAt(),
            snapshot.updatedAt());
    when(jpaRepository.save(any(ProfileEntity.class))).thenReturn(entity);

    ProfileSnapshot saved = adapter.save(snapshot);

    assertThat(saved.equipment()).containsExactly("NONE", "DUMBBELLS");
  }

  @Test
  void mapsAnEmptyEquipmentStringToAnEmptyList() {
    ProfileRepositoryJpaAdapter adapter = new ProfileRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    ProfileSnapshot snapshot = aSnapshot(id, userId, List.of());
    ProfileEntity entity =
        new ProfileEntity(
            id,
            userId,
            snapshot.birthDate(),
            snapshot.gender(),
            snapshot.heightCm(),
            snapshot.goal(),
            snapshot.level(),
            snapshot.daysPerWeek(),
            snapshot.minutesPerSession(),
            "",
            snapshot.unitSystem(),
            snapshot.targetWeightKg(),
            snapshot.parqFlagged(),
            snapshot.healthConsentAt(),
            snapshot.updatedAt());
    when(jpaRepository.save(any(ProfileEntity.class))).thenReturn(entity);

    ProfileSnapshot saved = adapter.save(snapshot);

    assertThat(saved.equipment()).isEmpty();
  }

  @Test
  void findByUserIdReturnsEmptyWhenNotFound() {
    ProfileRepositoryJpaAdapter adapter = new ProfileRepositoryJpaAdapter(jpaRepository);
    UUID userId = UUID.randomUUID();
    when(jpaRepository.findByUserId(userId)).thenReturn(Optional.empty());

    assertThat(adapter.findByUserId(userId)).isEmpty();
  }
}
