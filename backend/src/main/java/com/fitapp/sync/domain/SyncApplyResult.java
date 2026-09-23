package com.fitapp.sync.domain;

/** Outcome of applying one {@link SyncChange} (maps to `SyncPushResponse.accepted`/`rejected`). */
public record SyncApplyResult(boolean accepted, String rejectionCode, String rejectionDetail) {

  public static SyncApplyResult ok() {
    return new SyncApplyResult(true, null, null);
  }

  public static SyncApplyResult rejected(String code, String detail) {
    return new SyncApplyResult(false, code, detail);
  }
}
