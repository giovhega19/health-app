-- identity module (F01), specs/F01-perfil-onboarding/plan.md §4.
-- Logical schema via table prefix (identity_*), single physical `public` schema
-- shared with profile/catalog migrations (04-arquitectura.md §4.1).

CREATE TABLE identity_users (
    id                      UUID PRIMARY KEY,
    email                   VARCHAR(320) NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    accepted_terms_version  VARCHAR(32) NOT NULL,
    health_data_consent     BOOLEAN NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL,
    deleted_at              TIMESTAMPTZ
);

-- Case-insensitive uniqueness on the email of accounts that are not soft-deleted,
-- so a deleted account's email can be reused for a brand new registration
-- (Art. 5.4: deletion is definitive from the user's point of view).
CREATE UNIQUE INDEX identity_users_email_active_uk
    ON identity_users (LOWER(email))
    WHERE deleted_at IS NULL;

CREATE TABLE identity_refresh_tokens (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    family_id   UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ
);

CREATE INDEX identity_refresh_tokens_user_id_idx ON identity_refresh_tokens (user_id);
CREATE INDEX identity_refresh_tokens_family_id_idx ON identity_refresh_tokens (family_id);

CREATE TABLE identity_password_reset_tokens (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ
);

CREATE INDEX identity_password_reset_tokens_user_id_idx ON identity_password_reset_tokens (user_id);
