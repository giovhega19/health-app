-- profile module (F01), specs/F01-perfil-onboarding/plan.md §4.
-- No physical FK to identity_users on purpose: modules keep independent
-- logical schemas (04-arquitectura.md §4.1), only sharing the `user_id` UUID.

CREATE TABLE profile_profiles (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL UNIQUE,
    birth_date          DATE NOT NULL,
    gender              VARCHAR(32) NOT NULL,
    height_cm           DOUBLE PRECISION NOT NULL,
    goal                VARCHAR(32) NOT NULL,
    level               VARCHAR(32) NOT NULL,
    days_per_week       INTEGER NOT NULL,
    minutes_per_session INTEGER NOT NULL,
    equipment           TEXT NOT NULL DEFAULT '',
    unit_system         VARCHAR(16) NOT NULL,
    target_weight_kg    DOUBLE PRECISION,
    parq_flagged        BOOLEAN NOT NULL DEFAULT FALSE,
    health_consent_at   TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL
);

CREATE TABLE profile_body_metrics (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL,
    metric_date DATE NOT NULL,
    weight_kg   DOUBLE PRECISION NOT NULL,
    waist_cm    DOUBLE PRECISION,
    updated_at  TIMESTAMPTZ NOT NULL
);

-- CA-01.06.1: "si ya existía un registro de hoy, se reemplaza" -> upsert by (user_id, date).
CREATE UNIQUE INDEX profile_body_metrics_user_date_uk ON profile_body_metrics (user_id, metric_date);
CREATE INDEX profile_body_metrics_user_updated_idx ON profile_body_metrics (user_id, updated_at);
