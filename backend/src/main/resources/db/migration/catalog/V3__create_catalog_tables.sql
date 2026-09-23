-- catalog module (F02), specs/F02-catalogo-propuesta/plan.md §4.
-- Read-only content served to the mobile client; the development seed itself
-- is NOT part of this migration (CatalogDevSeeder, gated by @Profile({"dev","test"})),
-- so this schema never risks seeding placeholder data in production.

CREATE TABLE catalog_exercises (
    id               UUID PRIMARY KEY,
    slug             VARCHAR(128) NOT NULL UNIQUE,
    name             VARCHAR(255) NOT NULL,
    muscle_groups    TEXT NOT NULL,
    equipment        TEXT NOT NULL,
    difficulty       INTEGER NOT NULL,
    mode             VARCHAR(16) NOT NULL,
    met              DOUBLE PRECISION NOT NULL,
    instructions     TEXT NOT NULL,
    common_mistakes  TEXT NOT NULL,
    image_url        VARCHAR(2048) NOT NULL,
    animation_url    VARCHAR(2048),
    video_url        VARCHAR(2048),
    updated_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX catalog_exercises_updated_at_idx ON catalog_exercises (updated_at);

CREATE TABLE catalog_routines (
    id             UUID PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    goal           VARCHAR(32) NOT NULL,
    level          VARCHAR(32) NOT NULL,
    timer_defaults TEXT NOT NULL,
    blocks         TEXT NOT NULL,
    version        INTEGER NOT NULL,
    updated_at     TIMESTAMPTZ NOT NULL
);

CREATE INDEX catalog_routines_updated_at_idx ON catalog_routines (updated_at);
