package com.fitapp.training.adapters.in.event;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.identity.domain.events.AccountDeleted;
import com.fitapp.training.application.FakeCustomExerciseRepository;
import com.fitapp.training.application.FakeRoutineRepository;
import com.fitapp.training.application.FakeScheduleSlotRepository;
import com.fitapp.training.application.PurgeTrainingData;
import com.fitapp.training.domain.Routine;
import com.fitapp.training.domain.TimerSettings;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Confirms the inbound adapter for {@code identity}'s {@link AccountDeleted} event correctly
 * triggers {@link PurgeTrainingData} (Art. 5.4 of 00-constitucion.md).
 */
class AccountDeletedListenerTest {

  @Test
  void purgesTrainingDataWhenAnAccountDeletedEventArrives() {
    FakeRoutineRepository routineRepository = new FakeRoutineRepository();
    FakeCustomExerciseRepository customExerciseRepository = new FakeCustomExerciseRepository();
    FakeScheduleSlotRepository scheduleSlotRepository = new FakeScheduleSlotRepository();
    UUID userId = UUID.randomUUID();
    routineRepository.save(
        new Routine(
            UUID.randomUUID(),
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
    AccountDeletedListener listener =
        new AccountDeletedListener(
            new PurgeTrainingData(
                routineRepository, customExerciseRepository, scheduleSlotRepository));

    listener.on(new AccountDeleted(userId, Instant.now()));

    assertThat(routineRepository.findByUserIdUpdatedSince(userId, Instant.EPOCH, 500)).isEmpty();
  }
}
