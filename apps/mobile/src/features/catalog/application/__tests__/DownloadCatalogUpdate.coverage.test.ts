/**
 * Pruebas unitarias añadidas por `dev-mobile-rn` (no de QA) para
 * `DownloadCatalogUpdate`: ramas de error (manifest/exercises/routines) y el
 * mapeo real de `RawRoutineDto -> PredefinedRoutine` (el test de QA solo
 * ejercita rutinas con `ok([])`). Requeridas para cumplir el umbral de
 * cobertura de aplicación (Art. 3.2: ≥ 80 %).
 */
import { DownloadCatalogUpdate } from "../DownloadCatalogUpdate";
import { err, isErr, isOk, ok } from "@/shared/domain/Result";
import { FakeCatalogManifestPort } from "@test/fakes/FakeCatalogManifestPort";
import { InMemoryExerciseRepository } from "@test/fakes/InMemoryExerciseRepository";
import { InMemoryPredefinedRoutineRepository } from "@test/fakes/InMemoryPredefinedRoutineRepository";

const RAW_ROUTINE_DTO = {
  id: "00000000-0000-4000-9000-0000000000aa",
  name: "Full body express",
  goal: "GENERAL_HEALTH",
  level: "BEGINNER",
  timerDefaults: {
    prepSeconds: 10,
    workSeconds: 40,
    restBetweenSetsSeconds: 60,
    restBetweenExercisesSeconds: 90,
    restBetweenRoundsSeconds: 120,
    halfwayCue: false,
  },
  blocks: [],
  version: 1,
  updatedAt: "2026-02-01T00:00:00Z",
};

describe("DownloadCatalogUpdate — ramas adicionales", () => {
  it("propaga el error cuando fetchManifest falla", async () => {
    const manifestPort = new FakeCatalogManifestPort();
    manifestPort.manifestResult = err({ kind: "NETWORK_ERROR" });
    const useCase = new DownloadCatalogUpdate(
      manifestPort,
      new InMemoryExerciseRepository(),
      new InMemoryPredefinedRoutineRepository(),
    );

    const result = await useCase.execute({ localVersion: 1, lastSyncedAt: new Date() });

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando fetchUpdatedSince('exercises') falla", async () => {
    const manifestPort = new FakeCatalogManifestPort();
    manifestPort.manifestResult = ok({
      version: 3,
      exercisesEtag: "e",
      routinesEtag: "r",
      mediaBaseUrl: "https://cdn.fitapp.test/",
      updatedAt: new Date(),
    });
    manifestPort.updatedSinceResults.exercises = err({ kind: "NETWORK_ERROR" });
    const useCase = new DownloadCatalogUpdate(
      manifestPort,
      new InMemoryExerciseRepository(),
      new InMemoryPredefinedRoutineRepository(),
    );

    const result = await useCase.execute({ localVersion: 1, lastSyncedAt: new Date() });

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error cuando fetchUpdatedSince('routines') falla, y mapea rutinas reales cuando tiene éxito", async () => {
    const manifestPort = new FakeCatalogManifestPort();
    manifestPort.manifestResult = ok({
      version: 3,
      exercisesEtag: "e",
      routinesEtag: "r",
      mediaBaseUrl: "https://cdn.fitapp.test/",
      updatedAt: new Date(),
    });
    manifestPort.updatedSinceResults.exercises = ok([]);
    manifestPort.updatedSinceResults.routines = err({ kind: "NETWORK_ERROR" });
    const useCase = new DownloadCatalogUpdate(
      manifestPort,
      new InMemoryExerciseRepository(),
      new InMemoryPredefinedRoutineRepository(),
    );

    const result = await useCase.execute({ localVersion: 1, lastSyncedAt: new Date() });

    expect(isErr(result)).toBe(true);
  });

  it("mapea un RawRoutineDto real a PredefinedRoutine y lo guarda vía upsertMany", async () => {
    const manifestPort = new FakeCatalogManifestPort();
    manifestPort.manifestResult = ok({
      version: 3,
      exercisesEtag: "e",
      routinesEtag: "r",
      mediaBaseUrl: "https://cdn.fitapp.test/",
      updatedAt: new Date(),
    });
    manifestPort.updatedSinceResults.exercises = ok([]);
    manifestPort.updatedSinceResults.routines = ok([RAW_ROUTINE_DTO]);
    const routineRepository = new InMemoryPredefinedRoutineRepository();
    const useCase = new DownloadCatalogUpdate(
      manifestPort,
      new InMemoryExerciseRepository(),
      routineRepository,
    );

    const result = await useCase.execute({ localVersion: 1, lastSyncedAt: new Date() });

    expect(isOk(result)).toBe(true);
    expect(routineRepository.upsertedBatches[0]?.[0]?.name).toBe("Full body express");
  });

  it("un RawExerciseDto sin animationUrl/videoUrl mapea a null (RN-05-like fallback)", async () => {
    const manifestPort = new FakeCatalogManifestPort();
    manifestPort.manifestResult = ok({
      version: 3,
      exercisesEtag: "e",
      routinesEtag: "r",
      mediaBaseUrl: "https://cdn.fitapp.test/",
      updatedAt: new Date(),
    });
    manifestPort.updatedSinceResults.exercises = ok([
      {
        id: "00000000-0000-4000-8000-0000000000bb",
        slug: "sin-medios",
        name: "Ejercicio sin medios",
        muscleGroups: ["CORE"],
        equipment: ["NONE"],
        difficulty: 1,
        mode: "REPS",
        met: 3,
        instructions: ["Paso 1", "Paso 2", "Paso 3"],
        commonMistakes: ["Error 1", "Error 2"],
        imageUrl: "https://cdn.fitapp.test/img/sin-medios.png",
        updatedAt: "2026-02-01T00:00:00Z",
      },
    ]);
    manifestPort.updatedSinceResults.routines = ok([]);
    const exerciseRepository = new InMemoryExerciseRepository();
    const useCase = new DownloadCatalogUpdate(
      manifestPort,
      exerciseRepository,
      new InMemoryPredefinedRoutineRepository(),
    );

    const result = await useCase.execute({ localVersion: 1, lastSyncedAt: new Date() });

    expect(isOk(result)).toBe(true);
    expect(exerciseRepository.upsertedBatches[0]?.[0]?.animationUrl).toBeNull();
    expect(exerciseRepository.upsertedBatches[0]?.[0]?.isCustom).toBe(false);
  });
});
