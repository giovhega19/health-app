-- training module (F03), specs/F03-editor-rutinas/plan.md §4.
-- No physical FK to identity_users on purpose: modules keep independent
-- logical schemas (04-arquitectura.md §4.1), only sharing the `user_id` UUID.
-- No REST endpoint reads/writes these tables directly (plan.md §3): every row
-- is created/updated/deleted exclusively through the generic `sync` pipeline
-- (RoutineSyncEntityHandler / CustomExerciseSyncEntityHandler).

CREATE TABLE training_user_routines (
    id             UUID PRIMARY KEY,
    user_id        UUID NOT NULL,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    goal           VARCHAR(32) NOT NULL,
    level          VARCHAR(32) NOT NULL,
    source         VARCHAR(16) NOT NULL,
    timer_defaults TEXT NOT NULL,
    blocks         TEXT NOT NULL,
    version        INTEGER NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL
);

CREATE INDEX training_user_routines_user_updated_idx ON training_user_routines (user_id, updated_at);

CREATE TABLE training_custom_exercises (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL,
    name          VARCHAR(255) NOT NULL,
    notes         TEXT,
    photo_uri     VARCHAR(2048),
    muscle_groups TEXT NOT NULL DEFAULT '',
    mode          VARCHAR(16) NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX training_custom_exercises_user_updated_idx ON training_custom_exercises (user_id, updated_at);
