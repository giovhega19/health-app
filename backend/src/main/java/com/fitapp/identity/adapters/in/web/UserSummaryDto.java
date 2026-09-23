package com.fitapp.identity.adapters.in.web;

import java.util.UUID;

/** Mirrors `UserSummary` in openapi.yaml. */
public record UserSummaryDto(UUID id, String email) {}
