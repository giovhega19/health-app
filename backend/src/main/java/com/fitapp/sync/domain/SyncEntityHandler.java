package com.fitapp.sync.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * SPI a module implements to participate in `POST /sync/push` / `GET /sync/pull` for one {@code
 * entity} value (`specs/F01-perfil-onboarding/plan.md` §3). `sync` never depends on `identity` or
 * `profile`: it only depends on implementations of this port being registered as Spring beans (Art.
 * 9.2 — communication by API/port, not by importing another module's internals). In H1 only
 * `profile` implements it, twice (`profile`, `bodyMetric`).
 */
public interface SyncEntityHandler {

  /** The single {@code entity} value this handler supports, e.g. {@code "profile"}. */
  String supportedEntity();

  /**
   * Applies one change with last-write-wins conflict resolution (RN-18, ADR-007): if a newer or
   * equally recent record already exists server-side, the change is treated as already applied
   * (accepted, no-op) rather than rejected — this also makes retries of the same push idempotent.
   */
  SyncApplyResult apply(UUID userId, SyncChange change);

  /**
   * Changes for this entity, strictly after {@code (since, sinceId)} in {@code (updatedAt, id)}
   * order, at most {@code limit} items.
   */
  List<SyncChange> pullSince(UUID userId, Instant since, UUID sinceId, int limit);
}
