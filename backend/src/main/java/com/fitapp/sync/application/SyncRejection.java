package com.fitapp.sync.application;

import java.util.UUID;

/** Mirrors `SyncRejection` in openapi.yaml. */
public record SyncRejection(UUID id, String code, String detail) {}
