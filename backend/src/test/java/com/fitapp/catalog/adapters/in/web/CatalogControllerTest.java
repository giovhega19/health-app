package com.fitapp.catalog.adapters.in.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fitapp.catalog.application.GetManifest;
import com.fitapp.catalog.application.ListExercisesUpdatedSince;
import com.fitapp.catalog.application.ListRoutinesUpdatedSince;
import com.fitapp.catalog.domain.CatalogManifest;
import com.fitapp.catalog.domain.InMemoryCatalogManifestProvider;
import com.fitapp.catalog.domain.InMemoryExerciseRepository;
import com.fitapp.catalog.domain.InMemoryRoutineRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * RF-02.06 {@link CatalogController} — pruebas mínimas de wiring HTTP (`GET /catalog/manifest`,
 * `GET /catalog/exercises?updatedSince=`, `GET /catalog/routines?updatedSince=`,
 * `packages/api-contract/openapi.yaml`), sin base de datos real: `standaloneSetup` de MockMvc (sin
 * contexto Spring completo) porque este módulo todavía no tiene datasource/JPA/Testcontainers
 * configurados (`backend/build.gradle.kts`, nota H0) y el backend de catálogo es esencialmente CRUD
 * de solo lectura sin lógica de negocio significativa aparte del filtro `updatedSince` (cubierto
 * por {@code ListExercisesUpdatedSinceTest}) — ver `specs/F02-catalogo-propuesta/plan.md` §2 y §5.
 *
 * <p>Falla ahora mismo (tarea `F02-T06` no implementada): las tres pruebas invocan los casos de uso
 * reales (no mockeados) para que el fallo real quede al descubierto en vez de esconderse detrás de
 * un mock — {@link UnsupportedOperationException} en las tres surge como error 500, que MockMvc
 * reporta como fallo de la prueba (estado rojo esperado).
 */
class CatalogControllerTest {
  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    var manifestProvider =
        new InMemoryCatalogManifestProvider(
            new CatalogManifest(
                3,
                "etag-exercises-v3",
                "etag-routines-v3",
                "https://cdn.fitapp.test/",
                Instant.parse("2026-02-01T00:00:00Z")));
    var controller =
        new CatalogController(
            new GetManifest(manifestProvider),
            new ListExercisesUpdatedSince(new InMemoryExerciseRepository(List.of())),
            new ListRoutinesUpdatedSince(new InMemoryRoutineRepository(List.of())));
    mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
  }

  @Test
  void CA_02_06_1_GET_catalog_manifest_expone_version_y_etags() throws Exception {
    mockMvc
        .perform(get("/api/v1/catalog/manifest"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value(3))
        .andExpect(jsonPath("$.exercisesEtag").value("etag-exercises-v3"));
  }

  @Test
  void CA_02_06_1_GET_catalog_exercises_acepta_updatedSince_como_query_param() throws Exception {
    mockMvc
        .perform(get("/api/v1/catalog/exercises").param("updatedSince", "2026-01-15T00:00:00Z"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items").isArray());
  }

  @Test
  void CA_02_06_1_GET_catalog_routines_sin_updatedSince_devuelve_el_catalogo_completo()
      throws Exception {
    mockMvc
        .perform(get("/api/v1/catalog/routines"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items").isArray());
  }
}
