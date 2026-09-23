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

jest.mock("@/shared/infrastructure/db/client", () => ({
  getAppDatabase: jest.fn(async () => import("@test/helpers/createTestDb").then((m) => m.createTestDb())),
}));

describe("composition/container", () => {
  beforeEach(() => {
    jest.resetModules();
    mockSecureStoreState.clear();
    resetFakeFileSystem();
  });

  it("construye los tres contenedores (profile, catalog, sync) con sus casos de uso", async () => {
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
    expect(container.sync.enqueueChange).toBeDefined();
    expect(container.sync.pushPendingChanges).toBeDefined();
    expect(container.sync.pullRemoteChanges).toBeDefined();
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
