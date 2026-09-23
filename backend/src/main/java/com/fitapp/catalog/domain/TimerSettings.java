package com.fitapp.catalog.domain;

/**
 * `05-modelo-dominio-reglas.md` §1 (class TimerSettings, RN-05). Mirrors `TimerSettings` in
 * openapi.yaml.
 */
public record TimerSettings(
    Integer prepSeconds,
    Integer workSeconds,
    Integer restBetweenSetsSeconds,
    Integer restBetweenExercisesSeconds,
    Integer restBetweenRoundsSeconds,
    Boolean halfwayCue) {}
