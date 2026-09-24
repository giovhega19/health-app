package com.fitapp.training.domain;

/**
 * `05-modelo-dominio-reglas.md` §1 (class TimerSettings, RN-05). Mirrors `TimerSettings` in
 * openapi.yaml. Own copy of this module's domain (Spring Modulith modules never share domain
 * classes, `specs/F03-editor-rutinas/plan.md` §2) — conceptually identical to
 * `catalog.domain.TimerSettings` (F02), which serves the read-only predefined-routine side of the
 * same shape.
 */
public record TimerSettings(
    Integer prepSeconds,
    Integer workSeconds,
    Integer restBetweenSetsSeconds,
    Integer restBetweenExercisesSeconds,
    Integer restBetweenRoundsSeconds,
    Boolean halfwayCue) {}
