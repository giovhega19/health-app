package com.fitapp.catalog.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Predefined routine (05-modelo-dominio-reglas.md §1, class {@code Routine}, {@code source:
 * PREDEFINED}, not editable by the user). Mirrors `RoutineDto` in
 * `packages/api-contract/openapi.yaml`.
 */
public record Routine(
    UUID id,
    String name,
    String goal,
    String level,
    TimerSettings timerDefaults,
    List<RoutineBlock> blocks,
    int version,
    Instant updatedAt) {}
