package com.fitapp.sync.adapters.in.web;

import java.util.UUID;

/** Mirrors `SyncRejection` in openapi.yaml. */
public record SyncRejectionDto(UUID id, String code, String detail) {}
