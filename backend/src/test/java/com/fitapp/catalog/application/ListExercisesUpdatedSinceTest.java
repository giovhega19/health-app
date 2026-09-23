package com.fitapp.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;

import com.fitapp.catalog.domain.Exercise;
import com.fitapp.catalog.domain.InMemoryExerciseRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * RF-02.06 {@link ListExercisesUpdatedSince} — sincronización incremental del catálogo del lado
 * servidor (CA-02.06.1: "descarga solo los cambios (updatedSince) en segundo plano").
 *
 * <p>Este es prácticamente el único comportamiento de servidor de F02 que no es CRUD puro (el resto
 * del backend de catálogo es lectura simple, ver `specs/F02-catalogo-propuesta/plan.md` §2: "de
 * solo lectura desde el cliente"): filtrar por `updatedSince`. Por eso es el foco de las pruebas de
 * backend; el resto del esfuerzo de esta ronda se concentra en el lado móvil
 * (`RecommendationEngine`, el corazón de F02).
 *
 * <p>Falla ahora mismo (tarea `F02-T06` no implementada): {@link ListExercisesUpdatedSince#execute}
 * lanza {@link UnsupportedOperationException} en vez de devolver el resultado esperado — el estado
 * rojo correcto (falla en tiempo de ejecución, no en compilación).
 */
class ListExercisesUpdatedSinceTest {

  private static Exercise anExercise(String slug, Instant updatedAt) {
    return new Exercise(
        UUID.randomUUID(),
        slug,
        "Nombre " + slug,
        List.of("CHEST"),
        List.of("NONE"),
        1,
        "REPS",
        3.8,
        List.of("Paso 1", "Paso 2", "Paso 3"),
        List.of("Error 1", "Error 2"),
        "https://cdn.fitapp.test/img/" + slug + ".png",
        null,
        null,
        updatedAt);
  }

  @Test
  void CA_02_06_1_devuelve_solo_los_ejercicios_modificados_despues_de_updatedSince() {
    Exercise old = anExercise("antiguo", Instant.parse("2026-01-01T00:00:00Z"));
    Exercise recent = anExercise("reciente", Instant.parse("2026-02-01T00:00:00Z"));
    var repository = new InMemoryExerciseRepository(List.of(old, recent));
    var useCase = new ListExercisesUpdatedSince(repository);

    List<Exercise> result = useCase.execute(Instant.parse("2026-01-15T00:00:00Z"));

    assertThat(result).containsExactly(recent);
  }

  @Test
  void CA_02_06_1_sin_updatedSince_devuelve_el_catalogo_completo_primera_sincronizacion() {
    Exercise a = anExercise("uno", Instant.parse("2026-01-01T00:00:00Z"));
    Exercise b = anExercise("dos", Instant.parse("2026-02-01T00:00:00Z"));
    var repository = new InMemoryExerciseRepository(List.of(a, b));
    var useCase = new ListExercisesUpdatedSince(repository);

    List<Exercise> result = useCase.execute(null);

    assertThat(result).containsExactlyInAnyOrder(a, b);
  }
}
