package com.fitapp.training.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.training.domain.Routine;
import com.fitapp.training.domain.RoutineBlock;
import com.fitapp.training.domain.RoutineItem;
import com.fitapp.training.domain.TimerSettings;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RoutineRepositoryJpaAdapterTest {

  @Mock private RoutineJpaRepository jpaRepository;
  private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

  @Test
  void savesAndMapsTimerDefaultsAndBlocksFromJson() throws Exception {
    RoutineRepositoryJpaAdapter adapter =
        new RoutineRepositoryJpaAdapter(jpaRepository, objectMapper);
    UUID routineId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();
    TimerSettings timerDefaults = new TimerSettings(10, 40, 30, 60, 90, true);
    List<RoutineBlock> blocks =
        List.of(
            new RoutineBlock(
                UUID.randomUUID(),
                "MAIN",
                "STRAIGHT",
                3,
                List.of(
                    new RoutineItem(
                        UUID.randomUUID(), exerciseId, "CATALOG", 3, 12, null, null, null))));
    Routine routine =
        new Routine(
            routineId,
            userId,
            "Full body",
            "desc",
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            timerDefaults,
            blocks,
            1,
            Instant.parse("2026-02-01T00:00:00Z"));
    RoutineEntity entity =
        new RoutineEntity(
            routineId,
            userId,
            "Full body",
            "desc",
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            objectMapper.writeValueAsString(timerDefaults),
            objectMapper.writeValueAsString(blocks),
            1,
            Instant.parse("2026-02-01T00:00:00Z"));
    when(jpaRepository.save(any(RoutineEntity.class))).thenReturn(entity);

    Routine saved = adapter.save(routine);

    assertThat(saved).isEqualTo(routine);
    assertThat(saved.blocks().get(0).items().get(0).exerciseId()).isEqualTo(exerciseId);
  }

  @Test
  void findByIdReturnsEmptyWhenNotFound() {
    RoutineRepositoryJpaAdapter adapter =
        new RoutineRepositoryJpaAdapter(jpaRepository, objectMapper);
    UUID id = UUID.randomUUID();
    when(jpaRepository.findById(id)).thenReturn(Optional.empty());

    assertThat(adapter.findById(id)).isEmpty();
  }

  @Test
  void findByUserIdUpdatedSinceRespectsTheLimit() throws Exception {
    RoutineRepositoryJpaAdapter adapter =
        new RoutineRepositoryJpaAdapter(jpaRepository, objectMapper);
    UUID userId = UUID.randomUUID();
    Instant since = Instant.EPOCH;
    RoutineEntity first = anEntity(userId);
    RoutineEntity second = anEntity(userId);
    when(jpaRepository.findByUserIdUpdatedSince(userId, since)).thenReturn(List.of(first, second));

    assertThat(adapter.findByUserIdUpdatedSince(userId, since, 1)).hasSize(1);
  }

  @Test
  void deleteByIdDelegatesToTheJpaRepository() {
    RoutineRepositoryJpaAdapter adapter =
        new RoutineRepositoryJpaAdapter(jpaRepository, objectMapper);
    UUID id = UUID.randomUUID();

    adapter.deleteById(id);

    verify(jpaRepository).deleteById(id);
  }

  @Test
  void deleteByUserIdDelegatesToTheJpaRepository() {
    RoutineRepositoryJpaAdapter adapter =
        new RoutineRepositoryJpaAdapter(jpaRepository, objectMapper);
    UUID userId = UUID.randomUUID();

    adapter.deleteByUserId(userId);

    verify(jpaRepository).deleteByUserId(userId);
  }

  @Test
  void wrapsCorruptJsonInAnIllegalStateException() {
    RoutineRepositoryJpaAdapter adapter =
        new RoutineRepositoryJpaAdapter(jpaRepository, objectMapper);
    RoutineEntity corrupt =
        new RoutineEntity(
            UUID.randomUUID(),
            UUID.randomUUID(),
            "Full body",
            null,
            "LOSE_WEIGHT",
            "BEGINNER",
            "USER",
            "not-json",
            "not-json",
            1,
            Instant.now());
    when(jpaRepository.findById(corrupt.getId())).thenReturn(Optional.of(corrupt));

    assertThatThrownBy(() -> adapter.findById(corrupt.getId()))
        .isInstanceOf(IllegalStateException.class);
  }

  private RoutineEntity anEntity(UUID userId) throws Exception {
    TimerSettings timerDefaults = new TimerSettings(10, 40, 30, 60, 90, true);
    return new RoutineEntity(
        UUID.randomUUID(),
        userId,
        "Full body",
        null,
        "LOSE_WEIGHT",
        "BEGINNER",
        "USER",
        objectMapper.writeValueAsString(timerDefaults),
        objectMapper.writeValueAsString(List.of()),
        1,
        Instant.now());
  }
}
