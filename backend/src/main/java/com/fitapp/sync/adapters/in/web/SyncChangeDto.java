package com.fitapp.sync.adapters.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Mirrors `SyncChange` in openapi.yaml. */
public record SyncChangeDto(
    @NotBlank String entity,
    @NotBlank String op,
    @NotNull UUID id,
    @NotNull Instant updatedAt,
    Map<String, Object> data) {}
