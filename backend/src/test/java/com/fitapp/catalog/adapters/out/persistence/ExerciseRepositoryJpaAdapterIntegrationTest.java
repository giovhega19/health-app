package com.fitapp.catalog.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.PostgresTestContainer;
import com.fitapp.catalog.domain.CatalogManifest;
import com.fitapp.catalog.domain.CatalogManifestProvider;
import com.fitapp.catalog.domain.Exercise;
import com.fitapp.catalog.domain.ExerciseRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real-database integration test for the `catalog` module's JPA adapters
 * (`db/migration/catalog/V3__*.sql`). Runs against the {@code dev} profile's {@link
 * CatalogDevSeeder}, so the manifest/exercise repositories are exercised against the same
 * 8-exercise/3-routine seed served in development (`specs/F02-catalogo-propuesta/plan.md` §1),
 * validating `updatedSince` filtering (CA-02.06.1) end-to-end against PostgreSQL, not just the
 * in-memory fake already covered by {@code ListExercisesUpdatedSinceTest}.
 */
@SpringBootTest
@Transactional
class ExerciseRepositoryJpaAdapterIntegrationTest extends PostgresTestContainer {

  @Autowired private ExerciseRepository exerciseRepository;
  @Autowired private CatalogManifestProvider catalogManifestProvider;
  @Autowired private ExerciseJpaRepository exerciseJpaRepository;

  @Test
  void devSeedIsLoadedAndManifestReflectsIt() {
    List<Exercise> exercises = exerciseRepository.findAll();

    assertThat(exercises).hasSizeGreaterThanOrEqualTo(6);
    CatalogManifest manifest = catalogManifestProvider.getManifest();
    assertThat(manifest.version()).isGreaterThan(0);
    assertThat(manifest.exercisesEtag()).isNotBlank();
  }

  @Test
  void findUpdatedSinceFiltersOutOlderExercises() {
    Instant farFuture = Instant.parse("2099-01-01T00:00:00Z");
    exerciseJpaRepository.save(
        new ExerciseEntity(
            UUID.randomUUID(),
            "integration-test-exercise",
            "Ejercicio de prueba",
            ExerciseRepositoryJpaAdapter.join(List.of("CHEST")),
            ExerciseRepositoryJpaAdapter.join(List.of("NONE")),
            1,
            "REPS",
            3.0,
            ExerciseRepositoryJpaAdapter.join(List.of("Paso 1", "Paso 2", "Paso 3")),
            ExerciseRepositoryJpaAdapter.join(List.of("Error 1", "Error 2")),
            "https://cdn.fitapp.test/img.png",
            null,
            null,
            farFuture));

    List<Exercise> updated =
        exerciseRepository.findUpdatedSince(Instant.parse("2098-01-01T00:00:00Z"));

    assertThat(updated).extracting(Exercise::slug).containsExactly("integration-test-exercise");
  }
}
