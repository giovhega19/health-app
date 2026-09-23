package com.fitapp.catalog.application;

import com.fitapp.catalog.domain.CatalogManifest;
import com.fitapp.catalog.domain.CatalogManifestProvider;
import org.springframework.stereotype.Component;

/**
 * In-port / use case for {@code GET /catalog/manifest} (RF-02.06, CA-02.06.1): lets the client
 * decide whether it needs to sync by exposing the current catalog version/etags.
 */
@Component
public final class GetManifest {
  private final CatalogManifestProvider manifestProvider;

  public GetManifest(CatalogManifestProvider manifestProvider) {
    this.manifestProvider = manifestProvider;
  }

  public CatalogManifest execute() {
    return manifestProvider.getManifest();
  }
}
