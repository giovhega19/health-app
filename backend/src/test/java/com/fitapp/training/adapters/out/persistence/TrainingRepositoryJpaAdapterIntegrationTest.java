package com.fitapp.training.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.PostgresTestContainer;
import com.fitapp.training.domain.CustomExercise;
import com.fitapp.training.domain.CustomExerciseRepository;
import com.fitapp.training.domain.Routine;
import com.fitapp.training.domain.RoutineBlock;
import com.fitapp.training.domain.RoutineItem;
import com.fitapp.training.domain.RoutineRepository;
import com.fitapp.training.domain.ScheduleSlot;
import com.fitapp.training.domain.ScheduleSlotRepository;
import com.fitapp.training.domain.TimerSettings;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Real-database integration test for the `training` module's JPA adapters
 * (`db/migration/training/V1__*.sql`, `V2__*.sql`), analogous to `profile`'s
 * `ProfileRepositoryJpaAdapterIntegrationTest` (F01). Needs a working Docker daemon reachable by
 * Testcontainers (see {@link PostgresTestContainer}'s Javadoc for the known Windows/Docker Desktop
 * incompatibility this repo works around by excluding {@code @Tag("testcontainers")} from {@code
 * check} and running it only through {@code integrationTest}).
 */
@SpringBootTest
@Transactional
class TrainingRepositoryJpaAdapterIntegrationTest extends PostgresTestContainer {

  @Autowired private RoutineRepository routineRepository;
  @Autowired private CustomExerciseRepository customExerciseRepository;
  @Autowired private ScheduleSlotRepository scheduleSlotRepository;

  @Test
  void savesAndReloadsARoutineWithBlocksAndItems() {
    UUID userId = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();
    Routine routine =
        new Routine(
            UUID.randomUUID(),
            userId,
            "Full body",
            "My own routine",
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(
                new RoutineBlock(
                    UUID.randomUUID(),
                    "MAIN",
                    "STRAIGHT",
                    3,
                    List.of(
                        new RoutineItem(
                            UUID.randomUUID(), exerciseId, "CATALOG", 3, 12, null, null, null)))),
            1,
            Instant.now());

    routineRepository.save(routine);

    Routine reloaded = routineRepository.findById(routine.id()).orElseThrow();
    assertThat(reloaded.name()).isEqualTo("Full body");
    assertThat(reloaded.blocks()).hasSize(1);
    assertThat(reloaded.blocks().get(0).items().get(0).exerciseId()).isEqualTo(exerciseId);
  }

  @Test
  void savesAndReloadsACustomExerciseWithMuscleGroups() {
    UUID userId = UUID.randomUUID();
    CustomExercise exercise =
        new CustomExercise(
            UUID.randomUUID(),
            userId,
            "Curl concentrado",
            "En banco",
            null,
            List.of("BICEPS", "FOREARM"),
            "REPS",
            Instant.now());

    customExerciseRepository.save(exercise);

    CustomExercise reloaded = customExerciseRepository.findById(exercise.id()).orElseThrow();
    assertThat(reloaded.muscleGroups()).containsExactly("BICEPS", "FOREARM");
  }

  @Test
  void savesAndReloadsAScheduleSlotWithDaysOfWeek() {
    UUID userId = UUID.randomUUID();
    ScheduleSlot slot =
        new ScheduleSlot(
            UUID.randomUUID(),
            userId,
            UUID.randomUUID(),
            List.of(1, 3, 5),
            "07:30",
            15,
            true,
            Instant.now());

    scheduleSlotRepository.save(slot);

    ScheduleSlot reloaded = scheduleSlotRepository.findById(slot.id()).orElseThrow();
    assertThat(reloaded.daysOfWeek()).containsExactly(1, 3, 5);
  }

  /**
   * C1 (security review, H1/H2 pattern): backs `PurgeTrainingData`, triggered when `identity`
   * publishes `AccountDeleted` (Art. 5.4 of 00-constitucion.md). Real-DB proof that the
   * {@code @Modifying} bulk-delete queries actually remove the rows for all three entities.
   */
  @Test
  void deleteByUserIdRemovesEveryRowOfTheUserAcrossAllThreeTables_C1() {
    UUID userId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    routineRepository.save(
        new Routine(
            routineId,
            userId,
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            Instant.now()));
    customExerciseRepository.save(
        new CustomExercise(
            UUID.randomUUID(),
            userId,
            "Curl",
            null,
            null,
            List.of("BICEPS"),
            "REPS",
            Instant.now()));
    scheduleSlotRepository.save(
        new ScheduleSlot(
            UUID.randomUUID(), userId, routineId, List.of(1), "07:00", null, true, Instant.now()));
    UUID otherUserId = UUID.randomUUID();
    routineRepository.save(
        new Routine(
            UUID.randomUUID(),
            otherUserId,
            "Other user's",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            Instant.now()));

    routineRepository.deleteByUserId(userId);
    customExerciseRepository.deleteByUserId(userId);
    scheduleSlotRepository.deleteByUserId(userId);

    assertThat(routineRepository.findByUserIdUpdatedSince(userId, Instant.EPOCH, 500)).isEmpty();
    assertThat(customExerciseRepository.findByUserIdUpdatedSince(userId, Instant.EPOCH, 500))
        .isEmpty();
    assertThat(scheduleSlotRepository.findByUserIdUpdatedSince(userId, Instant.EPOCH, 500))
        .isEmpty();
    assertThat(routineRepository.findByUserIdUpdatedSince(otherUserId, Instant.EPOCH, 500))
        .hasSize(1);
  }
}
