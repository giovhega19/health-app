package com.fitapp.catalog.adapters.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitapp.catalog.domain.Routine;
import com.fitapp.catalog.domain.RoutineBlock;
import com.fitapp.catalog.domain.RoutineItem;
import com.fitapp.catalog.domain.TimerSettings;
import java.time.Instant;
import java.util.List;
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
  void mapsTimerDefaultsAndBlocksFromJson() throws Exception {
    RoutineRepositoryJpaAdapter adapter =
        new RoutineRepositoryJpaAdapter(jpaRepository, objectMapper);
    UUID routineId = UUID.randomUUID();
    UUID exerciseId = UUID.randomUUID();
    TimerSettings timerDefaults = new TimerSettings(10, 40, 30, 60, 90, true);
    List<RoutineBlock> blocks =
        List.of(
            new RoutineBlock(
                UUID.randomUUID(),
                "MAIN",
                "STRAIGHT",
                3,
                List.of(new RoutineItem(UUID.randomUUID(), exerciseId, 3, 12, null, null, null))));
    RoutineEntity entity =
        new RoutineEntity(
            routineId,
            "Full body",
            "LOSE_WEIGHT",
            "BEGINNER",
            objectMapper.writeValueAsString(timerDefaults),
            objectMapper.writeValueAsString(blocks),
            1,
            Instant.parse("2026-02-01T00:00:00Z"));
    when(jpaRepository.findAll()).thenReturn(List.of(entity));

    List<Routine> routines = adapter.findAll();

    assertThat(routines).hasSize(1);
    Routine routine = routines.get(0);
    assertThat(routine.timerDefaults()).isEqualTo(timerDefaults);
    assertThat(routine.blocks()).hasSize(1);
    assertThat(routine.blocks().get(0).items().get(0).exerciseId()).isEqualTo(exerciseId);
  }

  @Test
  void findUpdatedSinceDelegatesToTheRepositoryQuery() throws Exception {
    RoutineRepositoryJpaAdapter adapter =
        new RoutineRepositoryJpaAdapter(jpaRepository, objectMapper);
    Instant since = Instant.parse("2026-01-15T00:00:00Z");
    RoutineEntity entity =
        new RoutineEntity(
            UUID.randomUUID(),
            "Full body",
            "LOSE_WEIGHT",
            "BEGINNER",
            objectMapper.writeValueAsString(new TimerSettings(10, 40, 30, 60, 90, true)),
            objectMapper.writeValueAsString(List.of()),
            1,
            Instant.parse("2026-02-01T00:00:00Z"));
    when(jpaRepository.findByUpdatedAtAfter(since)).thenReturn(List.of(entity));

    assertThat(adapter.findUpdatedSince(since)).hasSize(1);
  }

  @Test
  void wrapsCorruptJsonInAnIllegalStateException() {
    RoutineRepositoryJpaAdapter adapter =
        new RoutineRepositoryJpaAdapter(jpaRepository, objectMapper);
    RoutineEntity corrupt =
        new RoutineEntity(
            UUID.randomUUID(),
            "Full body",
            "LOSE_WEIGHT",
            "BEGINNER",
            "not-json",
            "not-json",
            1,
            Instant.now());
    when(jpaRepository.findAll()).thenReturn(List.of(corrupt));

    assertThatThrownBy(adapter::findAll).isInstanceOf(IllegalStateException.class);
  }
}
