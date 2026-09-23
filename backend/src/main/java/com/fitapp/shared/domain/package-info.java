/**
 * Framework-free shared kernel domain types ({@link com.fitapp.shared.domain.ApiException}) meant
 * to be used by every module's own {@code domain} package (Art. 2.2/2.3 of 00-constitucion.md).
 * Declared as a Spring Modulith {@code @NamedInterface} so other modules depending on it is not
 * flagged as reaching into `shared`'s internals — this package IS the intended public surface.
 */
@org.springframework.modulith.NamedInterface
package com.fitapp.shared.domain;
