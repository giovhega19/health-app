package com.fitapp.sync.adapters.in.web;

import java.util.List;

/** Mirrors `SyncPullResponse` in openapi.yaml. */
public record SyncPullResponseDto(
    List<SyncChangeDto> changes, String nextCursor, boolean hasMore) {}
