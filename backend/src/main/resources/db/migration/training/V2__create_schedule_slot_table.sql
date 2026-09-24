-- training module (F04, extends the F03 module), specs/F04-programacion-recordatorios/plan.md §4.
-- V2 (not V1) because F03-T14 already created training_user_routines /
-- training_custom_exercises in V1 of this same module (coordinated per plan §4/§6).
-- No physical FK to training_user_routines on purpose (same independent-logical-schema
-- reasoning as V1); planned_notifications/postpone_counters never sync (100% local, plan §4)
-- so there is no table for them here.

CREATE TABLE training_schedule_slots (
    id                      UUID PRIMARY KEY,
    user_id                 UUID NOT NULL,
    routine_id              UUID NOT NULL,
    days_of_week            VARCHAR(16) NOT NULL,
    start_time              VARCHAR(5) NOT NULL,
    reminder_offset_minutes INTEGER,
    active                  BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at              TIMESTAMPTZ NOT NULL
);

CREATE INDEX training_schedule_slots_user_updated_idx ON training_schedule_slots (user_id, updated_at);
