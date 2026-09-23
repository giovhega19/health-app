/**
 * Shared Spring configuration ({@link com.fitapp.shared.config.JwtProperties}, security wiring, the
 * {@code Clock} bean). Declared as a Spring Modulith {@code @NamedInterface}: {@code JwtProperties}
 * is read by `identity`'s use-case wiring ({@code IdentityUseCaseConfig}), which is the intended
 * cross-module use, not an internals leak.
 */
@org.springframework.modulith.NamedInterface
package com.fitapp.shared.config;
