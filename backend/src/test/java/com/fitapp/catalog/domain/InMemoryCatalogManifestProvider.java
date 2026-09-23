package com.fitapp.catalog.domain;

/** In-memory fake of {@link CatalogManifestProvider} for tests. */
public final class InMemoryCatalogManifestProvider implements CatalogManifestProvider {
  private final CatalogManifest manifest;

  public InMemoryCatalogManifestProvider(CatalogManifest manifest) {
    this.manifest = manifest;
  }

  @Override
  public CatalogManifest getManifest() {
    return manifest;
  }
}
