package com.fitapp.catalog.domain;

import java.util.UUID;

/**
 * `05-modelo-dominio-reglas.md` §1 (class RoutineItem). Mirrors `RoutineItemDto` in openapi.yaml.
 */
public record RoutineItem(
    UUID id,
    UUID exerciseId,
    int sets,
    Integer targetReps,
    Integer targetSeconds,
    Double weightKg,
    TimerSettings timerOverrides) {}
