package com.fitapp.sync.adapters.in.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/** Mirrors `SyncPushRequest` in openapi.yaml. */
public record SyncPushRequestDto(
    @NotBlank String deviceId, @NotNull @Valid List<SyncChangeDto> changes) {}
