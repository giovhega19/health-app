package com.fitapp.profile.adapters.out.sync;

import java.time.LocalDate;

/**
 * Shape of `SyncChange.data` for `entity: bodyMetric` (mirrors `BodyMetricDto`'s writable fields).
 */
record BodyMetricSyncPayload(LocalDate date, double weightKg, Double waistCm) {}
