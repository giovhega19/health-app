package com.fitapp.training.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A user's schedule slot: recurring days + time at which a {@link Routine} is planned
 * (`specs/F04-programacion-recordatorios/plan.md` §2/§4). Local notification scheduling itself is
 * 100% client-side (`planned_notifications`/`postpone_counters` never sync, plan §4); only the slot
 * definition is server-side replicated (`entity: "scheduleSlot"`).
 */
public record ScheduleSlot(
    UUID id,
    UUID userId,
    UUID routineId,
    List<Integer> daysOfWeek,
    String startTime,
    Integer reminderOffsetMinutes,
    boolean active,
    Instant updatedAt) {}
