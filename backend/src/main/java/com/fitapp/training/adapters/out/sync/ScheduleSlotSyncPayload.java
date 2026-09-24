package com.fitapp.training.adapters.out.sync;

import java.util.List;
import java.util.UUID;

/**
 * Shape of `SyncChange.data` for `entity: scheduleSlot`
 * (`specs/F04-programacion-recordatorios/plan.md` §4).
 */
record ScheduleSlotSyncPayload(
    UUID routineId,
    List<Integer> daysOfWeek,
    String startTime,
    Integer reminderOffsetMinutes,
    boolean active) {}
