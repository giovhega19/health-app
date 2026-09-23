package com.fitapp.catalog.adapters.in.web;

import com.fitapp.catalog.domain.Exercise;
import java.util.List;

/** Response body shape for {@code GET /catalog/exercises} (`{ "items": [...] }`, openapi.yaml). */
public record ExerciseListResponse(List<Exercise> items) {}
