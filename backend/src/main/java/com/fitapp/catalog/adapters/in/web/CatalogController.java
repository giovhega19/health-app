package com.fitapp.catalog.adapters.in.web;

import com.fitapp.catalog.application.GetManifest;
import com.fitapp.catalog.application.ListExercisesUpdatedSince;
import com.fitapp.catalog.application.ListRoutinesUpdatedSince;
import com.fitapp.catalog.domain.CatalogManifest;
import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for {@code /catalog/*} (`packages/api-contract/openapi.yaml`: {@code
 * getCatalogManifest}, {@code listCatalogExercises}, {@code listCatalogRoutines}). Public: {@code
 * security: []} in the contract (RF-02.06), no auth required, matches `04-arquitectura.md` §4.1
 * "los controladores solo llaman casos de uso" — no business logic here, only HTTP routing/binding,
 * delegating to the three use cases.
 *
 * <p>Scaffold only (TDD red phase): the use cases it delegates to are stubs that throw {@link
 * UnsupportedOperationException} until `F02-T06` implements them for real.
 */
@RestController
public class CatalogController {
  private final GetManifest getManifest;
  private final ListExercisesUpdatedSince listExercisesUpdatedSince;
  private final ListRoutinesUpdatedSince listRoutinesUpdatedSince;

  public CatalogController(
      GetManifest getManifest,
      ListExercisesUpdatedSince listExercisesUpdatedSince,
      ListRoutinesUpdatedSince listRoutinesUpdatedSince) {
    this.getManifest = getManifest;
    this.listExercisesUpdatedSince = listExercisesUpdatedSince;
    this.listRoutinesUpdatedSince = listRoutinesUpdatedSince;
  }

  @GetMapping("/api/v1/catalog/manifest")
  public CatalogManifest manifest() {
    return getManifest.execute();
  }

  @GetMapping("/api/v1/catalog/exercises")
  public ExerciseListResponse exercises(@RequestParam(required = false) String updatedSince) {
    return new ExerciseListResponse(listExercisesUpdatedSince.execute(parseInstant(updatedSince)));
  }

  @GetMapping("/api/v1/catalog/routines")
  public RoutineListResponse routines(@RequestParam(required = false) String updatedSince) {
    return new RoutineListResponse(listRoutinesUpdatedSince.execute(parseInstant(updatedSince)));
  }

  private static Instant parseInstant(String value) {
    return value == null ? null : Instant.parse(value);
  }
}
