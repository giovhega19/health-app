package com.fitapp.training.application;

import com.fitapp.training.domain.CustomExerciseRepository;
import com.fitapp.training.domain.RoutineRepository;
import com.fitapp.training.domain.ScheduleSlotRepository;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deletes every {@code training}-owned row for a user: {@code training_user_routines}, {@code
 * training_custom_exercises} and {@code training_schedule_slots} (Art. 5.4 of 00-constitucion.md,
 * RNF-08: right of erasure). Triggered by {@code AccountDeletedListener} when {@code identity}
 * publishes {@code AccountDeleted}; kept as its own use case (rather than inline in the listener)
 * so it stays testable/callable independently of the eventing mechanism — same pattern as {@code
 * profile.application.PurgeProfileData} (F01).
 */
@Component
public class PurgeTrainingData {

  private final RoutineRepository routineRepository;
  private final CustomExerciseRepository customExerciseRepository;
  private final ScheduleSlotRepository scheduleSlotRepository;

  public PurgeTrainingData(
      RoutineRepository routineRepository,
      CustomExerciseRepository customExerciseRepository,
      ScheduleSlotRepository scheduleSlotRepository) {
    this.routineRepository = routineRepository;
    this.customExerciseRepository = customExerciseRepository;
    this.scheduleSlotRepository = scheduleSlotRepository;
  }

  @Transactional
  public void execute(UUID userId) {
    routineRepository.deleteByUserId(userId);
    customExerciseRepository.deleteByUserId(userId);
    scheduleSlotRepository.deleteByUserId(userId);
  }
}
