package com.fitapp.sync.adapters.in.web;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Mirrors `SyncPushResponse` in openapi.yaml. */
public record SyncPushResponseDto(
    List<UUID> accepted, List<SyncRejectionDto> rejected, Instant serverTime) {}
