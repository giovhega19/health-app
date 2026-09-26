# Plan técnico · F03 Creación, edición e importación de rutinas

> Generado por `arquitecto` a partir de `spec.md` (MVP 1.0, aprobado). Cubre el hito **H2** junto con `specs/F04-programacion-recordatorios/plan.md`. No se inicia la implementación sin aprobación del usuario de este `plan.md` y de `tasks.md` (regla de `CLAUDE.md`). H1 (F01/F02) está cerrado y mergeado a `main`; este plan reutiliza sin romper nada de lo ya construido (Art. 9.1).
>
> **Estado: ejecutado y cerrado el 2026-09-24** (ver `tasks.md`, CHANGELOG.md §H2, PR #4).

## 1. Resumen de la solución

F03 añade el módulo `features/routines` (rutinas del usuario: crear desde cero, duplicar una predefinida, reordenar, importar/exportar en `.fitroutine.json`) y completa `packages/routine-schema` con el JSON Schema real v1. Reutiliza sin duplicar lo que F02 ya dejó preparado explícitamente para este momento: `shared/domain/{RoutineBlock,RoutineItem,TimerSettings}.ts`, `shared/domain/routineDuration.ts` (RN-07) y las tablas `routine_blocks`/`routine_items` de Drizzle, que F02 normalizó **a propósito** para que F03 las reutilizara "sin cambios" (`specs/F02-catalogo-propuesta/plan.md` §4). También cierra dos brechas que F02 dejó documentadas explícitamente como pendientes para H2:

1. **CA-02.04.3 completa:** F02 emite `ProposalAccepted` pero no persiste nada (H1). F03 añade el primer suscriptor real: al aceptar una propuesta, crea las `Routine` correspondientes y emite `RoutinesCreatedFromProposal`, que F04 (ver su plan §1) consume para crear los `ScheduleSlot`. Ninguna línea de `features/catalog` se modifica (Art. 9.1/9.2, patrón ya usado por `sync` en F01 con `BodyWeightLogged`/`ProfileUpdated`).
2. **CA-02.06.1, regresión pendiente:** F02 documentó que "la prueba de regresión de extremo a extremo con rutinas de usuario reales se añade en el plan técnico de F03" (`specs/F02-catalogo-propuesta/plan.md` §5). Se añade en §5 de este plan.

### Secuencia de implementación H2 (dependencia F03 → F04)

F04 necesita que exista una `Routine` (con su `id`) antes de poder crear un `ScheduleSlot` que la referencie. Por eso, dentro de H2:

1. **En paralelo:** dominio/aplicación de `routines` (agregado `Routine`, `CustomExercise`, `RoutineLimits`, importador/exportador) y el JSON Schema real de `packages/routine-schema`, sin ninguna dependencia de `scheduling`.
2. **Punto de integración único:** `RoutinesCreatedFromProposal` (evento emitido por `routines`, tarea `F03-T13`) es un prerrequisito bloqueante de `F04-T09` (suscriptor que crea los `ScheduleSlot`). Ninguna otra tarea de F04 depende de F03 salvo esa; el resto de F04 (calendario manual, `NotificationPlanner`, recordatorios) es autónomo y puede avanzar en paralelo usando una `Routine` de prueba (fake/builder), sin esperar a que F03 esté terminado.
3. El acoplamiento se hace **por evento + composition root**, nunca importando internos: `scheduling` no importa nada de `features/routines/**`; el `container.ts` los conecta.

### Decisión de diseño: `RoutineItem`/tablas de F02 se reutilizan literalmente, no se duplican

`shared/domain/RoutineItem.ts` y las tablas Drizzle `routine_blocks`/`routine_items` (F02) son genéricas y **sin `FOREIGN KEY` declarado** hacia `predefined_routines` (columna `routine_id` es `text` simple, indexada, sin `.references(...)`; verificado en `shared/infrastructure/db/schema.ts`). Esto es exactamente lo que F02 dejó preparado ("estas tablas serán reutilizadas sin cambios por F03 cuando `UserRoutine` las necesite también, mismo esquema, distinta tabla padre"). F03 **no crea** `user_routine_blocks`/`user_routine_items` nuevas: crea solo `user_routines` (tabla padre nueva, con columnas propias de F03 como `description`/`source`) y reutiliza `routine_blocks`/`routine_items` apuntando su `routine_id` a `user_routines.id` en vez de `predefined_routines.id`. Es seguro porque los IDs (UUID) de rutinas predefinidas y de usuario nunca colisionan, y `SqlitePredefinedRoutineRepository.upsertMany` (F02) ya borra/reinserta hijos **solo** para los `routine_id` de las rutinas que recibe (nunca un `DELETE` global) — confirmado leyendo el archivo; por eso `DownloadCatalogUpdate` (F02) nunca puede tocar los hijos de una rutina de usuario. La única extensión necesaria a esas tablas compartidas es **una columna nueva, aditiva y con valor por defecto** en `routine_items`: `exercise_source TEXT DEFAULT 'CATALOG'` (ver decisión de ejercicios personalizados, abajo). No se toca ninguna otra columna ni el código ya cerrado de `SqlitePredefinedRoutineRepository`.

### Decisión de diseño: ejercicios personalizados (RF-03.07, CA-03.08.3) como entidad propia de `routines`, no reutilizando `catalog.Exercise`

`catalog/domain/Exercise.create` (F02, ya cerrado) exige **mínimo 3 instrucciones y 2 errores comunes** (contenido mínimo del MVP de catálogo, `specs/F02-catalogo-propuesta/spec.md`). Un ejercicio personalizado de usuario (RF-03.07: "nombre, notas y foto propia"; import de `.fitroutine.json`: `{ref: "custom", name, mode, muscleGroups}`, `06-contratos-api.md` §4) no tiene ni necesita ese contenido. Forzarlo violaría el propósito de esa invariante (calidad de contenido curado) y obligaría a F03 a escribir en la tabla `exercises` de `catalog` — que otro módulo no debe tocar por su cuenta (Art. 2.5). Por eso F03 introduce su **propia** entidad `CustomExercise` (`id, name, notes?, photoUri?, muscleGroups: MuscleGroup[], mode: ExerciseMode`, exactamente los campos que ya anticipa el ejemplo de `.fitroutine.json`), persistida en una tabla nueva `custom_exercises` (propiedad de `routines`, no de `catalog`).

Para que un `RoutineItem` pueda referenciar indistintamente un ejercicio de catálogo o uno personalizado sin romper el tipo ya compartido (`shared/domain/RoutineItem.exerciseId: Id`, usado tal cual por F02), se añade un campo **opcional** y aditivo: `RoutineItem.exerciseSource?: "CATALOG" | "CUSTOM"` (ausente ⇒ `"CATALOG"`, compatible con todo lo que F02 ya construyó, que nunca lo setea ni lo lee). `routines/application` resuelve los detalles a mostrar (nombre, grupo muscular) con un puerto propio `ExerciseDisplayLookupPort`, cuya implementación real (en `composition/container.ts`) delega en `catalog.getExerciseDetail` (ya expuesto en `features/catalog/index.ts` desde H1) cuando `exerciseSource === "CATALOG"`, o en `CustomExerciseRepository` cuando es `"CUSTOM"` — mismo patrón exacto que `RoutineProposalPort` (F01↔F02). **No se modifica ninguna línea de `features/catalog`.**

## 2. Impacto por capa

| Capa | Móvil (`apps/mobile/src/features/routines/`) | Backend (`backend/src/main/java/com/fitapp/training/`) |
|---|---|---|
| Domain | `domain/Routine.ts` (agregado, extiende `Entity`; invariantes RN-06 en `create`/`addItem`/`setOverrides`/`reorderItems`, todo inmutable: cada mutación devuelve `Result<Routine, RoutineValidationError>` con una **nueva** instancia), `domain/RoutineLimits.ts` (constantes RN-06 + `validateAgainstLimits`/`clampToLimits`, puro), `domain/CustomExercise.ts`, `domain/errors.ts`, `domain/events.ts` (`RoutineCreated`, `RoutineUpdated`, `RoutineImported`, `RoutinesCreatedFromProposal`) | `domain/Routine.java` (+ `RoutineBlock`/`RoutineItem`/`TimerSettings`, reutilizados conceptualmente de `catalog` pero como clases propias del módulo — Spring Modulith no comparte clases de dominio entre módulos), `domain/ScheduleSlot.java` (ver plan de F04, mismo módulo backend), puertos out `RoutineRepository`, `CustomExerciseRepository` |
| Application | `application/CreateRoutine.ts`, `UpdateRoutine.ts`, `DeleteRoutine.ts` (soft delete), `DuplicateRoutine.ts` (desde un `PredefinedRoutineSnapshot` DTO, CA-03.05.1), `ReorderRoutineItems.ts`, `RemoveRoutineItem.ts` (CA-03.06.1), `PreviewImportRoutine.ts` / `ConfirmImportRoutine.ts` (CA-03.08.2/.3/.4, dos fases: previsualizar sin persistir, confirmar y persistir), `ExportRoutine.ts` (CA-03.08.1), `CreateCustomExercise.ts` (RF-03.07), `CreateRoutinesFromProposal.ts` (suscriptor de `ProposalAccepted`, ver §1 y §3), `ListMyRoutines.ts`, `GetRoutineDetail.ts`; `application/import/fitRoutineFileSchema.ts` (zod, validación del esquema — vive en `application` como indica `spec.md` §"Diseño técnico relevante", no en `domain`); puertos en `application/ports.ts` (`RoutineRepository`, `CustomExerciseRepository`, `FileGateway`, `ExerciseDisplayLookupPort`) | `application/` — en H2 **no hay casos de uso propios expuestos por REST**: `routine`/`customExercise` solo entran/salen por el pipeline genérico de `sync` (ver §3). Se añaden `RoutineSyncEntityHandler`, `CustomExerciseSyncEntityHandler` (implementan el SPI `SyncEntityHandler` ya existente de `sync`, mismo patrón que `profile` en F01) |
| Infrastructure | `infrastructure/db/schema.ts` — **ampliación** de `shared/infrastructure/db/schema.ts` (no un archivo nuevo, mismo archivo compartido que ya usan `profile`/`catalog`/`sync`): tabla nueva `user_routines`, tabla nueva `custom_exercises`, columna nueva aditiva `routine_items.exercise_source`; `infrastructure/SqliteUserRoutineRepository.ts` (reutiliza `routine_blocks`/`routine_items` como se explica en §1), `infrastructure/SqliteCustomExerciseRepository.ts`, `infrastructure/ExpoFileGateway.ts` (sobre `expo-document-picker` + `expo-file-system` + `expo-sharing`, ninguno instalado todavía), `infrastructure/RoutineSyncEntityApplier.ts` / `CustomExerciseSyncEntityApplier.ts` (implementan `SyncEntityApplier` de `features/sync`, lado *pull*) | `adapters/out/persistence/` (JPA: `training_user_routines`, `training_routine_blocks`, `training_routine_items`, `training_custom_exercises`), `adapters/in/sync/RoutineSyncEntityHandler.java`, `CustomExerciseSyncEntityHandler.java`. **Sin `adapters/in/web`** (no hay endpoint REST dedicado en H2, ver §3) |
| Presentation | `presentation/screens/{MyRoutines,RoutineEditor,ImportPreview,CustomExerciseForm}.tsx`, componentes `BlockEditor.tsx`/`ItemEditor.tsx` (drag-and-drop con `react-native-reanimated`, ya en el stack), `presentation/stores/useRoutineEditorStore.ts` (Zustand: borrador de edición + estado "pendiente de eliminar" con temporizador de 5 s para el deshacer de CA-03.06.1 — temporizador de UI, no del dominio, probado con fake timers de Jest); rutas en `apps/mobile/app/routines/*` que solo delegan (Art. 3.1) | — |

## 3. Contratos

### Backend: sin endpoint REST nuevo, extensión del pipeline `sync` existente

`06-contratos-api.md` §"sync" ya anticipa `routine`, `customExercise` (implícito, ver `.fitroutine.json`) y `scheduleSlot` como entidades sincronizables — no se inventa nada nuevo, se completa lo ya contratado. **Cambio en `openapi.yaml` (contract-first, tarea `F03-T03`):**

```yaml
SyncEntity:
  enum: [profile, bodyMetric, routine, customExercise]   # F03 añade routine, customExercise
                                                            # (scheduleSlot lo añade F04, mismo enum)
```

No se añade ningún `path` nuevo: `routine`/`customExercise` viajan como `SyncChange.data` (ya `additionalProperties: true`, mismo patrón laxo que `profile`/`bodyMetric` en H1 — no se introduce un DTO estrictamente tipado para `data`, siguiendo el precedente ya establecido, Art. 9 simplicidad). La forma informal de `data` para `entity: "routine"` es la misma que `RoutineDto`/`RoutineBlockDto`/`RoutineItemDto` ya definidos en `openapi.yaml` (de `catalog`, F02) más `description`/`source`, documentada aquí en vez de duplicada como schema OpenAPI nuevo.

**Decisión: sí se sincroniza (ver "Preguntas abiertas" en `spec.md`, registrada para confirmación del dueño de producto).** Justificación resumida (ver también la de F04 §3, misma decisión): el costo marginal es bajo porque el pipeline `POST /sync/push`/`GET /sync/pull`, el `outbox`, el SPI `SyncEntityApplier`/`SyncEntityHandler` y la resolución LWW (RN-18, ADR-007) **ya existen y son genéricos** desde F01 — añadir dos valores de enum y dos implementaciones del SPI no reabre ni modifica `identity`/`profile`/`sync`/`catalog`. La alternativa (routines 100 % locales en H2) dejaría rutinas de usuario huérfanas ante una reinstalación o cambio de dispositivo, lo cual contradice Art. 4.2 ("el servidor respalda y sincroniza") para el dato más valioso que crea el usuario en H2.

**Puertos nuevos (TypeScript, `routines/application/ports.ts`):**
```ts
interface RoutineRepository {
  save(routine: Routine): Promise<Result<void, RepositoryError>>;
  findById(id: Id): Promise<Result<Routine | null, RepositoryError>>;
  listActive(): Promise<Result<Routine[], RepositoryError>>;
  softDelete(id: Id): Promise<Result<void, RepositoryError>>;
}
interface CustomExerciseRepository {
  save(exercise: CustomExercise): Promise<Result<void, RepositoryError>>;
  findById(id: Id): Promise<Result<CustomExercise | null, RepositoryError>>;
}
interface FileGateway {
  pickFile(): Promise<Result<{ content: string; sizeBytes: number } | null, FileError>>; // null = cancelado por el usuario
  shareFile(filename: string, content: string): Promise<Result<void, FileError>>;
}
interface ExerciseDisplayLookupPort {
  resolve(ref: { source: "CATALOG" | "CUSTOM"; id: Id }): Promise<Result<ExerciseDisplaySummary, LookupError>>;
}
```

**API pública (`features/routines/index.ts`):** `createRoutinesContainer(deps)` expone `createRoutine`, `duplicateRoutine`, `reorderItems`, `removeItem`, `previewImportRoutine`, `confirmImportRoutine`, `exportRoutine`, `createCustomExercise`, `listMyRoutines`, `getRoutineDetail`, y `createRoutinesFromProposal` (usada solo por `composition/container.ts` al suscribirse a `ProposalAccepted`) — mismo patrón que `createCatalogContainer`/`createSyncContainer`.

**Eventos de dominio:**
| Evento | Payload | Emisor | Consumidores previstos |
|---|---|---|---|
| `RoutineCreated` / `RoutineUpdated` | `{routineId, updatedAt}` | `CreateRoutine`, `UpdateRoutine`, `DuplicateRoutine` | `sync` (encola outbox, `entity: "routine"`) |
| `RoutineImported` | `{routineId, warnings: ImportWarning[]}` | `ConfirmImportRoutine` | `sync`; analítica futura |
| `RoutinesCreatedFromProposal` | `{routines: {routineId, dayNumber, preferredTime}[]}` | `CreateRoutinesFromProposal` (suscriptor de `ProposalAccepted` de `catalog`) | `scheduling` (F04, crea `ScheduleSlot`, ver `specs/F04-programacion-recordatorios/plan.md` §3) |

**Requisito de fontanería previo (no rompe nada, solo añade una exportación):** `features/catalog/index.ts` debe re-exportar el tipo `ProposalAcceptedEvent` (y `PreferredScheduleEntry`) desde `catalog/domain/events.ts`, hoy no exportado en `index.ts`. Es una adición de un `export type`, cero cambios de comportamiento; sin ella, `routines` no podría tipar el evento al que se suscribe sin importar internos de `catalog` (Art. 2.5). Tarea `F03-T02`.

## 4. Datos

**Móvil (Drizzle, ampliación de `shared/infrastructure/db/schema.ts`):**
- `user_routines`: `id` (uuid pk), `name`, `description` (nullable), `goal`, `level`, `source` (`USER`|`IMPORTED`), `timer_defaults` (json), `version`, `updated_at`, `deleted_at` (nullable).
- `custom_exercises`: `id` (uuid pk), `name`, `notes` (nullable), `photo_uri` (nullable), `muscle_groups` (json), `mode`, `updated_at`, `deleted_at` (nullable).
- `routine_items`: **ALTER TABLE aditivo** — nueva columna `exercise_source TEXT NOT NULL DEFAULT 'CATALOG'` (compatible con las filas ya existentes de rutinas predefinidas).
- `routine_blocks`/`routine_items` (ya existentes, F02): reutilizadas sin cambio de esquema salvo la columna anterior; `routine_id` ahora puede apuntar a `predefined_routines.id` o a `user_routines.id` (sin `FOREIGN KEY` — ya era así).
- Todas las tablas nuevas llevan `updated_at`/`deleted_at` para LWW (RN-18, ADR-007) y quedan encoladas en `outbox` (`entity: "routine"` / `"customExercise"`).

**Backend (Flyway, módulo nuevo `training`):**
- `db/migration/training/V1__create_training_tables.sql` → `training_user_routines`, `training_routine_blocks`, `training_routine_items`, `training_custom_exercises` (mismas columnas que el lado móvil + `user_id` fk). Sin datos semilla (a diferencia de `catalog`, esto es 100 % contenido de usuario).
- Sin controlador REST (§3): estas tablas solo se escriben/leen desde `RoutineSyncEntityHandler`/`CustomExerciseSyncEntityHandler`.

**`packages/routine-schema` (JSON Schema real v1):**
- `fitroutine.schema.v1.json` (JSON Schema draft 2020-12): valida `schema`, `schemaVersion` (`const: 1` en v1), `exportedAt`, `routine.{name,goal,level,timerDefaults,blocks[].{type,grouping,rounds,items[].{exercise,sets,targetReps?,targetSeconds?,weightKg?,timerOverrides?}}}`, límites numéricos de RN-06, tamaño máx. 256 KB (verificado antes de parsear, no por el propio JSON Schema).
- **Decisión: no se añade `@fitapp/routine-schema` como dependencia de workspace en tiempo de ejecución de `apps/mobile`.** El validador que usa la app en producción es **zod, escrito a mano** en `routines/application/import/fitRoutineFileSchema.ts` (dominio/aplicación TypeScript puro, sin nueva dependencia: zod ya está en el stack). El JSON Schema de `packages/routine-schema` es la fuente normativa exigida por `06-contratos-api.md`/`04-arquitectura.md`, pero se consume **solo en tiempo de prueba** (Jest corre en Node, no en Metro, así que no tiene la restricción de resolución de monorepo de React Native/Expo): una prueba de paridad (`packages/routine-schema/__tests__/parity.test.ts`, con `ajv` como *devDependency* de ese paquete, nunca empaquetada en la app) valida una batería de fixtures contra ambos validadores y falla si difieren. Esto evita añadir `ajv` como dependencia de producción del móvil y evita el riesgo de que Metro no resuelva un paquete del workspace (riesgo real documentado en §6). Esta decisión se registra en **ADR-009** (§7).

## 5. Estrategia de pruebas

| CA | Nivel | Archivo de prueba previsto |
|---|---|---|
| CA-03.01.1 (crear rutina mínima + duración estimada) | Dominio + Aplicación | `features/routines/domain/__tests__/Routine.create.test.ts`, `application/__tests__/CreateRoutine.test.ts` (verifica que reutiliza `estimateRoutineDurationSeconds` de `shared/domain`, no una copia) |
| CA-03.01.2 (validación, botón deshabilitado) | Dominio + Componente | `domain/__tests__/RoutineLimits.test.ts` (tabla de casos RN-06, todos los campos), `presentation/screens/__tests__/RoutineEditor.validation.test.tsx` |
| CA-03.02.1 (reps vs. tiempo) | Componente | `presentation/screens/__tests__/ItemEditor.test.tsx` |
| CA-03.03.1 (overrides, precedencia RN-05) | Dominio | `domain/__tests__/Routine.overrides.test.ts` (reutiliza el mismo caso de precedencia que `07-estrategia-pruebas.md` §4 ejemplifica para F05, pero aplicado a la construcción del agregado) |
| CA-03.04.1 (circuito, sin descanso entre ejercicios del grupo) | Dominio | Caso adicional en `shared/domain/__tests__/routineDuration.table.test.ts` (F02) — **se añade aquí, no se reescribe el archivo de F02 desde cero** — más `domain/__tests__/Routine.circuit.test.ts` propio de F03 para la construcción del bloque |
| CA-03.05.1 (duplicar predefinida protegida) | Aplicación | `application/__tests__/DuplicateRoutine.test.ts` (con un `PredefinedRoutineSnapshot` fake, sin importar `catalog`) |
| CA-03.06.1 (reordenar + deshacer 5 s) | Dominio + Componente | `domain/__tests__/Routine.reorder.test.ts`, `presentation/stores/__tests__/useRoutineEditorStore.undo.test.ts` (Jest fake timers) |
| CA-03.08.1 (exportar) | Aplicación + Integración | `application/__tests__/ExportRoutine.test.ts` (con `FakeFileGateway`), valida contra el zod schema el propio archivo generado (nunca debería fallar su propia validación) |
| CA-03.08.2 (importar válido, previsualizar) | Aplicación | `application/__tests__/PreviewImportRoutine.test.ts`, `ConfirmImportRoutine.test.ts` |
| CA-03.08.3 (referencia inexistente → personalizado; reps fuera de rango → clamp + advertencia) | Aplicación (tabla de casos) | `application/__tests__/PreviewImportRoutine.warnings.test.ts` |
| CA-03.08.4 (versión no soportada) | Aplicación | `application/__tests__/PreviewImportRoutine.version.test.ts` |
| — (paridad JSON Schema ↔ zod, RF-03.08, ADR-009) | Contrato | `packages/routine-schema/__tests__/parity.test.ts` (ajv vs. zod, misma batería de fixtures que las pruebas anteriores) |
| — (regresión pendiente de F02, `specs/F02-catalogo-propuesta/plan.md` §5, CA-02.06.1) | Integración (SQLite real) | `features/catalog/application/__tests__/DownloadCatalogUpdate.userRoutineRegression.test.ts` (nuevo, en `catalog` pero escrito/ejecutado como parte de esta ronda F03: siembra una `user_routines` con bloques/ítems reales, corre `DownloadCatalogUpdate`, verifica que ni una fila de esa rutina de usuario cambió) |
| Backend | Integración | `training/adapters/in/sync/RoutineSyncEntityHandlerTest.java`, `CustomExerciseSyncEntityHandlerTest.java` (`@WebMvcTest` sobre `/sync/push`/`/sync/pull` ya existentes, Testcontainers PostgreSQL) |
| Arquitectura | — | `dependency-cruiser` (ya lista `routines` en `FEATURES`, sin cambios de configuración necesarios — verificado en `.dependency-cruiser.js`); ArchUnit/Modulith backend (genéricos, ya cubren cualquier módulo nuevo automáticamente, verificado en `ArchitectureTest.java`/`ApplicationModulesTest.java`) |

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Reabrir/romper código cerrado de F02 (`routine_blocks`/`routine_items`, `SqlitePredefinedRoutineRepository`) | Solo se añade una columna aditiva con `DEFAULT`; la prueba de regresión de §5 verifica explícitamente que `DownloadCatalogUpdate` no toca filas de `user_routines`. Ningún archivo de `features/catalog` se edita en H2 |
| Metro (bundler RN) podría no resolver `@fitapp/routine-schema` como dependencia de workspace si se hubiera consumido en runtime | Evitado por diseño (§4): el paquete solo se consume en Jest (Node), nunca en el bundle de la app. Si en el futuro se necesitara en runtime, se resuelve como spike aparte, no bloqueante de H2 |
| `RoutineItem.exerciseSource` opcional podría no propagarse correctamente en algún punto de la cadena import → editor → export, mostrando el ejercicio equivocado | Prueba de integración de extremo a extremo (`ImportRoutine → RoutineEditor → ExportRoutine` con un ejercicio de catálogo y uno personalizado en la misma rutina) en la tarea de verificación final |
| `CustomExercise` sin las validaciones de contenido de `catalog.Exercise` podría filtrarse a un contexto donde se espera contenido curado (p. ej. mostrarse en el catálogo general) | `CustomExercise` vive en una tabla y repositorio propios de `routines`, nunca se mezcla con `ExerciseRepository.filter()` de `catalog`; `ExerciseDisplayLookupPort` es la única vía de lectura cruzada y es de solo lectura para mostrar nombre/grupo muscular, no para listar en catálogo |
| Sincronizar `routine`/`customExercise` en H2 añade alcance de backend (módulo `training`) no mencionado originalmente en el roadmap para H2 | Documentado como decisión explícita en §3 y registrado en `spec.md` §"Preguntas abiertas" para confirmación del dueño de producto antes de iniciar `F03-T14`/`F03-T15` (tareas de backend) |
| `RoutineLimits` (RN-06) duplicaría lógica si `Routine.create` (estricto, rechaza) y `PreviewImportRoutine` (laxo, recorta con advertencia) no comparten la misma tabla de límites | Ambos consumen las mismas constantes de `domain/RoutineLimits.ts`; solo difiere la función que las aplica (`validateAgainstLimits` vs. `clampToLimits`), cubierto por la misma tabla de casos de prueba (§5) |

## 7. ADR requeridos

**Sí: ADR-009 (número tentativo) — "Validación dual de `.fitroutine.json`: JSON Schema como fuente normativa + zod escrito a mano, sin generador de código ni dependencia de `ajv` en producción, verificados por una prueba de paridad."** Justificación: introduce una decisión de arquitectura no trivial (dos representaciones del mismo contrato que deben mantenerse sincronizadas manualmente, con una prueba automatizada como red de seguridad en vez de generación de código) que no está cubierta por ningún ADR existente ni por la tabla de stack de `04-arquitectura.md`. **No se redacta en esta ronda** (limitada a `plan.md`/`tasks.md`); queda como tarea `F03-T01` en `tasks.md`, a cargo de `arquitecto`, bloqueante de `F03-T08` (implementación del validador zod).

El resto de F03 aplica sin ADR adicional: ADR-002/ADR-007 (sync + LWW, ya establecidos) para la sincronización de `routine`/`customExercise`, ADR-004 (contract-first) para el cambio de `openapi.yaml`, ADR-001 (Expo managed) para justificar el uso de `expo-sharing`/`expo-document-picker` como módulos estándar del SDK ya adoptado — no requieren su propio ADR por ser uso directo y sin política no trivial (a diferencia de `MediaCacheAdapter`/ADR-008, que sí introducía una política LRU propia).

## 8. Feature flags

Ninguno. F03 es MVP v1.0 completo según `01-vision-alcance-roadmap.md` §5 (compartir por enlace/QR y editor web quedan fuera de alcance, v2, sin necesidad de flag porque simplemente no se construyen todavía).
