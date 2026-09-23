package com.fitapp.sync.domain;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

/**
 * Opaque cursor for `GET /sync/pull?cursor=` (06-contratos-api.md §1: "Paginación por cursor").
 * Encodes the {@code (updatedAt, id)} of the last item returned, base64'd so it stays an opaque
 * string from the client's point of view even though it is just `updatedAt|id` underneath.
 */
public record SyncCursor(Instant since, UUID sinceId) {

  private static final UUID NIL_UUID = new UUID(0L, 0L);
  public static final SyncCursor START = new SyncCursor(Instant.EPOCH, NIL_UUID);

  public static SyncCursor parse(String cursor) {
    if (cursor == null || cursor.isBlank()) {
      return START;
    }
    try {
      String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
      String[] parts = decoded.split("\\|", 2);
      return new SyncCursor(Instant.parse(parts[0]), UUID.fromString(parts[1]));
    } catch (RuntimeException e) {
      // A malformed/tampered cursor degrades to "from the beginning" rather than failing the
      // request: the client would simply re-receive some already-applied changes, which is safe
      // (LWW upserts are idempotent).
      return START;
    }
  }

  public String encode() {
    String raw = since.toString() + "|" + sinceId;
    return Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
  }
}
