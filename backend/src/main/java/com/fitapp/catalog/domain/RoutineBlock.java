package com.fitapp.catalog.domain;

import java.util.List;
import java.util.UUID;

/**
 * `05-modelo-dominio-reglas.md` §1 (class RoutineBlock). Mirrors `RoutineBlockDto` in openapi.yaml.
 */
public record RoutineBlock(
    UUID id, String type, String grouping, int rounds, List<RoutineItem> items) {}
