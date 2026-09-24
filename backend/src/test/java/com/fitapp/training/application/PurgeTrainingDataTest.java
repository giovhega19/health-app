package com.fitapp.training.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.training.domain.CustomExercise;
import com.fitapp.training.domain.Routine;
import com.fitapp.training.domain.ScheduleSlot;
import com.fitapp.training.domain.TimerSettings;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Art. 5.4 of 00-constitucion.md / RNF-08: account deletion must also delete `training`'s own data
 * for the user, not just `identity_users`. Triggered in production by {@code
 * AccountDeletedListener} reacting to {@code identity}'s {@code AccountDeleted} event; this test
 * covers the use case in isolation from the eventing mechanism (same pattern as
 * `profile.application.PurgeProfileDataTest`, F01).
 */
class PurgeTrainingDataTest {

  @Test
  void deletesEveryRoutineCustomExerciseAndScheduleSlotOfTheUser() {
    FakeRoutineRepository routineRepository = new FakeRoutineRepository();
    FakeCustomExerciseRepository customExerciseRepository = new FakeCustomExerciseRepository();
    FakeScheduleSlotRepository scheduleSlotRepository = new FakeScheduleSlotRepository();
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
            UUID.randomUUID(), userId, routineId, List.of(1, 3), "07:00", 15, true, Instant.now()));
    UUID otherUserId = UUID.randomUUID();
    routineRepository.save(
        new Routine(
            UUID.randomUUID(),
            otherUserId,
            "Other user's routine",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            new TimerSettings(10, 40, 30, 60, 90, true),
            List.of(),
            1,
            Instant.now()));
    PurgeTrainingData useCase =
        new PurgeTrainingData(routineRepository, customExerciseRepository, scheduleSlotRepository);

    useCase.execute(userId);

    assertThat(routineRepository.findByUserIdUpdatedSince(userId, Instant.EPOCH, 500)).isEmpty();
    assertThat(customExerciseRepository.findByUserIdUpdatedSince(userId, Instant.EPOCH, 500))
        .isEmpty();
    assertThat(scheduleSlotRepository.findByUserIdUpdatedSince(userId, Instant.EPOCH, 500))
        .isEmpty();
    // Sanity check: only the deleted user's rows are gone, not everyone's.
    assertThat(routineRepository.findByUserIdUpdatedSince(otherUserId, Instant.EPOCH, 500))
        .hasSize(1);
  }
}
