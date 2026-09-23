package com.fitapp.sync.domain;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * A single change to push/pull (`06-contratos-api.md` §"sync", `SyncChange` in openapi.yaml). In H1
 * only `entity` ∈ {@code profile, bodyMetric} is supported (`specs/F01-perfil-onboarding/plan.md`
 * §3); {@code data} is present when {@code op = upsert}, absent when {@code op = delete}.
 */
public record SyncChange(
    String entity, String op, UUID id, Instant updatedAt, Map<String, Object> data) {

  public boolean isUpsert() {
    return "upsert".equals(op);
  }
}
