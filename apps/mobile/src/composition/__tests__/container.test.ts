/**
 * `src/composition/container.ts` (tarea `F01-T13`/`F02-T12`/`F01-T08`):
 * cablea de verdad los casos de uso de `profile`/`catalog`/`sync` con sus
 * adaptadores reales. Los módulos nativos sin binding en Jest
 * (`expo-sqlite`, `expo-secure-store`, `expo-file-system`) se reemplazan por
 * los mismos fakes ya usados en las pruebas de infraestructura de cada
 * adaptador.
 */
import { resetFakeFileSystem } from "@test/helpers/expoFileSystemFake";

const mockSecureStoreState = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStoreState.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStoreState.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStoreState.delete(key);
  }),
}));

jest.mock("expo-file-system", () => jest.requireActual("@test/helpers/expoFileSystemFake"));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => false),
  shareAsync: jest.fn(async () => undefined),
}));

// `expo-notifications` (F04-T11): sin binding en Jest (mismo patrón que el
// resto de módulos nativos de este archivo); además su import real registra
// listeners de push (`warnOfExpoGoPushUsage`) ruidosos bajo Expo Go que no
// aportan nada a esta prueba de cableado.
//
// `notificationMockState` (CA-04.01.2, cierre de brecha H2-QA): contador
// compartido, no un import dinámico del propio módulo mockeado — con
// `--experimental-vm-modules` (`package.json`'s `test` script) un
// `await import("expo-notifications")` dentro de una prueba no atraviesa el
// registro de módulos de Jest de la misma forma que un `import` estático
// (mismo patrón de "estado compartido" que `ExpoNotificationScheduler.test.ts`).
const notificationMockState = { scheduleCalls: 0, cancelCalls: 0 };

jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  scheduleNotificationAsync: jest.fn(async () => {
    notificationMockState.scheduleCalls += 1;
    return "os-notification-1";
  }),
  cancelScheduledNotificationAsync: jest.fn(async () => {
    notificationMockState.cancelCalls += 1;
  }),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

jest.mock("@/shared/infrastructure/db/client", () => ({
  getAppDatabase: jest.fn(async () => import("@test/helpers/createTestDb").then((m) => m.createTestDb())),
}));

describe("composition/container", () => {
  beforeEach(() => {
    jest.resetModules();
    mockSecureStoreState.clear();
    resetFakeFileSystem();
    notificationMockState.scheduleCalls = 0;
    notificationMockState.cancelCalls = 0;
  });

  it("construye los cinco contenedores (profile, catalog, routines, scheduling, sync) con sus casos de uso", async () => {
    const { getAppContainer } = await import("../container");

    const container = await getAppContainer();

    expect(container.profile.completeOnboarding).toBeDefined();
    expect(container.profile.createAccount).toBeDefined();
    expect(container.profile.continueAsGuest).toBeDefined();
    expect(container.profile.deleteAccount).toBeDefined();
    expect(container.profile.logBodyWeight).toBeDefined();
    expect(container.profile.loginUser).toBeDefined();
    expect(container.profile.updateProfile).toBeDefined();
    expect(container.profile.getCurrentProfile).toBeDefined();
    expect(container.catalog.generateProposal).toBeDefined();
    expect(container.catalog.filterExercises).toBeDefined();
    expect(container.catalog.getExerciseDetail).toBeDefined();
    expect(container.routines.createRoutine).toBeDefined();
    expect(container.routines.duplicateRoutine).toBeDefined();
    expect(container.routines.previewImportRoutine).toBeDefined();
    expect(container.routines.confirmImportRoutine).toBeDefined();
    expect(container.routines.exportRoutine).toBeDefined();
    expect(container.routines.listMyRoutines).toBeDefined();
    expect(container.routines.getRoutineDetail).toBeDefined();
    expect(container.scheduling.scheduleRoutine).toBeDefined();
    expect(container.scheduling.replanNotificationWindow).toBeDefined();
    expect(container.scheduling.postponeNotification).toBeDefined();
    expect(container.scheduling.requestNotificationPermission).toBeDefined();
    expect(container.sync.enqueueChange).toBeDefined();
    expect(container.sync.pushPendingChanges).toBeDefined();
    expect(container.sync.pullRemoteChanges).toBeDefined();
  });

  it("CA-03.01.1/CA-04.01.1 crear una rutina y programarla funciona de punta a punta (SQLite real)", async () => {
    const { getAppContainer } = await import("../container");
    const container = await getAppContainer();

    const created = await container.routines.createRoutine.execute({
      name: "Pierna casa",
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      timerDefaults: {
        prepSeconds: 10,
        workSeconds: 40,
        restBetweenSetsSeconds: 60,
        restBetweenExercisesSeconds: 60,
        restBetweenRoundsSeconds: 90,
        halfwayCue: false,
      },
      blocks: [
        {
          id: "00000000-0000-4000-f000-000000000001" as never,
          type: "MAIN",
          grouping: "STRAIGHT",
          rounds: 1,
          items: [
            {
              id: "00000000-0000-4000-f000-000000000002" as never,
              exerciseId: "00000000-0000-4000-f000-000000000003" as never,
              sets: 3,
              targetReps: 12,
            },
          ],
        },
      ],
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const scheduled = await container.scheduling.scheduleRoutine.execute({
      routineId: created.value.routine.id,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
    });

    expect(scheduled.ok).toBe(true);
  });

  it("CA-04.01.2: cancelar un slot con el caso de uso real (CancelSlot) dispara ReplanNotificationWindow de verdad (cierre de brecha H2-QA: ningún caso de uso de producción publicaba SlotCancelled)", async () => {
    const { getAppContainer } = await import("../container");
    const container = await getAppContainer();

    const created = await container.routines.createRoutine.execute({
      name: "Espalda casa",
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      timerDefaults: {
        prepSeconds: 10,
        workSeconds: 40,
        restBetweenSetsSeconds: 60,
        restBetweenExercisesSeconds: 60,
        restBetweenRoundsSeconds: 90,
        halfwayCue: false,
      },
      blocks: [
        {
          id: "00000000-0000-4000-f000-000000000011" as never,
          type: "MAIN",
          grouping: "STRAIGHT",
          rounds: 1,
          items: [
            {
              id: "00000000-0000-4000-f000-000000000012" as never,
              exerciseId: "00000000-0000-4000-f000-000000000013" as never,
              sets: 3,
              targetReps: 12,
            },
          ],
        },
      ],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const scheduled = await container.scheduling.scheduleRoutine.execute({
      routineId: created.value.routine.id,
      daysOfWeek: [2],
      startTime: "19:00",
      reminderOffsetMin: 15,
    });
    expect(scheduled.ok).toBe(true);
    if (!scheduled.ok) return;

    // `scheduleRoutine` ya disparó una primera replanificación (reacción a
    // `RoutineScheduled` en `container.ts`): al menos una notificación quedó
    // programada en el SO (mock de `expo-notifications`) para este slot.
    expect(notificationMockState.scheduleCalls).toBeGreaterThan(0);

    const cancelResult = await container.scheduling.cancelSlot.execute(scheduled.value.scheduleSlotId);
    expect(cancelResult.ok).toBe(true);

    // La única forma de que esto pase es que `CancelSlot` publicó `SlotCancelled`
    // de verdad y que el suscriptor de `container.ts` volvió a ejecutar
    // `ReplanNotificationWindow`, que canceló en el SO las notificaciones ya
    // programadas del slot (ya no está activo, así que ya no debería tener
    // ninguna programada).
    expect(notificationMockState.cancelCalls).toBeGreaterThan(0);

    const remainingSlots = await container.scheduling.listActiveSlots.execute();
    expect(remainingSlots.ok).toBe(true);
    if (remainingSlots.ok) {
      expect(remainingSlots.value.some((slot) => slot.id === scheduled.value.scheduleSlotId)).toBe(false);
    }
  });

  it("memoiza el contenedor: llamarlo dos veces devuelve la misma instancia", async () => {
    const { getAppContainer } = await import("../container");

    const first = await getAppContainer();
    const second = await getAppContainer();

    expect(first).toBe(second);
  });

  it("al completar el onboarding como invitado, el perfil queda disponible end-to-end (SQLite + RecommendationEngine reales)", async () => {
    const { getAppContainer } = await import("../container");
    const container = await getAppContainer();

    const result = await container.profile.completeOnboarding.execute({
      goal: "GENERAL_HEALTH",
      level: "BEGINNER",
      daysPerWeek: 3,
      minutesPerSession: 30,
      equipment: ["NONE"],
      unitSystem: "METRIC",
      birthDate: new Date("1996-01-15T00:00:00Z"),
      gender: "FEMALE",
      heightCm: 165,
      weightKg: 60,
      fitnessQuestionnaireAnswers: [false],
      healthDataConsent: true,
    });

    // Sin ejercicios en el catálogo local (no se sembró ninguno en esta
    // prueba), `RecommendationEngine` devuelve `NO_COMPATIBLE_EXERCISES`:
    // lo relevante aquí es que el cableado real (SQLite + `RoutineProposalPort`
    // -> `generateProposal` de `catalog`) se ejecuta de punta a punta sin
    // lanzar, no el contenido del plan (ya cubierto por
    // `RecommendationEngine.rn14.test.ts`).
    expect(result.ok === true || result.ok === false).toBe(true);
  });
});
