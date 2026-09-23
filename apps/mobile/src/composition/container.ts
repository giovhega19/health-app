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
import { createCatalogContainer } from "@/features/catalog";
import type { ProfileSnapshot, WeeklyPlanSummary } from "@/features/catalog";
import { createProfileContainer } from "@/features/profile";
import type { AuthSession, RoutineProposalPort } from "@/features/profile";
import { createSyncContainer } from "@/features/sync";

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

import { SqliteOutboxRepository } from "@/features/sync/infrastructure/SqliteOutboxRepository";
import { SqliteCursorStore } from "@/features/sync/infrastructure/SqliteCursorStore";
import { HttpSyncAdapter } from "@/features/sync/infrastructure/HttpSyncAdapter";

const DEVICE_ID_KEY = "fitapp.device.id";

export interface AppContainer {
  profile: ReturnType<typeof createProfileContainer>;
  catalog: ReturnType<typeof createCatalogContainer>;
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

  // --- sync --------------------------------------------------------------
  const outboxRepository = new SqliteOutboxRepository(db, clock);
  const transport = new HttpSyncAdapter(API_BASE_URL, getAccessToken);
  const cursorStore = new SqliteCursorStore(db, clock);
  const profileSyncApplier = new ProfileSyncEntityApplier(profileRepository, bodyMetricRepository);

  const sync = createSyncContainer({
    outboxRepository,
    transport,
    cursorStore,
    deviceId,
    entityAppliers: [profileSyncApplier],
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

  return { profile, catalog, sync, eventBus, clock };
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
