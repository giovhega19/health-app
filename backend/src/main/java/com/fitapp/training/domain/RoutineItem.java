package com.fitapp.training.domain;

import java.util.UUID;

/**
 * `05-modelo-dominio-reglas.md` §1 (class RoutineItem), plus the F03-specific {@code
 * exerciseSource} field (`specs/F03-editor-rutinas/plan.md` §1 "ejercicios personalizados"): {@code
 * "CATALOG"} when {@code exerciseId} refers to `catalog.domain.Exercise`, {@code "CUSTOM"} when it
 * refers to this module's own {@link CustomExercise}. Mirrors `RoutineItemDto` in openapi.yaml plus
 * that one addition.
 */
public record RoutineItem(
    UUID id,
    UUID exerciseId,
    String exerciseSource,
    int sets,
    Integer targetReps,
    Integer targetSeconds,
    Double weightKg,
    TimerSettings timerOverrides) {}
