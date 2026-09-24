/**
 * Composition root de la app (04-arquitectura.md §3.4, decisión 1): aquí se
 * construyen los adaptadores de infraestructura y se inyectan en los casos
 * de uso de `application`, con funciones fábrica (sin librería de DI). En
 * las pruebas, este archivo se sustituye por fakes/mocks (nunca se importa
 * desde pruebas de dominio/aplicación).
 *
 * H1 (F01/F02): primer cableado real. `getAppContainer()` es async porque
 * abrir la base de datos local (`expo-sqlite`) y leer/generar el id de
 * dispositivo son operaciones asíncronas; se memoiza para que solo se
 * construya una vez por proceso (`app/_layout.tsx` la invoca al arrancar).
 */
import { getAppDatabase } from "@/shared/infrastructure/db/client";
import { InMemoryEventBus } from "@/shared/infrastructure/event-bus";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { SecureStoreAdapter } from "@/shared/infrastructure/secure-storage";
import { API_BASE_URL } from "@/shared/infrastructure/http/config";
import { asId, generateId } from "@/shared/domain/Id";
import { isOk, err, ok } from "@/shared/domain/Result";
import { estimateRoutineDurationSeconds } from "@/shared/domain/routineDuration";
import type { TimerSettings } from "@/shared/domain/TimerSettings";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import { createCatalogContainer } from "@/features/catalog";
import type { ProfileSnapshot, ProposalAcceptedEvent, WeeklyPlanSummary } from "@/features/catalog";
import { createProfileContainer } from "@/features/profile";
import type { AuthSession, RoutineProposalPort } from "@/features/profile";
import { createSyncContainer } from "@/features/sync";
import { createRoutinesContainer } from "@/features/routines";
import type { ExerciseDisplayLookupPort } from "@/features/routines";
import { createSchedulingContainer } from "@/features/scheduling";
import type { RoutineSummaryLookupPort } from "@/features/scheduling";
import { purgeLocalDataOnAccountDeletion } from "./purgeLocalDataOnAccountDeletion";

import { SqliteProfileRepository } from "@/features/profile/infrastructure/SqliteProfileRepository";
import { SqliteBodyMetricRepository } from "@/features/profile/infrastructure/SqliteBodyMetricRepository";
import { HttpAuthAdapter } from "@/features/profile/infrastructure/HttpAuthAdapter";
import { HttpProfileAdapter } from "@/features/profile/infrastructure/HttpProfileAdapter";
import { SecureTokenStorage } from "@/features/profile/infrastructure/SecureTokenStorage";
import { ProfileSyncEntityApplier } from "@/features/profile/infrastructure/ProfileSyncEntityApplier";

import { SqliteExerciseRepository } from "@/features/catalog/infrastructure/SqliteExerciseRepository";
import { SqlitePredefinedRoutineRepository } from "@/features/catalog/infrastructure/SqlitePredefinedRoutineRepository";
import { HttpCatalogAdapter } from "@/features/catalog/infrastructure/HttpCatalogAdapter";
import { MediaCacheAdapter } from "@/features/catalog/infrastructure/MediaCacheAdapter";
import { seedDevCatalogIfEmpty } from "@/features/catalog/infrastructure/seed/seedDevCatalog";

import { SqliteUserRoutineRepository } from "@/features/routines/infrastructure/SqliteUserRoutineRepository";
import { SqliteCustomExerciseRepository } from "@/features/routines/infrastructure/SqliteCustomExerciseRepository";
import { ExpoFileGateway } from "@/features/routines/infrastructure/ExpoFileGateway";
import { RoutineSyncEntityApplier } from "@/features/routines/infrastructure/RoutineSyncEntityApplier";

import { SqliteScheduleSlotRepository } from "@/features/scheduling/infrastructure/SqliteScheduleSlotRepository";
import { SqlitePlannedNotificationRepository } from "@/features/scheduling/infrastructure/SqlitePlannedNotificationRepository";
import { SqliteSchedulingPreferencesRepository } from "@/features/scheduling/infrastructure/SqliteSchedulingPreferencesRepository";
import { SqlitePostponeCounterRepository } from "@/features/scheduling/infrastructure/SqlitePostponeCounterRepository";
import { ExpoNotificationScheduler } from "@/features/scheduling/infrastructure/ExpoNotificationScheduler";
import { NullLastSessionAdapter } from "@/features/scheduling/infrastructure/NullLastSessionAdapter";
import { ScheduleSlotSyncEntityApplier } from "@/features/scheduling/infrastructure/ScheduleSlotSyncEntityApplier";

import { SqliteOutboxRepository } from "@/features/sync/infrastructure/SqliteOutboxRepository";
import { SqliteCursorStore } from "@/features/sync/infrastructure/SqliteCursorStore";
import { HttpSyncAdapter } from "@/features/sync/infrastructure/HttpSyncAdapter";

const DEVICE_ID_KEY = "fitapp.device.id";

/**
 * Valores por defecto de temporizador a nivel de app (RN-05, tercer nivel de
 * precedencia tras `RoutineItem.timerOverrides` y `Routine.timerDefaults`,
 * `shared/domain/routineDuration.ts`). `Preferences` globales configurables
 * llegan con una feature futura (F08); hasta entonces estos son los valores
 * fijos que usan `routines`/`scheduling` (F03/F04, H2).
 */
const APP_TIMER_DEFAULTS: TimerSettings = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 60,
  restBetweenRoundsSeconds: 90,
  halfwayCue: false,
};

export interface AppContainer {
  profile: ReturnType<typeof createProfileContainer>;
  catalog: ReturnType<typeof createCatalogContainer>;
  routines: ReturnType<typeof createRoutinesContainer>;
  scheduling: ReturnType<typeof createSchedulingContainer>;
  sync: ReturnType<typeof createSyncContainer>;
  eventBus: InMemoryEventBus;
  /**
   * Expuesto para que `presentation/` calcule valores derivados del "hoy"
   * (p. ej. IMC/TMB en la pantalla "Resumen") con la misma fuente de tiempo
   * que usan los casos de uso, en vez de que cada pantalla llame a
   * `new Date()` por su cuenta.
   */
  clock: SystemClock;
}

let containerPromise: Promise<AppContainer> | null = null;

export function getAppContainer(): Promise<AppContainer> {
  containerPromise ??= buildContainer();
  return containerPromise;
}

/** Solo para pruebas/composition en caliente (recarga de Metro). */
export function resetAppContainerCache(): void {
  containerPromise = null;
}

async function buildContainer(): Promise<AppContainer> {
  const db = await getAppDatabase();
  const clock = new SystemClock();
  const eventBus = new InMemoryEventBus();
  const secureStore = new SecureStoreAdapter();
  const tokenStorage = new SecureTokenStorage(secureStore);

  const getAccessToken = async (): Promise<string | null> => {
    const session = await tokenStorage.loadSession();
    return session?.accessToken ?? null;
  };

  const deviceId = await getOrCreateDeviceId(secureStore, clock);

  // --- catalog --------------------------------------------------------
  const exerciseRepository = new SqliteExerciseRepository(db, clock);
  const routineRepository = new SqlitePredefinedRoutineRepository(db, clock);
  const manifestPort = new HttpCatalogAdapter(API_BASE_URL);
  const mediaCachePort = new MediaCacheAdapter(db, clock);

  // Catálogo semilla de desarrollo (RF-02.05, tarea `F02-T09`): siembra las
  // tablas locales en el primer arranque para que la app funcione offline
  // desde el inicio (`specs/F02-catalogo-propuesta/plan.md` §1); idempotente
  // (no hace nada si ya hay ejercicios guardados).
  await seedDevCatalogIfEmpty(exerciseRepository, routineRepository);

  const catalog = createCatalogContainer({
    exerciseRepository,
    routineRepository,
    manifestPort,
    mediaCachePort,
  });

  // --- profile ---------------------------------------------------------
  const profileRepository = new SqliteProfileRepository(db, clock);
  const bodyMetricRepository = new SqliteBodyMetricRepository(db, clock);
  const authPort = new HttpAuthAdapter(API_BASE_URL, getAccessToken);
  const remoteProfilePort = new HttpProfileAdapter(API_BASE_URL, getAccessToken);

  // `RoutineProposalPort` (profile/application/ports.ts) se implementa con
  // `generateProposal` de `catalog`: único punto donde `profile` y `catalog`
  // se acoplan, por composición, nunca por import directo entre features
  // (`specs/F01-perfil-onboarding/plan.md` §1 "punto de integración único").
  const routineProposalPort: RoutineProposalPort = {
    propose: (snapshot: ProfileSnapshot) => catalog.generateProposal(snapshot),
  };

  const profile = createProfileContainer({
    profileRepository,
    bodyMetricRepository,
    authPort,
    tokenStoragePort: tokenStorage,
    routineProposalPort,
    remoteProfilePort,
    eventBus,
    clock,
  });

  // --- routines (F03) ---------------------------------------------------
  const userRoutineRepository = new SqliteUserRoutineRepository(db, clock);
  const customExerciseRepository = new SqliteCustomExerciseRepository(db, clock);
  const fileGateway = new ExpoFileGateway();

  // `ExerciseDisplayLookupPort` (`specs/F03-editor-rutinas/plan.md` §1 "Decisión
  // de diseño: ejercicios personalizados"): delega en `catalog.getExerciseDetail`
  // para `CATALOG` y en `customExerciseRepository` para `CUSTOM` — mismo patrón
  // que `RoutineProposalPort` (F01↔F02). Nunca importa internos de `catalog`.
  const exerciseDisplayLookupPort: ExerciseDisplayLookupPort = {
    resolve: async (ref) => {
      if (ref.source === "CATALOG") {
        const found = await catalog.getExerciseDetail.execute(ref.id);
        if (!isOk(found)) {
          return err({ kind: "NOT_FOUND" });
        }
        return ok({
          id: found.value.id,
          name: found.value.name,
          muscleGroups: found.value.muscleGroups,
          mode: found.value.mode,
        });
      }
      const found = await customExerciseRepository.findById(ref.id);
      if (!isOk(found) || !found.value) {
        return err({ kind: "NOT_FOUND" });
      }
      return ok({
        id: found.value.id,
        name: found.value.name,
        muscleGroups: found.value.muscleGroups,
        mode: found.value.mode,
      });
    },
  };

  const routines = createRoutinesContainer({
    routineRepository: userRoutineRepository,
    customExerciseRepository,
    fileGateway,
    exerciseDisplayLookupPort,
    eventBus,
    clock,
    appTimerDefaults: APP_TIMER_DEFAULTS,
  });

  // --- scheduling (F04) --------------------------------------------------
  const scheduleSlotRepository = new SqliteScheduleSlotRepository(db, clock);
  const plannedNotificationRepository = new SqlitePlannedNotificationRepository(db, clock);
  const schedulingPreferencesRepository = new SqliteSchedulingPreferencesRepository(db, clock);
  const postponeCounterRepository = new SqlitePostponeCounterRepository(db);
  const notificationScheduler = new ExpoNotificationScheduler();
  // RN-13 (`specs/F04-programacion-recordatorios/plan.md` §1 punto 1): stub
  // seguro de H2 — F05 (H3) sustituye este adaptador sin tocar `scheduling`.
  const lastSessionQueryPort = new NullLastSessionAdapter();

  // `RoutineSummaryLookupPort` (`specs/F04-programacion-recordatorios/plan.md`
  // §3): delega en `routines.getRoutineDetail` + `estimateRoutineDurationSeconds`
  // (reutilizado, no reimplementado). Resuelve también los grupos musculares
  // de la rutina (unión de los de cada ítem, vía `exerciseDisplayLookupPort`)
  // para que RN-13/CA-04.04.2 pueda comparar "mismo grupo muscular" con datos
  // reales. Nunca importa internos de `features/routines`.
  const routineSummaryLookupPort: RoutineSummaryLookupPort = {
    summarize: async (routineId) => {
      const found = await routines.getRoutineDetail.execute(routineId);
      if (!isOk(found)) {
        return err({ kind: "NOT_FOUND" });
      }
      const routine = found.value;
      const estimatedDurationSeconds = estimateRoutineDurationSeconds(
        { timerDefaults: routine.timerDefaults, blocks: routine.blocks },
        APP_TIMER_DEFAULTS,
      );
      const muscleGroups = await resolveRoutineMuscleGroups(routine.blocks, exerciseDisplayLookupPort);
      return ok({ id: routine.id, name: routine.name, estimatedDurationSeconds, muscleGroups });
    },
  };

  const scheduling = createSchedulingContainer({
    scheduleSlotRepository,
    plannedNotificationRepository,
    notificationScheduler,
    routineSummaryLookupPort,
    schedulingPreferencesRepository,
    postponeCounterRepository,
    lastSessionQueryPort,
    eventBus,
    clock,
  });

  // --- sync --------------------------------------------------------------
  const outboxRepository = new SqliteOutboxRepository(db, clock);
  const transport = new HttpSyncAdapter(API_BASE_URL, getAccessToken);
  const cursorStore = new SqliteCursorStore(db, clock);
  const profileSyncApplier = new ProfileSyncEntityApplier(profileRepository, bodyMetricRepository);
  const routineSyncApplier = new RoutineSyncEntityApplier(userRoutineRepository, customExerciseRepository);
  const scheduleSlotSyncApplier = new ScheduleSlotSyncEntityApplier(scheduleSlotRepository);

  const sync = createSyncContainer({
    outboxRepository,
    transport,
    cursorStore,
    deviceId,
    entityAppliers: [profileSyncApplier, routineSyncApplier, scheduleSlotSyncApplier],
  });

  // Encola en el outbox los eventos de dominio sincronizables (ADR-002,
  // acotado a `profile`/`bodyMetric` en H1, `specs/F01-perfil-onboarding/plan.md`
  // §3 tabla de eventos): la UI nunca espera a la red (Art. 7).
  eventBus.subscribe("BodyWeightLogged", async (event) => {
    const bodyWeightEvent = event as unknown as {
      profileId: string;
      weightKg: number;
      date: Date;
    };
    await sync.enqueueChange.execute(
      "bodyMetric",
      "upsert",
      asId(bodyWeightEvent.profileId),
      { weightKg: bodyWeightEvent.weightKg, date: bodyWeightEvent.date.toISOString() },
    );
  });
  eventBus.subscribe("ProfileUpdated", async (event) => {
    const profileUpdatedEvent = event as unknown as { profileId: string };
    await sync.enqueueChange.execute("profile", "upsert", asId(profileUpdatedEvent.profileId), null);
  });

  // F03 (`specs/F03-editor-rutinas/plan.md` §3 tabla de eventos): encola
  // `routine`/`customExercise` en el outbox al crear/editar/importar una
  // rutina. Se relee el agregado completo del repositorio (en vez de cargar
  // el payload en el propio evento) porque `RoutineCreated`/`RoutineUpdated`/
  // `RoutineImported` solo llevan `routineId` (Art. 9: eventos ligeros,
  // "device es la fuente de verdad", Art. 4.2).
  const enqueueRoutineChange = async (routineId: string): Promise<void> => {
    const found = await userRoutineRepository.findById(asId(routineId));
    if (!isOk(found) || !found.value) {
      return;
    }
    const routine = found.value;
    await sync.enqueueChange.execute("routine", "upsert", routine.id, {
      id: routine.id,
      name: routine.name,
      description: routine.description,
      goal: routine.goal,
      level: routine.level,
      source: routine.source,
      timerDefaults: routine.timerDefaults,
      blocks: routine.blocks,
      version: routine.version,
      updatedAt: routine.updatedAt.toISOString(),
      deletedAt: routine.deletedAt ? routine.deletedAt.toISOString() : null,
    });
  };
  eventBus.subscribe("RoutineCreated", async (event) => {
    await enqueueRoutineChange((event as unknown as { routineId: string }).routineId);
  });
  eventBus.subscribe("RoutineUpdated", async (event) => {
    await enqueueRoutineChange((event as unknown as { routineId: string }).routineId);
  });
  eventBus.subscribe("RoutineImported", async (event) => {
    await enqueueRoutineChange((event as unknown as { routineId: string }).routineId);
  });

  // F04 (`specs/F04-programacion-recordatorios/plan.md` §3 tabla de eventos):
  // encola `scheduleSlot` y dispara la replanificación de notificaciones
  // (ADR-010, disparador 2: "tras cualquier cambio de programación local").
  eventBus.subscribe("RoutineScheduled", async (event) => {
    const scheduledEvent = event as unknown as {
      scheduleSlotId: string;
      routineId: string;
      daysOfWeek: number[];
      startTime: string;
    };
    const found = await scheduleSlotRepository.findById(asId(scheduledEvent.scheduleSlotId));
    if (isOk(found) && found.value) {
      const slot = found.value;
      await sync.enqueueChange.execute("scheduleSlot", "upsert", slot.id, {
        id: slot.id,
        routineId: slot.routineId,
        daysOfWeek: slot.daysOfWeek,
        startTime: slot.startTime,
        reminderOffsetMin: slot.reminderOffsetMin,
        active: slot.active,
        updatedAt: slot.updatedAt.toISOString(),
        deletedAt: slot.deletedAt ? slot.deletedAt.toISOString() : null,
      });
    }
    await scheduling.replanNotificationWindow.execute();
  });
  eventBus.subscribe("SlotCancelled", async (event) => {
    const cancelledEvent = event as unknown as { scheduleSlotId: string };
    await sync.enqueueChange.execute("scheduleSlot", "delete", asId(cancelledEvent.scheduleSlotId), null);
    await scheduling.replanNotificationWindow.execute();
  });

  // Hallazgo de seguridad H2 ("Eliminar cuenta no purga datos locales de
  // rutinas/horarios ni cancela notificaciones"): `profile.deleteAccount`
  // (`features/profile/application/DeleteAccount.ts`) solo limpia sus
  // propios datos (perfil, peso, tokens) y publica `AccountDeleted` — `profile`
  // no puede tocar `routines`/`scheduling` directamente (Art. 2.5), así que
  // la purga del resto del dispositivo se cablea aquí, en el composition
  // root, igual que el `AccountDeletedListener` del backend (`training`
  // escuchando el borrado de `identity`). `InMemoryEventBus.publish` espera a
  // que este handler termine antes de resolver (`DeleteAccount.execute()`
  // hace `await eventBus.publish(...)`), así que al confirmar la eliminación
  // de cuenta el dispositivo ya quedó purgado por completo.
  eventBus.subscribe("AccountDeleted", async () => {
    await purgeLocalDataOnAccountDeletion({
      userRoutineRepository,
      customExerciseRepository,
      scheduleSlotRepository,
      plannedNotificationRepository,
      notificationScheduler,
    });
  });

  // Cierra CA-02.04.3 de punta a punta (`specs/F03-editor-rutinas/plan.md`
  // §1, `specs/F04-programacion-recordatorios/plan.md` §1): `catalog`
  // (`ProposalAccepted`) -> `routines` (`RoutinesCreatedFromProposal`) ->
  // `scheduling` (`ScheduleSlot` reales). Acoplamiento solo por evento +
  // composition root, nunca importando internos entre features (Art. 9.2).
  eventBus.subscribe("ProposalAccepted", async (event) => {
    await routines.createRoutinesFromProposal.execute(event as unknown as ProposalAcceptedEvent);
  });
  eventBus.subscribe("RoutinesCreatedFromProposal", async (event) => {
    const routinesCreatedEvent = event as unknown as {
      routines: { routineId: string; dayNumber: number; preferredTime: string }[];
    };
    await scheduling.createScheduleSlotsFromProposal.execute({
      routines: routinesCreatedEvent.routines.map((ref) => ({
        routineId: asId(ref.routineId),
        dayNumber: ref.dayNumber,
        preferredTime: ref.preferredTime,
      })),
    });
  });

  // ADR-010 "Decisión", disparador 1: replanifica la ventana móvil de 7 días
  // cada vez que se construye el contenedor (equivalente a "al abrir la
  // app"; `getAppContainer()` se memoiza por proceso).
  void scheduling.replanNotificationWindow.execute();

  return { profile, catalog, routines, scheduling, sync, eventBus, clock };
}

/**
 * Unión de los grupos musculares de todos los ítems de una rutina (RN-13,
 * CA-04.04.2): resuelve cada ítem vía `ExerciseDisplayLookupPort` (catálogo o
 * personalizado) y deduplica. Referencias que no se puedan resolver se
 * omiten (comportamiento seguro por defecto, nunca bloquea el cálculo).
 */
async function resolveRoutineMuscleGroups(
  blocks: { items: { exerciseId: string; exerciseSource?: "CATALOG" | "CUSTOM" }[] }[],
  exerciseDisplayLookupPort: ExerciseDisplayLookupPort,
): Promise<MuscleGroup[]> {
  const unique = new Set<MuscleGroup>();
  for (const block of blocks) {
    for (const item of block.items) {
      const resolved = await exerciseDisplayLookupPort.resolve({
        source: item.exerciseSource ?? "CATALOG",
        id: asId(item.exerciseId),
      });
      if (isOk(resolved)) {
        for (const muscleGroup of resolved.value.muscleGroups) {
          unique.add(muscleGroup);
        }
      }
    }
  }
  return [...unique];
}

async function getOrCreateDeviceId(
  secureStore: SecureStoreAdapter,
  clock: SystemClock,
): Promise<string> {
  const existing = await secureStore.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const generated = generateId(clock);
  await secureStore.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

export type { AuthSession, WeeklyPlanSummary };
