package com.fitapp.profile.adapters.out.sync;

import java.time.LocalDate;
import java.util.List;

/**
 * Shape of `SyncChange.data` for `entity: profile` (mirrors `UserProfileDto`'s writable fields).
 */
record ProfileSyncPayload(
    LocalDate birthDate,
    String gender,
    double heightCm,
    String goal,
    String level,
    int daysPerWeek,
    int minutesPerSession,
    List<String> equipment,
    String unitSystem,
    Double targetWeightKg,
    boolean parqFlagged) {}
