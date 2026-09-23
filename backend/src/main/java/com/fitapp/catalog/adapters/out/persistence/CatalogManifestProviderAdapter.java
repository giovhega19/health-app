package com.fitapp.catalog.adapters.out.persistence;

import com.fitapp.catalog.domain.CatalogManifest;
import com.fitapp.catalog.domain.CatalogManifestProvider;
import java.time.Instant;
import org.springframework.stereotype.Component;

/**
 * Real {@link CatalogManifestProvider} adapter (RF-02.06, CA-02.06.1): the manifest is computed
 * from the catalog tables themselves (row count + latest {@code updated_at}) instead of a separate
 * versioning table — simple and correct for a backend-served, append-mostly seed catalog; a
 * dedicated `catalog_manifest_state` table (as the mobile side has, plan.md §4) would only be
 * needed if the version had to be set independently of the underlying rows.
 */
@Component
public class CatalogManifestProviderAdapter implements CatalogManifestProvider {

  private final ExerciseJpaRepository exerciseJpaRepository;
  private final RoutineJpaRepository routineJpaRepository;

  public CatalogManifestProviderAdapter(
      ExerciseJpaRepository exerciseJpaRepository, RoutineJpaRepository routineJpaRepository) {
    this.exerciseJpaRepository = exerciseJpaRepository;
    this.routineJpaRepository = routineJpaRepository;
  }

  @Override
  public CatalogManifest getManifest() {
    long exerciseCount = exerciseJpaRepository.count();
    long routineCount = routineJpaRepository.count();
    Instant exercisesMaxUpdatedAt =
        exerciseJpaRepository
            .findTopByOrderByUpdatedAtDesc()
            .map(ExerciseEntity::getUpdatedAt)
            .orElse(Instant.EPOCH);
    Instant routinesMaxUpdatedAt =
        routineJpaRepository
            .findTopByOrderByUpdatedAtDesc()
            .map(RoutineEntity::getUpdatedAt)
            .orElse(Instant.EPOCH);
    Instant updatedAt =
        exercisesMaxUpdatedAt.isAfter(routinesMaxUpdatedAt)
            ? exercisesMaxUpdatedAt
            : routinesMaxUpdatedAt;
    String exercisesEtag =
        "exercises-" + exerciseCount + "-" + exercisesMaxUpdatedAt.toEpochMilli();
    String routinesEtag = "routines-" + routineCount + "-" + routinesMaxUpdatedAt.toEpochMilli();
    int version = (int) (exerciseCount + routineCount);
    return new CatalogManifest(
        version, exercisesEtag, routinesEtag, "https://cdn.fitapp.dev/", updatedAt);
  }
}
