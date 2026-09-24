package com.fitapp.training.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A user's own custom exercise (RF-03.07, CA-03.08.3): deliberately not part of
 * `catalog.domain.Exercise` (which enforces curated-content invariants this entity doesn't need and
 * shouldn't be forced into — `specs/F03-editor-rutinas/plan.md` §1 "ejercicios personalizados").
 */
public record CustomExercise(
    UUID id,
    UUID userId,
    String name,
    String notes,
    String photoUri,
    List<String> muscleGroups,
    String mode,
    Instant updatedAt) {}
