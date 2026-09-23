/**
 * {@code sync} module (F01, minimal): `POST /sync/push` / `GET /sync/pull`
 * (`specs/F01-perfil-onboarding/plan.md` §2/§3). Generic over the {@link
 * com.fitapp.sync.domain.SyncEntityHandler} SPI; in H1 only `profile` registers handlers for
 * `entity ∈ {profile, bodyMetric}`. Adding a new synced entity in a future feature means
 * registering a new handler bean, never modifying this module (Art. 9.1).
 */
package com.fitapp.sync;
