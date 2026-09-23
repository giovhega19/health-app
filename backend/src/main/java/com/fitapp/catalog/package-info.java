/**
 * Catalog module (F02): read-only exercise/routine catalog served to the mobile client (`GET
 * /catalog/manifest`, `GET /catalog/exercises`, `GET /catalog/routines`, see
 * `packages/api-contract/openapi.yaml` and `specs/F02-catalogo-propuesta/plan.md`).
 *
 * <p>Scaffold only (TDD red phase, task {@code F02-T06} not implemented yet): {@code domain} holds
 * plain data carriers and out-ports, {@code application} holds the three read-only use cases
 * ({@link com.fitapp.catalog.application.GetManifest}, {@link
 * com.fitapp.catalog.application.ListExercisesUpdatedSince}, {@link
 * com.fitapp.catalog.application.ListRoutinesUpdatedSince}) as stubs that throw {@link
 * UnsupportedOperationException}, and {@code adapters.in.web} holds the controller that wires them
 * to HTTP. This module never writes to the catalog from the client (04-arquitectura.md §4.2:
 * catalog is MVP read-only) and never participates in {@code sync} (plan.md §1): it does not
 * implement any {@code SyncEntityHandler}.
 */
package com.fitapp.catalog;
