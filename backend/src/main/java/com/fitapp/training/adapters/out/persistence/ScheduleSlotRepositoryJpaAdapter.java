package com.fitapp.training.adapters.out.persistence;

import com.fitapp.training.domain.ScheduleSlot;
import com.fitapp.training.domain.ScheduleSlotRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/** Real {@link ScheduleSlotRepository} adapter over Spring Data JPA / PostgreSQL. */
@Component
public class ScheduleSlotRepositoryJpaAdapter implements ScheduleSlotRepository {

  static final String SEPARATOR = ",";

  private final ScheduleSlotJpaRepository jpaRepository;

  public ScheduleSlotRepositoryJpaAdapter(ScheduleSlotJpaRepository jpaRepository) {
    this.jpaRepository = jpaRepository;
  }

  @Override
  public Optional<ScheduleSlot> findById(UUID id) {
    return jpaRepository.findById(id).map(ScheduleSlotRepositoryJpaAdapter::toDomain);
  }

  @Override
  public ScheduleSlot save(ScheduleSlot slot) {
    ScheduleSlotEntity saved =
        jpaRepository.save(
            new ScheduleSlotEntity(
                slot.id(),
                slot.userId(),
                slot.routineId(),
                join(slot.daysOfWeek()),
                slot.startTime(),
                slot.reminderOffsetMinutes(),
                slot.active(),
                slot.updatedAt()));
    return toDomain(saved);
  }

  @Override
  public void deleteById(UUID id) {
    jpaRepository.deleteById(id);
  }

  @Override
  public List<ScheduleSlot> findByUserIdUpdatedSince(UUID userId, Instant since, int limit) {
    return jpaRepository.findByUserIdUpdatedSince(userId, since).stream()
        .limit(limit)
        .map(ScheduleSlotRepositoryJpaAdapter::toDomain)
        .toList();
  }

  @Override
  public void deleteByUserId(UUID userId) {
    jpaRepository.deleteByUserId(userId);
  }

  private static ScheduleSlot toDomain(ScheduleSlotEntity entity) {
    return new ScheduleSlot(
        entity.getId(),
        entity.getUserId(),
        entity.getRoutineId(),
        split(entity.getDaysOfWeek()),
        entity.getStartTime(),
        entity.getReminderOffsetMinutes(),
        entity.isActive(),
        entity.getUpdatedAt());
  }

  private static List<Integer> split(String value) {
    if (value == null || value.isEmpty()) {
      return List.of();
    }
    return List.of(value.split(SEPARATOR, -1)).stream().map(Integer::parseInt).toList();
  }

  static String join(List<Integer> values) {
    if (values == null) {
      return "";
    }
    return values.stream().map(String::valueOf).reduce((a, b) -> a + SEPARATOR + b).orElse("");
  }
}
