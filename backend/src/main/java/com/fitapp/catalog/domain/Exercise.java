package com.fitapp.catalog.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Catalog exercise (05-modelo-dominio-reglas.md §1, class {@code Exercise}). Plain immutable data
 * carrier: the content itself (~60 exercises, validated by a sports professional) is out of scope
 * for this technical implementation (spec.md "Contenido mínimo del MVP"); this record only models
 * the shape the API contract (`ExerciseDto`) requires.
 *
 * <p>Deliberately trimmed vs. the mobile domain entity (no invariant validation yet): F02-T06
 * (dev-backend-java) adds real validation/behavior when it implements the module for real. This is
 * scaffolding so {@code ListExercisesUpdatedSinceTest}/{@code CatalogControllerTest} compile, per
 * the red-phase exception in `specs/F02-catalogo-propuesta/spec.md` task brief ("si hace falta un
 * esqueleto mínimo de clases para que compile, créalo, pero sin lógica de negocio real").
 */
public record Exercise(
    UUID id,
    String slug,
    String name,
    List<String> muscleGroups,
    List<String> equipment,
    int difficulty,
    String mode,
    double met,
    List<String> instructions,
    List<String> commonMistakes,
    String imageUrl,
    String animationUrl,
    String videoUrl,
    Instant updatedAt) {}
