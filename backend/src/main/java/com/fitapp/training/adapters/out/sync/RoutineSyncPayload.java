package com.fitapp.training.adapters.out.sync;

import com.fitapp.training.domain.RoutineBlock;
import com.fitapp.training.domain.TimerSettings;
import java.util.List;

/**
 * Shape of `SyncChange.data` for `entity: routine`: `RoutineDto` (openapi.yaml, from `catalog`,
 * F02) plus `description`/`source`, the two extra fields F03 adds for user routines
 * (`specs/F03-editor-rutinas/plan.md` §3 — "no se introduce un DTO estrictamente tipado para
 * `data`", same informal-payload precedent as `BodyMetricSyncPayload`/`ProfileSyncPayload`).
 */
record RoutineSyncPayload(
    String name,
    String description,
    String goal,
    String level,
    String source,
    TimerSettings timerDefaults,
    List<RoutineBlock> blocks,
    int version) {}
