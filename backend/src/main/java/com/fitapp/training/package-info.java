/**
 * {@code training} module (F03/F04, H2): server-side replica of the user's own routines ({@link
 * com.fitapp.training.domain.Routine}, {@link com.fitapp.training.domain.CustomExercise},
 * `specs/F03-editor-rutinas/plan.md`) and schedule ({@link
 * com.fitapp.training.domain.ScheduleSlot}, `specs/F04-programacion-recordatorios/plan.md`).
 *
 * <p>Same shape as {@code profile} in H1: no REST endpoint of its own — every read/write happens
 * exclusively through the generic `sync` pipeline (`POST /sync/push`, `GET /sync/pull`), via three
 * {@link com.fitapp.sync.domain.SyncEntityHandler} implementations ({@code entity} ∈ {@code
 * routine, customExercise, scheduleSlot}). {@code userId} always comes from the JWT {@code sub}
 * claim already extracted by {@code sync.adapters.in.web.SyncController}, never from request data
 * (anti-IDOR, same pattern as {@code profile}/{@code catalog}).
 */
package com.fitapp.training;
