package com.fitapp.catalog.adapters.in.web;

import com.fitapp.catalog.domain.Routine;
import java.util.List;

/** Response body shape for {@code GET /catalog/routines} (`{ "items": [...] }`, openapi.yaml). */
public record RoutineListResponse(List<Routine> items) {}
