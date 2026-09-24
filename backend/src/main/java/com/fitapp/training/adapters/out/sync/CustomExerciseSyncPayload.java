package com.fitapp.training.adapters.out.sync;

import java.util.List;

/**
 * Shape of `SyncChange.data` for `entity: customExercise` (RF-03.07,
 * `specs/F03-editor-rutinas/plan.md` §1 "ejercicios personalizados"). Mirrors the fields the
 * `.fitroutine.json` example already anticipates: {@code {name, mode, muscleGroups}} plus optional
 * {@code notes}/{@code photoUri}.
 */
record CustomExerciseSyncPayload(
    String name, String notes, String photoUri, List<String> muscleGroups, String mode) {}
