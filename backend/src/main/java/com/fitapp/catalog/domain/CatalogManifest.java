package com.fitapp.catalog.domain;

import java.time.Instant;

/**
 * Catalog version manifest (`CatalogManifest` schema, `packages/api-contract/openapi.yaml`), lets
 * the client decide whether it needs to sync (RF-02.06, CA-02.06.1).
 */
public record CatalogManifest(
    int version,
    String exercisesEtag,
    String routinesEtag,
    String mediaBaseUrl,
    Instant updatedAt) {}
