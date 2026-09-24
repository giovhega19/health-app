# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/). Fechas en AAAA-MM-DD.

## [H2] Editor de rutinas y programación — 2026-09-24

### Añadido
- **F03 Creación, edición e importación de rutinas**: agregado `Routine` (bloques CALENTAMIENTO/PRINCIPAL/VUELTA A LA CALMA, agrupación NORMAL/SUPERSERIE/CIRCUITO, overrides de tiempo por ítem, RN-05/RN-06/RN-07), `RoutineDurationEstimator` (dominio puro, RN-07, probado por propiedades), importación/exportación `.fitroutine.json` (esquema v1 con zod) con vista previa, advertencias (ejercicio desconocido convertido a personalizado, valores fuera de RN-06 recortados) y detección de versión no soportada, "Duplicar y editar" sobre rutinas `PREDEFINED` del catálogo. Pantallas `MyRoutines.tsx`, `RoutineEditor.tsx` (mínimo), `ImportPreview.tsx`, ruta `app/routines/`.
- **F04 Programación y recordatorios**: `ScheduleSlot` (agregado) y programación semanal, `NotificationPlanner` (dominio puro, ventana móvil de 7 días, RN-15/RN-16, ADR-010) con los cinco tipos de notificación (`PRE_REMINDER`, `START`, `EXPECTED_END`, `MISSED`, `INTERVAL_END`), posponer (máximo 3/día), horas de silencio y límite diario, `RestRuleChecker` (RN-13, dominio puro) para el descanso mínimo entre rutinas y por grupo muscular. Pantallas `WeeklyCalendar.tsx` (con "Cancelar" y aviso de descanso insuficiente), `PermissionDeniedBanner.tsx`, `SessionDeepLinkPlaceholder.tsx` (placeholder de F05), ruta `app/schedule/`.
- Cierre de punta a punta de `CA-02.04.3` (aceptar una propuesta de F02 crea `Routine`s y `ScheduleSlot`s reales): `ProposalAccepted` → `RoutinesCreatedFromProposal` (F03) → `CreateScheduleSlotsFromProposal` (F04), acoplamiento solo por evento de dominio en el composition root (Art. 9.2).
- Módulo backend `training` (mínimo, sin endpoints REST propios): solo los manejadores del SPI de sincronización (`SyncEntityHandler`/`SyncEntityApplier`) para `Routine`/`CustomExercise`/`ScheduleSlot`, reutilizando el pipeline de `outbox`/`sync` de F01 (LWW de RN-18) sin reabrir `identity`/`profile`/`sync`/`catalog`. Las rutinas y la programación del usuario sobreviven reinstalación o cambio de dispositivo (Art. 4.2).
- `specs/F03-editor-rutinas/{plan.md,tasks.md}` y `specs/F04-programacion-recordatorios/{plan.md,tasks.md}`.

### Corregido (hallazgos de la ronda de verificación de H2, antes de cerrar el hito)
- **Alto — CA-03.01.1 inalcanzable**: `MyRoutines.tsx` no mostraba la duración estimada de cada rutina pese a que `RoutineDurationEstimator` ya la calculaba correctamente. Corregido: la pantalla recalcula y muestra la duración (minutos) de cada rutina propia y predefinida al listar.
- **Alto — CA-03.05.1/CA-03.08.2/.3/.4 inalcanzables**: `PreviewImportRoutine`/`ConfirmImportRoutine`/`DuplicateRoutine` ya existían y estaban probados en aislamiento, pero ninguna pantalla los invocaba — un usuario real no podía importar ni duplicar una rutina. Corregido: nueva pantalla `ImportPreview.tsx` (elegir archivo → vista previa con ejercicios/duración/advertencias → confirmar) y el botón "Duplicar y editar" en `MyRoutines.tsx` sobre rutinas `PREDEFINED`, ambos cableados en `RoutinesNavigator.tsx` y alcanzables desde `app/routines/`.
- **Alto — CA-04.01.2 inalcanzable**: no existía forma de cancelar un `ScheduleSlot` desde la UI; `SlotCancelled` solo lo publicaba `ScheduleSlotSyncEntityApplier` al aplicar un `delete` remoto, nunca una acción local del usuario. Corregido: nuevo caso de uso `CancelSlot` (persiste el borrado lógico y publica `SlotCancelled` de verdad) con un botón "Cancelar" en `WeeklyCalendarScreen`; verificado de punta a punta con SQLite real (`sql.js`) y el mock de `expo-notifications` en `composition/__tests__/container.test.ts`, confirmando que cancelar dispara `ReplanNotificationWindow` y cancela en el SO las notificaciones ya programadas.
- **Medio — CA-04.04.1/.2 (RN-13) desconectados del único flujo real**: `CreateScheduleSlotsFromProposal` (el único caso de uso que crea varios `ScheduleSlot` a la vez, al aceptar una propuesta de F02) creaba los slots sin pasar por `RestRuleChecker`. Corregido: ahora invoca `checkRestRules` comparando los slots del propio lote entre sí (sin depender de `LastSessionQueryPort`, que sigue siendo un *stub* en H2) y deja las advertencias en `RestWarningStore`, visibles en `WeeklyCalendarScreen`. **Cierre parcial, documentado explícitamente en `specs/F04-programacion-recordatorios/spec.md`**: el escenario exacto del Gherkin de CA-04.04.1/.2 (advertencia contra una *sesión ya completada*) sigue sin verificarse de punta a punta hasta que exista `workout-session` (F05/H3) — `LastSessionQueryPort` es un adaptador *stub* seguro por defecto hasta entonces.

### Corregido (hallazgos de seguridad, antes de cerrar el hito)
- **Alto**: eliminar la cuenta (`DeleteAccount`) no purgaba los datos locales de `routines`/`scheduling` (rutinas, ejercicios personalizados, `ScheduleSlot`, notificaciones planificadas) ni cancelaba las notificaciones ya programadas en el sistema operativo — solo limpiaba perfil/peso/tokens. Corregido con `purgeLocalDataOnAccountDeletion` en el composition root, suscrito a `AccountDeleted` (mismo patrón que el `AccountDeletedListener` del backend), ejecutado de forma síncrona antes de confirmar la eliminación de cuenta al usuario.
- **Medio**: la importación de rutinas (`PreviewImportRoutine`/`ConfirmImportRoutine`) no recortaba los valores fuera de los límites de RN-06 (series, reps, segundos, peso) provenientes de un archivo `.fitroutine.json` externo — un archivo malicioso o corrupto podía violar la invariante de dominio antes de llegar al constructor de `Routine`. Corregido: `clampToLimits` (RN-06) se aplica durante la vista previa, con advertencia visible (`VALUE_CLAMPED`) antes de confirmar (CA-03.08.3).
- **Verificado, ya correcto desde el inicio**: el módulo backend `training` deriva `userId` del JWT en cada `SyncEntityHandler` (`RoutineSyncEntityHandler`, `CustomExerciseSyncEntityHandler`, `ScheduleSlotSyncEntityHandler`), nunca de un parámetro de la petición, y rechaza operar sobre una entidad cuyo `userId` no coincide con el del token — protección anti-IDOR correcta desde la primera implementación, sin hallazgo que corregir.

### Deuda técnica conocida (no bloqueante)
- `ADR-010` (ventana móvil de 7 días de notificaciones) permanece en estado **Propuesto**: su disparador 3 ("tras un `pull` de sincronización que trae `ScheduleSlot` nuevos o editados") no está cableado — `PullRemoteChanges.execute()` no publica ningún evento y nada en `composition/container.ts` ni en la app llama a `scheduling.replanNotificationWindow.execute()` después de un `pull` (de hecho, `sync.pullRemoteChanges` no se invoca automáticamente desde ninguna pantalla todavía, herencia de F01). Los disparadores 1 (al abrir la app) y 2 (tras cambio de programación local, incluida la nueva `CancelSlot`) sí están cableados y probados.
- `RoutineEditor.tsx` es mínimo: sin selector real de ejercicio de catálogo/personalizado, sin *drag-and-drop*, sin `CustomExerciseForm.tsx`, y sin caso de uso de "renombrar/editar" una rutina ya guardada (`UpdateRoutine` no existe; el editor solo crea o revisa un duplicado recién copiado).
- `WeeklyCalendar.tsx` solo permite cancelar un slot, no editarlo (`SlotEditor.tsx` completo, `NotificationSettings.tsx` quedan pendientes).
- RN-13 (CA-04.04.1/CA-04.04.2) solo se evalúa comparando los slots de un mismo lote de propuesta entre sí; la comparación contra una sesión ya completada de verdad depende de `workout-session` (F05/H3).

### Referencias
- `specs/F03-editor-rutinas/spec.md` (`CA-03.01.1`–`CA-03.08.4`) y `specs/F04-programacion-recordatorios/spec.md` (`CA-04.01.1`–`CA-04.06.2`) — 21/21 criterios con prueba que los cita.

## [H1] Perfil, onboarding y catálogo — 2026-09-23

### Añadido
- **F01 Perfil y onboarding**: registro/login/refresh rotativo/logout/recuperación de contraseña (Spring Security + JWT + Argon2id), perfil con edad mínima (RN-01) e IMC/TMB (RN-02/RN-03), historial de peso, eliminación de cuenta con purga real de datos de salud, flujo completo de onboarding (11 pantallas: bienvenida → objetivo → nivel → disponibilidad → equipo → datos corporales → PAR-Q → consentimiento → resumen con plan propuesto → cuenta/invitado → notificaciones).
- **F02 Catálogo y propuesta**: `RecommendationEngine` (RN-14) puro con pruebas de propiedades, catálogo de ejercicios/rutinas con filtros, caché de medios offline con política LRU de 300 MB (ADR-008), sincronización incremental del catálogo (`updatedSince`), propuesta de plan semanal ajustable.
- **`features/sync`**: outbox + motor de sincronización push/pull genérico (perfil y peso corporal en H1), con resolución de conflictos last-write-wins por entidad (ADR-007).
- Persistencia real por primera vez: PostgreSQL + Flyway (esquemas `identity`/`profile`/`catalog`) + Testcontainers; SQLite/Drizzle real en el cliente móvil.
- Contrato `openapi.yaml` ampliado con los endpoints de `identity`, `profile`, `sync` y `catalog`.
- ADR-008 (caché de medios LRU) redactado y aceptado; ADR-002, ADR-004 y ADR-007 promovidos de Propuesto a Aceptado tras su primer uso real en producción.
- `specs/F01-perfil-onboarding/{plan.md,tasks.md}` y `specs/F02-catalogo-propuesta/{plan.md,tasks.md}`.

### Corregido (hallazgos de la revisión de seguridad, antes de cerrar el hito)
- **Crítico**: `DELETE /me` no purgaba los datos de salud en `profile_profiles`/`profile_body_metrics`, violando el derecho de supresión (Art. 5.4, RNF-08). Corregido con un evento de dominio `AccountDeleted` (identity → profile, síncrono en la misma transacción) que dispara `PurgeProfileData`.
- **Alto**: condición de carrera en la rotación de refresh tokens permitía eludir la detección de reuso (lectura-luego-escritura sin atomicidad). Corregido con `UPDATE ... WHERE revoked_at IS NULL` atómico.

### Corregido (proceso — encontrado al verificar el CI en un PR real)
- **`.gitignore` excluía silenciosamente ~44 archivos reales del backend.** La regla `out/` (sin anclar, pensada para un directorio de salida de IDE) coincidía también con la convención hexagonal `adapters/out/**` que usa cada módulo del backend. Resultado: toda la capa de persistencia JPA, seguridad (`Argon2PasswordHasherAdapter`, `NimbusTokenIssuer`) y los sync handlers, con sus tests, nunca se commitearon — existían solo en el working tree local (por eso `git status` los mostraba "limpio": los archivos ignorados no aparecen ahí) y el backend "funcionaba" en verificaciones locales repetidas solo porque los archivos ya estaban en disco. Un clon limpio (CI, o cualquier otra persona) obtenía un backend incompleto que fallaba la cobertura de JaCoCo (69% en vez de ~76-87%) sin ningún error de compilación que lo delatara. Corregido anclando la regla a `/out/` (solo la raíz del repo) y commiteando los archivos recuperados. Además se agregaron pruebas MockMvc para los controladores REST (antes al 0% de cobertura), subiendo la cobertura global a 87.3%.
- Verificación local con `./gradlew check` (sin `clean`) puede reportar `UP-TO-DATE` por caché incremental stale y ocultar regresiones reales de cobertura — de aquí en adelante, usar siempre `./gradlew clean check` para cualquier verificación que importe.

### Deuda técnica conocida (no bloqueante)
- Rate limiting de `/auth/*` solo por IP, sin purga de memoria ni límite por cuenta; sin fail-fast si el JWT secret por defecto llega a producción; sin logout desde el móvil; `sync/push` sin límite de tamaño de payload; envío real de email de recuperación fuera de alcance (sin proveedor SMTP); migraciones Drizzle con bootstrap propio en vez del flujo oficial `drizzle-kit`; hash FNV-1a (no SHA-256 truncado) en la caché de medios; pruebas de integración JPA con Testcontainers no ejecutables en Windows con Docker Desktop (incompatibilidad de API conocida, pendiente de confirmar en CI Linux).

### Referencias
- `specs/F01-perfil-onboarding/spec.md` (`CA-01.01.1`–`CA-01.08.1`) y `specs/F02-catalogo-propuesta/spec.md` (`CA-02.01.1`–`CA-02.06.1`) — 16/16 criterios con prueba que los cita.

## [H0] Fundaciones — 2026-09-22

### Añadido
- ADR-001 a ADR-007 en `docs/adr/`, formalizando las decisiones arquitectónicas fundacionales (Expo managed + EAS, offline-first con outbox, monolito modular Spring Modulith, OpenAPI contract-first, motor de temporizador con marcas de tiempo absolutas, Zustand + TanStack Query, sincronización last-write-wins por entidad).
- Monorepo con pnpm workspaces: `apps/mobile` (Expo SDK 57, TypeScript strict, capas domain/application/infrastructure/presentation por feature), `backend` (Spring Boot 3.5.6 + Spring Modulith 1.4.3 sobre Java 21), `packages/api-contract` (OpenAPI 3.1 stub) y `packages/routine-schema` (reservado para F03).
- CI básico en `.github/workflows/ci.yml`: jobs `mobile` (lint, typecheck, test con cobertura, arch:check), `backend` (`./gradlew check`) y `contract` (lint OpenAPI + regeneración de cliente + detección de drift).
- Protección de la rama `main` exigiendo los 3 checks de CI en verde antes de mergear.
- `specs/H0-fundaciones/{spec.md,plan.md,tasks.md}` documentando el hito.

### Corregido
- `ci.yml`: separador `--` duplicado en el paso de cobertura del job `mobile` (`pnpm --filter ... run test -- --coverage`) que hacía que Jest recibiera argumentos inválidos y pasara en verde sin ejecutar ninguna prueba. Corregido a `pnpm --filter @fitapp/mobile test --coverage`.

### Referencias
- PR [#1](https://github.com/giovhega19/health-app/pull/1) (`develop` → `main`), run de CI [35783622594](https://github.com/giovhega19/health-app/actions/runs/35783622594).
- `specs/H0-fundaciones/spec.md` (criterios `CR-H0.1`–`CR-H0.13`).
