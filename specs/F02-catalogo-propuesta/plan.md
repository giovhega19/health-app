# Plan técnico · F02 Catálogo de ejercicios, rutinas predefinidas y propuesta

> Generado por `arquitecto` a partir de `spec.md` (MVP 1.0, aprobado). Cubre el hito **H1** junto con `specs/F01-perfil-onboarding/plan.md`. No se inicia la implementación sin aprobación del usuario de este `plan.md` y de `tasks.md` (regla de `CLAUDE.md`).
>
> **Estado: ejecutado y cerrado el 2026-09-23** (ver `tasks.md`, CHANGELOG.md §H1).

## 1. Resumen de la solución

F02 ofrece un catálogo de ejercicios y rutinas predefinidas que funciona sin conexión desde el primer arranque (se envasa una semilla local, ver §"Contenido de datos"), y un `RecommendationEngine` puro que genera un plan semanal según el perfil del usuario (RN-14). El backend añade el módulo `catalog` (manifest, ejercicios, rutinas, versión incremental por `updatedSince`), de solo lectura desde el cliente (no participa en `POST /sync/push`: el catálogo es contenido servido por el backend, no datos de usuario sincronizados, ver `06-contratos-api.md` §"sync" — su lista de entidades sincronizadas no incluye ejercicios ni rutinas predefinidas).

### Secuencia de implementación H1 (dependencia cruzada con F01)

Ver `specs/F01-perfil-onboarding/plan.md` §1 para la justificación completa. En resumen: el dominio del `RecommendationEngine` (RN-14) y un catálogo semilla de desarrollo se construyen **en paralelo** con el dominio/aplicación de F01, sin dependencia entre ambos hasta un único punto de integración: la tarea `F02-T10` (`GenerateProposal` expuesto en `features/catalog/index.ts`) es un **prerrequisito bloqueante** de `F01-T13`/`F01-T14` (la pantalla "Resumen" del onboarding). Ninguna otra tarea de F02 depende de F01; F02 solo recibe un `ProfileSnapshot` (DTO de solo lectura, sin importar nada de `features/profile`) como argumento del caso de uso `GenerateProposal`, definido por quien lo llama (F01) — ver §3.

### Contenido de datos: catálogo semilla de desarrollo (fuera de alcance: contenido real)

Tal como indica `spec.md`, "el contenido lo valida un profesional del deporte (tarea de contenido, no de código)": los ~60 ejercicios reales, sus videos/animaciones y las 12 rutinas predefinidas reales **no se producen en esta implementación técnica**. Para desarrollo, pruebas automatizadas y demos de H1 se usa un **catálogo semilla pequeño y representativo**, con datos ficticios/placeholder:

- **6–8 ejercicios** variados: al menos uno por grupo muscular principal (pecho, espalda, piernas, hombros, core, cardio), mezclando `mode: REPS` y `mode: TIME`, y al menos dos con `equipment: [NONE]` y dos que requieran equipo (p. ej. `DUMBBELLS`). Imágenes/animaciones: assets placeholder locales (no producción). Ningún ejercicio semilla lleva video real (el flujo de "ver video" se prueba con una URL placeholder).
- **2–3 rutinas predefinidas** placeholder: cubriendo al menos dos objetivos distintos (p. ej. `LOSE_WEIGHT` y `MUSCLE_GAIN`), una de ellas `BEGINNER` y sin equipo, para poder probar RN-14 y CA-02.04.1/.2/.3 con datos reales de la base de datos (no solo mocks).

Esta semilla se define **una sola vez** como referencia (lista exacta en `tasks.md` §`F02-T06`/`F02-T08`) y se materializa dos veces: como datos de arranque del backend (gateado por perfil `dev`/`test`, nunca en una futura migración de producción) y como JSON envasado en el cliente móvil para el arranque offline. Riesgo de duplicación/drift documentado en §6.

## 2. Impacto por capa

| Capa | Móvil (`apps/mobile/src/features/catalog/`) | Backend (`backend/src/main/java/com/fitapp/catalog/`) |
|---|---|---|
| Domain | `domain/Exercise.ts`, `domain/PredefinedRoutine.ts` (usa las formas genéricas `RoutineBlock`/`RoutineItem`/`TimerSettings` de `shared/domain`, ver decisión de diseño más abajo), `domain/WeeklyPlan.ts`, `domain/RecommendationEngine.ts` (función pura RN-14: `(input: RecommendationInput, catalog: CatalogSnapshot) => Result<WeeklyPlan, RecommendationError>`), `domain/errors.ts`, `domain/events.ts` (`ProposalAccepted`); nuevos `shared/domain/{MuscleGroup,ExerciseDifficulty,ExerciseMode}.ts`; nuevos `shared/domain/{routineDuration.ts (RN-07), exerciseCalories.ts (RN-04)}` (ver decisión de diseño) | `domain/Exercise.java`, `domain/Routine.java` (+ `RoutineBlock`, `RoutineItem`, `TimerSettings` como value objects), puertos out `ExerciseRepository`, `RoutineRepository`, `CatalogManifestProvider` |
| Application | `application/GetExerciseDetail.ts`, `application/FilterExercises.ts`, `application/GenerateProposal.ts` (implementación real de `RoutineProposalPort` de F01, expuesta en `index.ts`), `application/AcceptProposal.ts` (emite `ProposalAccepted`, ver §"Alcance de AcceptProposal en H1"), `application/DownloadCatalogUpdate.ts`, `application/EnsureOfflineMedia.ts`; puertos `ExerciseRepository`, `PredefinedRoutineRepository`, `MediaCachePort`, `CatalogManifestPort` | `application/GetManifest.ts`→Java: `GetManifest`, `ListExercisesUpdatedSince`, `ListRoutinesUpdatedSince` (casos de uso = puertos in) |
| Infrastructure | `infrastructure/db/schema.ts` (Drizzle: `exercises`, `predefined_routines`, `routine_blocks`, `routine_items`, `catalog_manifest_state`), `infrastructure/SqliteExerciseRepository.ts`, `infrastructure/SqlitePredefinedRoutineRepository.ts`, `infrastructure/HttpCatalogAdapter.ts`, `infrastructure/MediaCacheAdapter.ts` (LRU 300 MB sobre `expo-file-system`, ver ADR requerido en §7), `infrastructure/seed/dev-catalog.json` (bootstrap al primer arranque) | `adapters/in/web/CatalogController.java` (`/catalog/manifest`, `/catalog/exercises`, `/catalog/routines`), `adapters/out/persistence/` (JPA: `ExerciseEntity`, `RoutineEntity` + bloques/ítems como columna JSON o tablas hijas), `seed/CatalogDevSeeder.java` (gateado por `@Profile({"dev","test"})`, nunca en producción) |
| Presentation | `presentation/screens/{ExerciseList,ExerciseDetail,Filters,ProposalReview}.tsx`, `presentation/stores/useCatalogStore.ts`; rutas en `apps/mobile/app/(tabs)/catalog/*` | — |

### Decisión de diseño: `Routine`/`RoutineBlock`/`RoutineItem`/`TimerSettings` como formas genéricas en `shared/domain`, RN-04/RN-07 como funciones puras compartidas

`05-modelo-dominio-reglas.md` modela `Routine`/`RoutineBlock`/`RoutineItem`/`TimerSettings` de forma genérica (no exclusiva de F02): las mismas formas las usará `features/routines` (F03, rutinas del usuario) y las consumirá `features/workout-session` (F05). Para no duplicar la estructura de datos ni la fórmula de duración (RN-07) o de calorías (RN-04) entre F02 y las features futuras — lo que violaría Art. 9.1 el día que F03 tenga que "modificar" una fórmula que en realidad vive en `catalog` —, se declara en `shared/domain`:
- Interfaces estructurales (sin identidad de entidad propia): `RoutineBlock`, `RoutineItem`, `TimerSettings`.
- Funciones puras: `estimateRoutineDurationSeconds(routine, defaults): number` (RN-07, con precedencia RN-05: `item.timerOverrides → routine.timerDefaults → preferencias → defaults de la app`) y `estimateExerciseCalories(met, weightKg, activeMinutes): number` (RN-04).

`catalog/domain/PredefinedRoutine.ts` es la primera entidad (con identidad e invariantes propias: `source: "PREDEFINED"`, no editable) que usa esas formas; F03 definirá su propia entidad `UserRoutine` reutilizando las mismas formas e funciones sin tocar `catalog` ni `shared/domain` (salvo que RN-07/RN-04 cambien, en cuyo caso el cambio se hace una sola vez y beneficia a ambas features).

### Alcance de `AcceptProposal` en H1 (ver también "Preguntas abiertas" registrada en `spec.md`)

CA-02.04.3 exige que, al aceptar la propuesta, "las rutinas se copian a 'Mis rutinas' y se crean los `ScheduleSlot`". Esa persistencia pertenece a los módulos `routines` (F03) y `scheduling` (F04), que **no están planificados en H1** (roadmap: H2, semanas 5–6, ver `01-vision-alcance-roadmap.md` §7). Para no bloquear F02 en H1 ni inventar prematuramente un módulo de F03/F04, `AcceptProposal` en H1:
1. Valida el plan (equipo compatible, duración dentro de `minutesPerSession ± 10 %`, etc. — ya garantizado por `RecommendationEngine`).
2. Permite ajustar días/horas preferidos en memoria (pantalla `ProposalReview`, sin persistir todavía en un `ScheduleSlot` real).
3. Emite el evento de dominio `ProposalAccepted { profileId, plan: WeeklyPlan, preferredSchedule }` a través del `EventBus` (puerto ya scaffoldeado en H0).
4. **No** escribe en ninguna tabla de "Mis rutinas" ni `schedule_slots` porque esas tablas no existen aún.

Cuando F03/F04 se planifiquen (H2), su plan técnico añade un **suscriptor** de `ProposalAccepted` que realiza la copia real a `UserRoutine`/`ScheduleSlot`, sin modificar ninguna línea de `catalog` (Art. 9.1, patrón ya usado en `04-arquitectura.md` §3.4 decisión 2 para `WorkoutSessionCompleted`). Esto satisface la mitad de CA-02.04.3 verificable en H1 (evento emitido con el payload correcto, plan generado y ajustable) y dejará la CA completamente verificable de punta a punta cuando exista un consumidor, sin rediseño.

## 3. Contratos

**Cambios en `openapi.yaml` (contract-first, antes que el código — tarea `F02-T04`):**

| Método | Ruta | Query | Response | RF/CA |
|---|---|---|---|---|
| GET | `/catalog/manifest` | — | `200 CatalogManifest {version, exercisesEtag, routinesEtag, mediaBaseUrl}` | RF-02.06, CA-02.06.1 |
| GET | `/catalog/exercises` | `updatedSince?` | `200 {items: ExerciseDto[]}` | RF-02.01, RF-02.06 |
| GET | `/catalog/routines` | `updatedSince?` | `200 {items: RoutineDto[]}` | RF-02.03, RF-02.06 |

`ExerciseDto`: `id, slug, name, muscleGroups[], equipment[], difficulty, mode, met, instructions[], commonMistakes[], imageUrl, animationUrl?, videoUrl?, updatedAt`. `RoutineDto`: `id, name, goal, level, timerDefaults, blocks: RoutineBlockDto[], version, updatedAt`. Reutilizan el esquema `Problem` ya existente para errores.

**`GET /config/flags` (mencionado en `06-contratos-api.md` bajo la tabla de `catalog`) queda explícitamente fuera de alcance de F02/H1**: ninguna funcionalidad de H1 lee feature flags remotos; el mecanismo real de flags se construye junto con F10 (v2), según `04-arquitectura.md` §3.4 decisión 6. Añadirlo ahora sería código especulativo sin consumidor (principio de simplicidad del rol de arquitecto).

**Puertos nuevos (TypeScript, `catalog/application/ports.ts`):**
```ts
interface ExerciseRepository {
  findById(id: Id): Promise<Result<Exercise | null, RepositoryError>>;
  filter(criteria: ExerciseFilter): Promise<Result<Exercise[], RepositoryError>>;
  upsertMany(exercises: Exercise[]): Promise<Result<void, RepositoryError>>; // usado por DownloadCatalogUpdate
}
interface PredefinedRoutineRepository {
  all(): Promise<Result<PredefinedRoutine[], RepositoryError>>;
  upsertMany(routines: PredefinedRoutine[]): Promise<Result<void, RepositoryError>>;
}
interface MediaCachePort {
  ensureCached(mediaRef: MediaRef): Promise<Result<LocalUri, MediaCacheError>>;
  evictLeastRecentlyUsed(bytesNeeded: number): Promise<void>;
}
interface CatalogManifestPort {
  fetchManifest(): Promise<Result<CatalogManifest, HttpError>>;
  fetchUpdatedSince(kind: "exercises" | "routines", since: Date | null): Promise<Result<unknown[], HttpError>>;
}
```
**API pública expuesta en `features/catalog/index.ts` (consumida por F01 vía composition root, nunca importada directamente):**
```ts
export function createCatalogContainer(deps: CatalogDeps): {
  generateProposal: (profile: ProfileSnapshot) => Promise<Result<WeeklyPlanSummary, ProposalError>>;
  // + factories de los demás casos de uso, para las pantallas propias de catalog
};
```

**Eventos de dominio:**
| Evento | Payload | Emisor | Consumidores previstos |
|---|---|---|---|
| `ProposalAccepted` | `{profileId, plan: WeeklyPlan, preferredSchedule}` | `AcceptProposal` | Ninguno en H1 (ver §"Alcance de `AcceptProposal`"); F03/F04 en H2 |
| `CatalogUpdated` | `{version, exercisesCount, routinesCount}` | `DownloadCatalogUpdate` | Analítica futura; ninguno obligatorio en H1 |

## 4. Datos

**Móvil (Drizzle):**
- `exercises`: `id` (uuid pk), `slug` (unique), `name`, `muscle_groups` (json), `equipment` (json), `difficulty`, `mode`, `met`, `instructions` (json), `common_mistakes` (json), `image_url`, `animation_url` (nullable), `video_url` (nullable), `is_custom` (bool, siempre `false` para catálogo), `updated_at`, `deleted_at` (nullable).
- `predefined_routines`: `id` (uuid pk), `name`, `goal`, `level`, `timer_defaults` (json), `version`, `updated_at`, `deleted_at` (nullable).
- `routine_blocks` / `routine_items`: tablas hijas normalizadas de `predefined_routines` (fk `routine_id`, orden explícito) — se elige normalizar (no JSON embebido) porque `RecommendationEngine` necesita filtrar/leer ítems individuales de forma eficiente y estas tablas serán reutilizadas sin cambios por F03 cuando `UserRoutine` las necesite también (mismo esquema, distinta tabla padre).
- `catalog_manifest_state`: fila única `{version, exercises_etag, routines_etag, last_synced_at}` — estado local del último manifest aplicado (CA-02.06.1).
- Ninguna de estas tablas pasa por `outbox`/`sync`: el catálogo es de solo lectura para el cliente (§1).

**Backend (Flyway):**
- `db/migration/catalog/V1__create_catalog_tables.sql` → `catalog_exercises`, `catalog_routines`, `catalog_routine_blocks`, `catalog_routine_items` (mismas columnas que el lado móvil, con `updated_at` como fuente de `updatedSince`).
- **Semilla de desarrollo:** no es una migración Flyway (para no mezclarse con el historial de esquema ni arriesgar ejecutarse en un entorno real); es un `ApplicationRunner`/`CommandLineRunner` (`CatalogDevSeeder`) anotado `@Profile({"dev", "test"})`, inserta los 6–8 ejercicios y 2–3 rutinas descritos en §1 si las tablas están vacías. Documentado en `tasks.md` `F02-T06`.

## 5. Estrategia de pruebas

| CA | Nivel | Archivo de prueba previsto |
|---|---|---|
| CA-02.01.1 (detalle de ejercicio) | Dominio + Componente | `features/catalog/domain/__tests__/Exercise.test.ts`, `presentation/screens/__tests__/ExerciseDetail.test.tsx` |
| CA-02.02.1 (filtros combinados + anuncio de resultados) | Aplicación + Componente (accesibilidad) | `features/catalog/application/__tests__/FilterExercises.test.ts`, `presentation/screens/__tests__/Filters.a11y.test.tsx` |
| CA-02.04.1 (propuesta según perfil) | Dominio (tablas de casos RN-14) | `features/catalog/domain/__tests__/RecommendationEngine.rn14.test.ts` — una tabla de casos por combinación de objetivo × nivel × días, usando el catálogo semilla como fixture (`test/fakes/aCatalogSnapshot.ts`) |
| CA-02.04.2 (máx. 6 días de entrenamiento con 7 días/semana) | Dominio | Caso incluido en la tabla anterior |
| — (RN-07, duración monótona) | Dominio, basado en propiedades | `shared/domain/__tests__/routineDuration.property.test.ts` con `fast-check`: la duración nunca es negativa y crece monótonamente con el número de series (caso mencionado explícitamente en `07-estrategia-pruebas.md` §2.5) |
| CA-02.04.3 (aceptar/ajustar propuesta) | Aplicación | `features/catalog/application/__tests__/AcceptProposal.test.ts` — verifica que se emite `ProposalAccepted` con el payload correcto; **no** verifica persistencia en "Mis rutinas"/`ScheduleSlot` (fuera de alcance H1, ver §2) |
| CA-02.05.1 (sin conexión) | Integración + Componente | `features/catalog/infrastructure/__tests__/MediaCacheAdapter.test.ts` (con sistema de archivos temporal), `presentation/screens/__tests__/ExerciseDetail.offline.test.tsx` (MSW con red desactivada) |
| CA-02.06.1 (actualización incremental del catálogo) | Aplicación + Integración (MSW) | `features/catalog/application/__tests__/DownloadCatalogUpdate.test.ts`. La parte "las rutinas del usuario que referencian ejercicios no se modifican" se prueba en H1 solo a nivel de esquema (la actualización únicamente hace `UPSERT` sobre `exercises`/`predefined_routines`, nunca sobre tablas fuera de `catalog`); la prueba de regresión de extremo a extremo con rutinas de usuario reales se añade en el plan técnico de F03 |
| Backend | Integración | `catalog/adapters/in/web/CatalogControllerTest.java` (`@WebMvcTest`), `catalog/adapters/out/persistence/*RepositoryIntegrationTest.java` (Testcontainers PostgreSQL) validando `updatedSince` |
| Arquitectura | — | `dependency-cruiser` verifica que `features/catalog` no importe `features/profile`; ArchUnit/Modulith en backend |

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Drift entre la semilla de desarrollo del backend (`CatalogDevSeeder`) y la del móvil (`infrastructure/seed/dev-catalog.json`) | Ambas listas derivan literalmente de la tabla fijada en `tasks.md` `F02-T06`/`F02-T08` (mismos `slug` de ejercicio e IDs de rutina); `qa-pruebas` verifica en la tarea de trazabilidad final que ambas coincidan |
| Confundir el catálogo (contenido de solo lectura del backend) con datos de usuario sincronizables | `catalog` nunca implementa `SyncEntityHandler` ni escribe en `outbox`; queda documentado explícitamente en §1 y §4 |
| `MediaCacheAdapter` (LRU 300 MB) introduce una política de caché no trivial sin librería de terceros ya aprobada | Se usa `expo-file-system` (ya parte del stack Expo, sin dependencia nueva); la política LRU se implementa como lógica de aplicación pura y se prueba por separado del acceso a disco (puerto `MediaCachePort` con fake en memoria para pruebas de política, adaptador real solo para pruebas de integración) |
| `RecommendationEngine` es la pieza más compleja de RN-14 (tabla de objetivos × niveles × días); alto riesgo de casos no cubiertos | Tabla de casos exhaustiva (5 objetivos × 3 niveles × 7 valores de días = hasta 105 combinaciones, no todas necesitan un test individual pero sí una función generadora de casos) + pruebas basadas en propiedades para invariantes generales (nunca propone equipo no disponible, nunca excede `minutesPerSession ± 10 %`, RN-14 "al menos 1 día de descanso" con 7 días) |
| `AcceptProposal` sin persistencia real (§2) podría interpretarse como que F02 "no cumple" CA-02.04.3 | Documentado explícitamente aquí y como pregunta abierta en `spec.md`; se comunica al usuario en el resumen de esta ronda de planificación para que confirme el criterio antes de que `dev-mobile-rn` implemente |

## 7. ADR requeridos

**Sí hace falta un ADR nuevo: ADR-008 (número tentativo, a confirmar contra `docs/adr/` en el momento de redactarlo) — "Caché de medios con política LRU sobre `expo-file-system`"**, porque introduce una política de gestión de almacenamiento local no trivial (límite de 300 MB, orden de desalojo, validación de integridad de los archivos descargados) que no está cubierta por ninguno de los 7 ADR existentes ni por la tabla de stack de `04-arquitectura.md`. **No se redacta en esta ronda** (el encargo limita esta ronda a `spec.md`/`plan.md`/`tasks.md`); queda como tarea explícita `F02-T02` en `tasks.md`, a cargo de `arquitecto`, **bloqueante** de la tarea de implementación del adaptador de caché (`F02-T11`).

El resto de F02 aplica ADR-004 (contract-first) sin necesidad de un ADR adicional.

## 8. Feature flags

Ninguno en F02. `/config/flags` queda fuera de alcance (§3); todas las capacidades descritas son MVP sin flag.
