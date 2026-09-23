/**
 * Domain events published by the {@code identity} module ({@link
 * com.fitapp.identity.domain.events.AccountDeleted}). Declared as a Spring Modulith
 * {@code @NamedInterface} — same pattern as {@code com.fitapp.sync.domain}/{@code
 * com.fitapp.shared.domain} — so other modules reacting to these events (e.g. {@code profile}
 * deleting its own rows for the user, Art. 5.4/9.2 of 00-constitucion.md) do not need to reach into
 * `identity`'s internals: this package IS the intended public surface for cross-module
 * notifications. `identity` never depends on the listeners; it only publishes.
 */
@org.springframework.modulith.NamedInterface
package com.fitapp.identity.domain.events;
