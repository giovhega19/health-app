# Plan técnico · F04 Programación y recordatorios

> Generado por `arquitecto` a partir de `spec.md` (MVP 1.0, aprobado). Cubre el hito **H2** junto con `specs/F03-editor-rutinas/plan.md`, del que depende parcialmente (ver §1). No se inicia la implementación sin aprobación del usuario de este `plan.md` y de `tasks.md` (regla de `CLAUDE.md`).

## 1. Resumen de la solución

F04 añade el módulo `features/scheduling`: un calendario semanal para asignar rutinas a días/horas (`ScheduleSlot`), un `NotificationPlanner` puro de dominio que decide qué notificaciones locales mantener programadas dentro de una **ventana móvil de 7 días** (límite del SO, iOS permite 64 notificaciones locales pendientes en total), y el adaptador `NotificationScheduler` sobre `expo-notifications` (no instalado todavía). Cierra el segundo suscriptor que F02 dejó pendiente explícitamente para H2: al recibir `RoutinesCreatedFromProposal` (emitido por `routines`/F03, ver `specs/F03-editor-rutinas/plan.md` §3), crea los `ScheduleSlot` correspondientes — con eso, CA-02.04.3 queda **completamente** verificada de punta a punta (generar propuesta → aceptar → copiar a "Mis rutinas" → crear `ScheduleSlot`), cerrando la brecha documentada en `specs/F02-catalogo-propuesta/spec.md` §"Preguntas abiertas".

### Dependencia F03 → F04 (bloqueante solo en un punto)

`ScheduleSlot.routineId` necesita el `id` de una `Routine` real, que solo existe después de F03. La única tarea de F04 con dependencia de entrada desde F03 es `F04-T09` (suscriptor de `RoutinesCreatedFromProposal`), que depende de `F03-T13`. El resto de F04 (dominio del calendario, `NotificationPlanner`, permisos, horas de silencio, posponer) es autónomo: se prueba con una `Routine`/`RoutineSummary` de fixture (builder `aRoutineSummary()`), sin esperar a que el editor de F03 esté terminado. Ver `specs/F03-editor-rutinas/tasks.md` §"Importante" para la vista simétrica de esta dependencia.

### Brechas resueltas explícitamente (dependencias hacia hitos futuros que no existen todavía)

F04 depende, en su redacción literal de `spec.md`, de dos features que **no existen hasta H3** (`01-vision-alcance-roadmap.md` §7): `workout-session` (F05, sesión real) y su historial (para RN-13, CA-04.04.1/.2) y la pantalla de sesión a la que apuntan los deep links de las notificaciones. Se resuelven así, con el mismo patrón que F02 usó para F03/F04 en H1 (puerto con implementación *stub*, documentado, sin bloquear H2, sin inventar prematuramente el diseño de F05):

1. **RN-13 (descanso mínimo, CA-04.04.1/.2):** `CheckMinimumRest` (dominio, puro) recibe la información de la última sesión/grupo muscular entrenado a través de un puerto `LastSessionQueryPort` (`application/ports.ts`), del que en H2 solo existe una implementación *stub* (`NullLastSessionAdapter`, siempre devuelve "sin sesiones previas" — nunca produce una advertencia, nunca bloquea nada, comportamiento seguro por defecto). Cuando F05 (H3) exista, su plan técnico añade la implementación real y **ningún código de F04 cambia** (Art. 9.1) — solo se sustituye el adaptador en `composition/container.ts`. Documentado también como riesgo conocido en §6.
2. **Deep link a sesión (`fitapp://session/start?slot=…`):** F04 deja el contrato del deep link **definido y probado** (`buildSessionStartDeepLink(scheduleSlotId): string`, función pura de dominio) y una **pantalla placeholder mínima** (`presentation/screens/SessionDeepLinkPlaceholder.tsx`, ruta `apps/mobile/app/session/start.tsx`) que recibe el parámetro `slot`, muestra el nombre de la rutina y un mensaje "Disponible próximamente" — sin iniciar ninguna sesión real. F05 (H3) reemplaza únicamente esa pantalla por la real; el contrato de URL y la programación de notificaciones no cambian. Esto es explícitamente lo que el encargo de esta ronda de planificación pidió decidir, y es simétrico al patrón ya usado por F02 con `AcceptProposal` en H1.
3. **CA-04.04.2 ("rutina alternativa sugerida"):** se acota a una heurística simple para H2 — sugerir otra rutina que el usuario ya tenga programada en un `ScheduleSlot` activo para un día distinto (sin motor de recomendación por grupo muscular, que exigiría resolver grupos musculares de cada ítem vía `catalog`/`routines` para cada rutina candidata, un alcance no trivial no pedido explícitamente por RN-13/CA con ese nivel de detalle). Documentado como decisión de alcance en §6, no como pregunta abierta (es una simplificación de implementación, no una ambigüedad de negocio).

### Corrección de configuración: el `scheme` de deep link no coincide con `spec.md`

`apps/mobile/app.json` declara hoy `"scheme": "mobile"`, pero `spec.md` (y por tanto el diseño de las acciones de notificación) usa `fitapp://…`. No hay ningún build publicado en tiendas todavía (H5, `01-vision-alcance-roadmap.md` §7, es posterior), así que cambiar el `scheme` ahora no tiene costo de compatibilidad. Se corrige como parte de `F04-T02`: `app.json.expo.scheme` pasa de `"mobile"` a `"fitapp"`.

## 2. Impacto por capa

| Capa | Móvil (`apps/mobile/src/features/scheduling/`) | Backend (`backend/src/main/java/com/fitapp/training/`) |
|---|---|---|
| Domain | `domain/ScheduleSlot.ts` (entidad, `Entity`, invariantes: al menos un día de la semana, hora válida), `domain/NotificationPlanner.ts` (servicio puro: `(slots, routineSummaries, preferences, postponeState, now) → PlannedNotification[]`, ventana móvil de 7 días, horas de silencio, límite diario, prioridad), `domain/RestRuleChecker.ts` (RN-13, puro, recibe `lastSessionInfo` como parámetro — nunca lee un repositorio), `domain/SchedulingPreferences.ts` (VO: horas de silencio, `maxNotificationsPerDay`, `minHoursBetweenRoutines`, `minHoursSameMuscle` — ver decisión de alcance abajo), `domain/PostponeCounter.ts` (VO por fecha, máx. 3/día), `domain/deepLink.ts` (`buildSessionStartDeepLink`, pura), `domain/errors.ts`, `domain/events.ts` (`RoutineScheduled`, `SlotCancelled`, `NotificationPostponed`) | `domain/ScheduleSlot.java` (mismo módulo `training` que F03, ver `specs/F03-editor-rutinas/plan.md` §2), puerto out `ScheduleSlotRepository` |
| Application | `application/ScheduleRoutine.ts` (crea `ScheduleSlot`, calcula advertencia RN-13, dispara replanificación), `application/UpdateSlot.ts`, `application/CancelSlot.ts`, `application/ReplanNotificationWindow.ts` (núcleo: cancela lo obsoleto + programa lo nuevo dentro de los próximos 7 días; se llama al abrir la app y tras cualquier cambio de programación), `application/PostponeNotification.ts` (10/30/60 min, tope 3/día), `application/SkipToday.ts`, `application/RequestNotificationPermission.ts`, `application/UpdateSchedulingPreferences.ts`, `application/CreateScheduleSlotsFromProposal.ts` (suscriptor de `RoutinesCreatedFromProposal`, ver §1/§3); puertos en `application/ports.ts` (`ScheduleSlotRepository`, `NotificationScheduler`, `SchedulingPreferencesRepository`, `PostponeCounterRepository`, `LastSessionQueryPort`, `RoutineSummaryLookupPort`) | Sin casos de uso propios expuestos por REST en H2 (igual que F03, ver `specs/F03-editor-rutinas/plan.md` §2): `ScheduleSlot` solo entra/sale por `sync`. Se añade `ScheduleSlotSyncEntityHandler` |
| Infrastructure | Ampliación de `shared/infrastructure/db/schema.ts`: `schedule_slots`, `planned_notifications` (mapa `PlannedNotification` ↔ id de notificación del SO, para poder cancelarlas), `scheduling_preferences` (fila única), `postpone_counters`; `infrastructure/SqliteScheduleSlotRepository.ts`, `SqlitePlannedNotificationRepository.ts`, `SqliteSchedulingPreferencesRepository.ts`, `infrastructure/ExpoNotificationScheduler.ts` (adaptador real sobre `expo-notifications`, no instalado), `infrastructure/ScheduleSlotSyncEntityApplier.ts`, `infrastructure/NullLastSessionAdapter.ts` (*stub* de H2, ver §1) | `adapters/out/persistence/` (JPA: `training_schedule_slots`), `adapters/in/sync/ScheduleSlotSyncEntityHandler.java` |
| Presentation | `presentation/screens/{WeeklyCalendar,SlotEditor,NotificationSettings,SessionDeepLinkPlaceholder}.tsx`, `presentation/components/PermissionDeniedBanner.tsx` (CA-04.01.3, enlaza a ajustes del sistema con `Linking.openSettings()`), `presentation/stores/useSchedulingStore.ts`; rutas en `apps/mobile/app/schedule/*` y `apps/mobile/app/session/start.tsx` (placeholder, ver §1) | — |

## 3. Contratos

### Backend: extensión del mismo pipeline `sync` que F03, sin endpoint REST nuevo

**Cambio en `openapi.yaml` (contract-first, tarea `F04-T03`, mismo archivo que toca `F03-T03` — coordinar en una sola edición si ambas tareas corren en paralelo):**
```yaml
SyncEntity:
  enum: [profile, bodyMetric, routine, customExercise, scheduleSlot]   # F04 añade scheduleSlot
```
**Decisión: sí se sincroniza `ScheduleSlot`, con la misma justificación de costo marginal bajo que `routine`/`customExercise` en F03 (`specs/F03-editor-rutinas/plan.md` §3).** Beneficio adicional específico de F04: las notificaciones locales del SO **nunca** sobreviven una reinstalación (son artefactos del dispositivo, no del backend, sincronizar no cambia eso), pero `ScheduleSlot` sí puede sobrevivir si se sincroniza — y como `ReplanNotificationWindow` ya se ejecuta "al abrir la app" (diseño exigido por el propio límite de 7 días del SO, `spec.md` §"Diseño técnico relevante"), la reprogramación de notificaciones tras un `pull` de `sync` es automática y gratuita: no hace falta ningún mecanismo adicional. Esto se registra también en `spec.md` §"Preguntas abiertas", junto con la misma decisión de F03 (una sola confirmación del dueño de producto cubre ambas, ver `F04-T11`).

**Puertos nuevos (TypeScript, `scheduling/application/ports.ts`):**
```ts
interface ScheduleSlotRepository {
  save(slot: ScheduleSlot): Promise<Result<void, RepositoryError>>;
  listActive(): Promise<Result<ScheduleSlot[], RepositoryError>>;
  cancel(id: Id): Promise<Result<void, RepositoryError>>;
}
interface NotificationScheduler {
  requestPermission(): Promise<Result<"GRANTED" | "DENIED", NotificationError>>;
  getPermissionStatus(): Promise<"GRANTED" | "DENIED" | "UNDETERMINED">;
  schedule(notification: PlannedNotificationContent): Promise<Result<string, NotificationError>>; // string = id del SO
  cancel(osNotificationId: string): Promise<Result<void, NotificationError>>;
  cancelAll(): Promise<Result<void, NotificationError>>;
}
interface LastSessionQueryPort {
  // H2: solo `NullLastSessionAdapter` (siempre `null`). F05 (H3) añade la real.
  lastSessionFor(muscleGroup?: MuscleGroup): Promise<{ completedAt: Date; muscleGroups: MuscleGroup[] } | null>;
}
interface RoutineSummaryLookupPort {
  summarize(routineId: Id): Promise<Result<{ estimatedDurationSeconds: number; name: string }, LookupError>>;
}
```
`RoutineSummaryLookupPort` se implementa en `composition/container.ts` delegando en `routines.getRoutineDetail` + `estimateRoutineDurationSeconds` (reutilizado, no reimplementado) — mismo patrón `RoutineProposalPort`/`ExerciseDisplayLookupPort` ya usado dos veces en H1/H2. **No se importa nada de `features/routines` directamente desde `scheduling`.**

**API pública (`features/scheduling/index.ts`):** `createSchedulingContainer(deps)` expone `scheduleRoutine`, `updateSlot`, `cancelSlot`, `replanNotificationWindow`, `postponeNotification`, `skipToday`, `requestNotificationPermission`, `updateSchedulingPreferences`, y `createScheduleSlotsFromProposal` (uso exclusivo de `composition/container.ts` al suscribirse a `RoutinesCreatedFromProposal`).

**Eventos de dominio:**
| Evento | Payload | Emisor | Consumidores previstos |
|---|---|---|---|
| `RoutineScheduled` | `{scheduleSlotId, routineId, daysOfWeek, startTime}` | `ScheduleRoutine`, `CreateScheduleSlotsFromProposal` | `sync` (encola outbox, `entity: "scheduleSlot"`); F07 (racha, H4, futuro) |
| `SlotCancelled` | `{scheduleSlotId}` | `CancelSlot` | `sync` |
| `NotificationPostponed` | `{scheduleSlotId, newFireAt, postponeCountToday}` | `PostponeNotification` | Ninguno obligatorio en H2 |

### Decisión de alcance: `SchedulingPreferences` no reutiliza la clase `Preferences` completa de `05-modelo-dominio-reglas.md`

`Preferences` en el modelo de dominio agrupa configuración de tema/mascota/sonido (F08, no planificado todavía) con la de notificaciones (F04). Construir esa entidad completa ahora obligaría a anticipar el diseño de F08 sin necesidad. F04 introduce su propio VO `SchedulingPreferences` (solo los campos que RN-13/RN-16 exigen: `quietHoursStart`, `quietHoursEnd`, `maxNotificationsPerDay`, `minHoursBetweenRoutines`, `minHoursSameMuscle`), persistido en su propia tabla (`scheduling_preferences`, fila única). Cuando F08 se planifique, su arquitecto decide si consolida esto en una pantalla de ajustes común (cambio de presentación, no necesariamente de dominio) — no bloquea a F04 ni requiere tocar este módulo por adelantado (Art. 9.1).

## 4. Datos

**Móvil (Drizzle, ampliación de `shared/infrastructure/db/schema.ts`):**
- `schedule_slots`: `id` (uuid pk), `routine_id`, `days_of_week` (json, array de 1-7), `start_time` (`HH:mm`), `reminder_offset_min`, `active` (bool), `updated_at`, `deleted_at` (nullable).
- `planned_notifications`: `id` (uuid pk), `schedule_slot_id` (fk), `type` (`PRE_REMINDER`|`START`|`EXPECTED_END`|`MISSED`), `fire_at`, `os_notification_id` (nullable — null si se descartó por horas de silencio/límite diario sin reprogramar), `delivered` (bool) — permite a `ReplanNotificationWindow` saber qué cancelar en el SO antes de reprogramar.
- `scheduling_preferences`: fila única `{quiet_hours_start, quiet_hours_end, max_notifications_per_day, min_hours_between_routines, min_hours_same_muscle, updated_at}`.
- `postpone_counters`: `{date (pk), schedule_slot_id (pk), count}`.
- `schedule_slots`/`scheduling_preferences` con `updated_at`/`deleted_at` para LWW (RN-18); `planned_notifications`/`postpone_counters` son **100 % locales, nunca se sincronizan** (son artefactos derivados/del dispositivo — se recalculan enteros con `ReplanNotificationWindow` tras cada `pull`, igual que ya se explica en §3).

**Backend (Flyway, módulo `training`, mismo módulo de F03):**
- `db/migration/training/V2__create_schedule_slot_table.sql` → `training_schedule_slots` (numeración `V2` porque `V1` ya la crea F03 para `training_user_routines` y afines — coordinar el orden real de merge entre `F03-T14` y `F04-T10`, documentado como dependencia en `tasks.md`).
- Sin tabla para notificaciones ni contadores de posposición (locales por diseño, ver arriba).

## 5. Estrategia de pruebas

| CA | Nivel | Archivo de prueba previsto |
|---|---|---|
| CA-04.01.1 (programar recurrencia) | Aplicación | `application/__tests__/ScheduleRoutine.test.ts` |
| CA-04.02.1 (recordatorio previo) | Dominio (tabla de casos) | `domain/__tests__/NotificationPlanner.preReminder.test.ts` |
| CA-04.03.1 (aviso de fin estimado, cancela si termina antes) | Dominio + Aplicación | `domain/__tests__/NotificationPlanner.expectedEnd.test.ts`, `application/__tests__/ReplanNotificationWindow.cancel.test.ts` |
| CA-04.04.1 (tiempo mínimo entre rutinas) | Dominio | `domain/__tests__/RestRuleChecker.minHours.test.ts` (con `lastSessionInfo` inyectado, sin el puerto) |
| CA-04.04.2 (mismo grupo muscular + alternativa) | Dominio + Aplicación | `domain/__tests__/RestRuleChecker.sameMuscle.test.ts`; `application/__tests__/ScheduleRoutine.alternative.test.ts` (heurística acotada, ver §1 punto 3) |
| CA-04.05.1 (posponer, tope 3/día) | Aplicación | `application/__tests__/PostponeNotification.test.ts` (tabla: 1º, 2º, 3º, 4º intento del día) |
| CA-04.06.1 (horas de silencio, cruce de medianoche) | Dominio (tabla de casos) | `domain/__tests__/NotificationPlanner.quietHours.test.ts` (incluye el caso 22:00–07:00 que cruza medianoche) |
| CA-04.06.2 (límite diario, RN-16 exime recordatorios de sesión) | Dominio | `domain/__tests__/NotificationPlanner.dailyCap.test.ts` (verifica explícitamente que `PRE_REMINDER`/`START`/`EXPECTED_END` nunca cuentan para el tope, solo `MISSED` y tipos futuros no exentos) |
| CA-04.01.2 (reprogramación coherente al editar/eliminar) | Aplicación | `application/__tests__/ReplanNotificationWindow.onSlotChange.test.ts` (con `FakeNotificationScheduler`, nunca el SO real) |
| CA-04.01.3 (permiso denegado) | Aplicación + Componente | `application/__tests__/RequestNotificationPermission.denied.test.ts`, `presentation/components/__tests__/PermissionDeniedBanner.test.tsx` |
| CA-02.04.3 (cierre, ver plan §1) | Aplicación | `application/__tests__/CreateScheduleSlotsFromProposal.test.ts` |
| — (ventana móvil de 7 días, ADR-010) | Dominio, basado en propiedades | `domain/__tests__/NotificationPlanner.window.property.test.ts` (`fast-check`: nunca hay una `PlannedNotification` con `fireAt` fuera de `[now, now+7d]`; nunca se exceden 64 pendientes) |
| — (deep link) | Dominio + Componente | `domain/__tests__/deepLink.test.ts`, `presentation/screens/__tests__/SessionDeepLinkPlaceholder.test.tsx` |
| Backend | Integración | `training/adapters/in/sync/ScheduleSlotSyncEntityHandlerTest.java` (Testcontainers PostgreSQL) |
| Arquitectura | — | `dependency-cruiser` (ya lista `scheduling` en `FEATURES`, sin cambios necesarios); ArchUnit/Modulith backend (genéricos) |

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Límite de notificaciones locales pendientes del SO (64 en iOS) superado si se programan más de 7 días o demasiadas por slot | `NotificationPlanner` solo considera los próximos 7 días (ver ADR-010) y `ReplanNotificationWindow` cancela explícitamente lo obsoleto antes de reprogramar; propiedad verificada con `fast-check` (§5) |
| `LastSessionQueryPort` con *stub* en H2 podría interpretarse como que RN-13 "no funciona" | Documentado explícitamente en §1, §6 y en `spec.md` §"Preguntas abiertas"; el comportamiento por defecto es seguro (nunca advierte de más, solo deja de advertir cuando debería) — se cierra por completo en H3 sin tocar código de F04 |
| Pantalla placeholder de sesión (`SessionDeepLinkPlaceholder`) podría quedar olvidada y nunca reemplazarse en H3 | Comentario explícito en el archivo (mismo patrón que `NotificationsPermission.tsx` de F01) + entrada en el roadmap de F05 cuando se planifique; `qa-pruebas` la incluye en la matriz de trazabilidad como "parcial, pendiente de F05" |
| Cambiar `app.json.expo.scheme` de `"mobile"` a `"fitapp"` podría romper un build EAS ya configurado con el scheme anterior | Verificado que no hay publicación en tiendas todavía (§1); se coordina con quien tenga acceso a EAS antes de mergear `F04-T02`, y se documenta el cambio en `CHANGELOG.md` |
| Coordinación de dos migraciones Flyway (`training/V1` de F03, `training/V2` de F04) y dos ediciones de `openapi.yaml` (`F03-T03`/`F04-T03`) en paralelo podría generar conflictos de merge | Documentado explícitamente en §4 y en `tasks.md`; se recomienda mergear `F03-T03`/`F03-T14` antes de iniciar `F04-T03`/`F04-T10` si ambas features no se implementan estrictamente en paralelo por la misma persona |
| Heurística acotada de "rutina alternativa" (CA-04.04.2) podría sentirse pobre frente a lo que sugiere la redacción literal del escenario | Decisión de alcance documentada en §1 punto 3; no bloquea la CA (la advertencia y la sugerencia existen, solo con una heurística simple); se puede mejorar en una ronda futura sin romper el puerto `RestRuleChecker` |

## 7. ADR requeridos

**Sí: ADR-010 (número tentativo) — "Ventana móvil de 7 días para notificaciones locales programadas (límite de 64 pendientes en iOS), con replanificación al abrir la app y en cada cambio de programación."** Justificación: es una política no trivial (qué se cancela, qué se reprograma, cómo se evita duplicar notificaciones ya entregadas) que condiciona directamente la fiabilidad del producto y no está cubierta por ningún ADR existente. **No se redacta en esta ronda**; queda como tarea `F04-T01` en `tasks.md`, a cargo de `arquitecto`, bloqueante de `F04-T06` (implementación de `NotificationPlanner`/`ReplanNotificationWindow`).

El resto de F04 aplica sin ADR adicional: ADR-002/ADR-007 (sync + LWW) para `scheduleSlot`, ADR-004 (contract-first) para `openapi.yaml`. La adopción de `expo-notifications` ya estaba prevista explícitamente en la tabla de stack de `04-arquitectura.md` §2 ("Notificaciones | expo-notifications | Programación local, acciones y categorías"), así que no requiere su propio ADR de selección de librería — solo el ADR-010 de política, que es la parte realmente no trivial.

## 8. Feature flags

Ninguno. F04 es MVP v1.0 completo según `01-vision-alcance-roadmap.md` §5 (sincronización con el calendario del sistema queda fuera de alcance, v1.1, sin necesidad de flag).
