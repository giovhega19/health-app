package com.fitapp.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.catalog.domain.InMemoryRoutineRepository;
import com.fitapp.catalog.domain.Routine;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * RF-02.06 {@link ListRoutinesUpdatedSince}, analogous to {@code ListExercisesUpdatedSinceTest}.
 */
class ListRoutinesUpdatedSinceTest {

  private static Routine aRoutine(String name, Instant updatedAt) {
    return new Routine(
        UUID.randomUUID(), name, "LOSE_WEIGHT", "BEGINNER", null, List.of(), 1, updatedAt);
  }

  @Test
  void devuelve_solo_las_rutinas_modificadas_despues_de_updatedSince() {
    Routine old = aRoutine("antigua", Instant.parse("2026-01-01T00:00:00Z"));
    Routine recent = aRoutine("reciente", Instant.parse("2026-02-01T00:00:00Z"));
    var repository = new InMemoryRoutineRepository(List.of(old, recent));
    var useCase = new ListRoutinesUpdatedSince(repository);

    List<Routine> result = useCase.execute(Instant.parse("2026-01-15T00:00:00Z"));

    assertThat(result).containsExactly(recent);
  }

  @Test
  void sin_updatedSince_devuelve_el_catalogo_completo() {
    Routine a = aRoutine("uno", Instant.parse("2026-01-01T00:00:00Z"));
    Routine b = aRoutine("dos", Instant.parse("2026-02-01T00:00:00Z"));
    var repository = new InMemoryRoutineRepository(List.of(a, b));
    var useCase = new ListRoutinesUpdatedSince(repository);

    List<Routine> result = useCase.execute(null);

    assertThat(result).containsExactlyInAnyOrder(a, b);
  }
}
