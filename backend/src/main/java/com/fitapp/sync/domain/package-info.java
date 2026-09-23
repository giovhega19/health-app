/**
 * Public SPI of the {@code sync} module ({@link com.fitapp.sync.domain.SyncEntityHandler}, {@link
 * com.fitapp.sync.domain.SyncChange}, {@link com.fitapp.sync.domain.SyncApplyResult}). Declared as
 * a Spring Modulith {@code @NamedInterface}: `profile`'s adapters ({@code
 * ProfileSyncEntityHandler}, {@code BodyMetricSyncEntityHandler}) implement it, which is the
 * intended integration point (Art. 9.2: modules communicate by API, not by importing internals).
 */
@org.springframework.modulith.NamedInterface
package com.fitapp.sync.domain;
