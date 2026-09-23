package com.fitapp.catalog.domain;

/** Out-port that resolves the current {@link CatalogManifest} (RF-02.06, CA-02.06.1). */
public interface CatalogManifestProvider {
  CatalogManifest getManifest();
}
