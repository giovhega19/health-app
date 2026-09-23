package com.fitapp.sync.application;

import com.fitapp.sync.domain.SyncChange;
import com.fitapp.sync.domain.SyncCursor;
import com.fitapp.sync.domain.SyncEntityHandler;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * `GET /sync/pull?cursor=&limit=` use case (CA-01.01.1). Merges the per-entity pages every
 * registered {@link SyncEntityHandler} returns into one globally `(updatedAt, id)`-ordered page,
 * small-scale k-way merge (only 2 handlers in H1, `profile`/`bodyMetric` — see plan.md, no need for
 * a heap-based merge at this volume).
 */
@Component
public class PullSyncChanges {

  private static final Comparator<SyncChange> BY_UPDATED_AT_THEN_ID =
      Comparator.comparing(SyncChange::updatedAt).thenComparing(SyncChange::id);

  private final List<SyncEntityHandler> handlers;

  public PullSyncChanges(List<SyncEntityHandler> handlers) {
    this.handlers = handlers;
  }

  public PullResult execute(UUID userId, String cursor, int limit) {
    SyncCursor parsedCursor = SyncCursor.parse(cursor);
    // Ask each handler for one extra item beyond `limit`: with a single handler, fetching exactly
    // `limit` items would always come back with a full page, making it impossible to tell whether
    // there is a next page (hasMore) from the size alone.
    int perHandlerLimit = limit + 1;
    List<SyncChange> merged =
        handlers.stream()
            .flatMap(
                handler ->
                    handler
                        .pullSince(
                            userId, parsedCursor.since(), parsedCursor.sinceId(), perHandlerLimit)
                        .stream())
            .sorted(BY_UPDATED_AT_THEN_ID)
            .toList();

    boolean hasMore = merged.size() > limit;
    List<SyncChange> page = merged.stream().limit(limit).toList();
    String nextCursor =
        page.isEmpty()
            ? cursor
            : new SyncCursor(page.get(page.size() - 1).updatedAt(), page.get(page.size() - 1).id())
                .encode();
    return new PullResult(page, nextCursor, hasMore);
  }
}
