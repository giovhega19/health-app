package com.fitapp.training.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A user's own routine ({@code source: USER | IMPORTED}, editable — as opposed to
 * `catalog.domain.Routine`, {@code source: PREDEFINED}, read-only content). Server-side replica
 * synced through the generic `sync` pipeline (`entity: "routine"`,
 * `specs/F03-editor-rutinas/plan.md` §3); this module never exposes it through a REST endpoint of
 * its own.
 */
public record Routine(
    UUID id,
    UUID userId,
    String name,
    String description,
    String goal,
    String level,
    String source,
    TimerSettings timerDefaults,
    List<RoutineBlock> blocks,
    int version,
    Instant updatedAt) {}
