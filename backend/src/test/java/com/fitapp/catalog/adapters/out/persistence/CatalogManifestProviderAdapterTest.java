package com.fitapp.catalog.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.fitapp.catalog.domain.CatalogManifest;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogManifestProviderAdapterTest {

  @Mock private ExerciseJpaRepository exerciseJpaRepository;
  @Mock private RoutineJpaRepository routineJpaRepository;

  @Test
  void computesTheManifestFromCountsAndLatestUpdatedAt() {
    CatalogManifestProviderAdapter adapter =
        new CatalogManifestProviderAdapter(exerciseJpaRepository, routineJpaRepository);
    Instant exercisesMax = Instant.parse("2026-02-01T00:00:00Z");
    Instant routinesMax = Instant.parse("2026-01-01T00:00:00Z");
    when(exerciseJpaRepository.count()).thenReturn(8L);
    when(routineJpaRepository.count()).thenReturn(3L);
    when(exerciseJpaRepository.findTopByOrderByUpdatedAtDesc())
        .thenReturn(Optional.of(anExerciseEntity(exercisesMax)));
    when(routineJpaRepository.findTopByOrderByUpdatedAtDesc())
        .thenReturn(Optional.of(aRoutineEntity(routinesMax)));

    CatalogManifest manifest = adapter.getManifest();

    assertThat(manifest.version()).isEqualTo(11);
    assertThat(manifest.updatedAt()).isEqualTo(exercisesMax);
    assertThat(manifest.exercisesEtag()).contains("8");
    assertThat(manifest.routinesEtag()).contains("3");
  }

  @Test
  void fallsBackToEpochWhenTheCatalogIsEmpty() {
    CatalogManifestProviderAdapter adapter =
        new CatalogManifestProviderAdapter(exerciseJpaRepository, routineJpaRepository);
    when(exerciseJpaRepository.count()).thenReturn(0L);
    when(routineJpaRepository.count()).thenReturn(0L);
    when(exerciseJpaRepository.findTopByOrderByUpdatedAtDesc()).thenReturn(Optional.empty());
    when(routineJpaRepository.findTopByOrderByUpdatedAtDesc()).thenReturn(Optional.empty());

    CatalogManifest manifest = adapter.getManifest();

    assertThat(manifest.version()).isEqualTo(0);
    assertThat(manifest.updatedAt()).isEqualTo(Instant.EPOCH);
  }

  private static ExerciseEntity anExerciseEntity(Instant updatedAt) {
    return new ExerciseEntity(
        java.util.UUID.randomUUID(),
        "slug",
        "name",
        "CHEST",
        "NONE",
        1,
        "REPS",
        3.0,
        "a",
        "b",
        "url",
        null,
        null,
        updatedAt);
  }

  private static RoutineEntity aRoutineEntity(Instant updatedAt) {
    return new RoutineEntity(
        java.util.UUID.randomUUID(), "name", "goal", "level", "{}", "[]", 1, updatedAt);
  }
}
