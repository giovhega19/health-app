package com.fitapp.training.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fitapp.training.domain.ScheduleSlot;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ScheduleSlotRepositoryJpaAdapterTest {

  @Mock private ScheduleSlotJpaRepository jpaRepository;

  @Test
  void savesAndMapsBackToADomainScheduleSlot() {
    ScheduleSlotRepositoryJpaAdapter adapter = new ScheduleSlotRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID routineId = UUID.randomUUID();
    ScheduleSlot slot =
        new ScheduleSlot(id, userId, routineId, List.of(1, 3, 5), "07:30", 15, true, Instant.now());
    ScheduleSlotEntity entity =
        new ScheduleSlotEntity(
            id,
            userId,
            routineId,
            ScheduleSlotRepositoryJpaAdapter.join(List.of(1, 3, 5)),
            "07:30",
            15,
            true,
            slot.updatedAt());
    when(jpaRepository.save(any(ScheduleSlotEntity.class))).thenReturn(entity);

    ScheduleSlot saved = adapter.save(slot);

    assertThat(saved).isEqualTo(slot);
  }

  @Test
  void findByIdReturnsEmptyWhenNotFound() {
    ScheduleSlotRepositoryJpaAdapter adapter = new ScheduleSlotRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    when(jpaRepository.findById(id)).thenReturn(Optional.empty());

    assertThat(adapter.findById(id)).isEmpty();
  }

  @Test
  void findByUserIdUpdatedSinceRespectsTheLimit() {
    ScheduleSlotRepositoryJpaAdapter adapter = new ScheduleSlotRepositoryJpaAdapter(jpaRepository);
    UUID userId = UUID.randomUUID();
    Instant since = Instant.EPOCH;
    ScheduleSlotEntity first =
        new ScheduleSlotEntity(
            UUID.randomUUID(), userId, UUID.randomUUID(), "1", "07:00", null, true, Instant.now());
    ScheduleSlotEntity second =
        new ScheduleSlotEntity(
            UUID.randomUUID(), userId, UUID.randomUUID(), "2", "08:00", null, true, Instant.now());
    when(jpaRepository.findByUserIdUpdatedSince(userId, since)).thenReturn(List.of(first, second));

    assertThat(adapter.findByUserIdUpdatedSince(userId, since, 1)).hasSize(1);
  }

  @Test
  void deleteByIdDelegatesToTheJpaRepository() {
    ScheduleSlotRepositoryJpaAdapter adapter = new ScheduleSlotRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();

    adapter.deleteById(id);

    verify(jpaRepository).deleteById(id);
  }

  @Test
  void deleteByUserIdDelegatesToTheJpaRepository() {
    ScheduleSlotRepositoryJpaAdapter adapter = new ScheduleSlotRepositoryJpaAdapter(jpaRepository);
    UUID userId = UUID.randomUUID();

    adapter.deleteByUserId(userId);

    verify(jpaRepository).deleteByUserId(userId);
  }

  @Test
  void mapsAnEmptyDaysOfWeekStringToAnEmptyList() {
    ScheduleSlotRepositoryJpaAdapter adapter = new ScheduleSlotRepositoryJpaAdapter(jpaRepository);
    UUID id = UUID.randomUUID();
    ScheduleSlotEntity entity =
        new ScheduleSlotEntity(
            id, UUID.randomUUID(), UUID.randomUUID(), "", "07:00", null, true, Instant.now());
    when(jpaRepository.findById(id)).thenReturn(Optional.of(entity));

    assertThat(adapter.findById(id))
        .get()
        .extracting(ScheduleSlot::daysOfWeek)
        .isEqualTo(List.of());
  }
}
