/**
 * RF-02.06 `DownloadCatalogUpdate`
 * (`features/catalog/application/DownloadCatalogUpdate.ts`, tarea `F02-T14`,
 * todavía no implementada: esta prueba falla ahora mismo con "Cannot find
 * module '../DownloadCatalogUpdate'", el estado rojo esperado).
 *
 * CA-02.06.1: si el manifest del servidor tiene una versión mayor que la
 * local, la app descarga solo los cambios (`updatedSince`) en segundo plano;
 * las rutinas del usuario que referencian ejercicios no se modifican. En H1
 * esto último se verifica a nivel de esquema (plan.md §5): la actualización
 * únicamente hace `UPSERT` sobre `exercises`/`predefined_routines`, nunca
 * sobre ninguna tabla de "Mis rutinas" (que no existe hasta F03/H2).
 */
import { DownloadCatalogUpdate } from "../DownloadCatalogUpdate";
import { isOk, ok } from "@/shared/domain/Result";
import { FakeCatalogManifestPort } from "@test/fakes/FakeCatalogManifestPort";
import { InMemoryExerciseRepository } from "@test/fakes/InMemoryExerciseRepository";
import { InMemoryPredefinedRoutineRepository } from "@test/fakes/InMemoryPredefinedRoutineRepository";

const RAW_EXERCISE_DTO = {
  id: "00000000-0000-4000-8000-000000000099",
  slug: "burpee",
  name: "Burpee",
  muscleGroups: ["CARDIO"],
  equipment: ["NONE"],
  difficulty: 2,
  mode: "REPS",
  met: 8,
  instructions: [
    "Agáchate y apoya las manos.",
    "Salta hacia atrás a plancha.",
    "Salta de vuelta y salta hacia arriba.",
  ],
  commonMistakes: ["No extender la cadera al saltar.", "Perder la alineación de la espalda."],
  imageUrl: "https://cdn.fitapp.test/img/burpee.png",
  animationUrl: "https://cdn.fitapp.test/anim/burpee.gif",
  videoUrl: null,
  updatedAt: "2026-02-01T00:00:00Z",
};

describe("RF-02.06 DownloadCatalogUpdate", () => {
  it("CA-02.06.1 con manifest de versión mayor a la local, descarga solo los cambios (updatedSince) y hace UPSERT en exercises/predefined_routines", async () => {
    const lastSyncedAt = new Date("2026-01-01T00:00:00Z");
    const manifestPort = new FakeCatalogManifestPort();
    manifestPort.manifestResult = ok({
      version: 3,
      exercisesEtag: "etag-v3",
      routinesEtag: "etag-v3",
      mediaBaseUrl: "https://cdn.fitapp.test/",
      updatedAt: new Date("2026-02-01T00:00:00Z"),
    });
    manifestPort.updatedSinceResults.exercises = ok([RAW_EXERCISE_DTO]);
    manifestPort.updatedSinceResults.routines = ok([]);

    const exerciseRepository = new InMemoryExerciseRepository();
    const routineRepository = new InMemoryPredefinedRoutineRepository();
    const useCase = new DownloadCatalogUpdate(manifestPort, exerciseRepository, routineRepository);

    const result = await useCase.execute({ localVersion: 1, lastSyncedAt });

    expect(isOk(result)).toBe(true);
    expect(manifestPort.fetchUpdatedSinceCalls).toEqual(
      expect.arrayContaining([
        { kind: "exercises", since: lastSyncedAt },
        { kind: "routines", since: lastSyncedAt },
      ]),
    );
    expect(exerciseRepository.upsertedBatches).toHaveLength(1);
    expect(exerciseRepository.upsertedBatches[0]).toHaveLength(1);
    expect(exerciseRepository.upsertedBatches[0]?.[0]?.slug).toBe("burpee");
    expect(routineRepository.upsertedBatches).toHaveLength(1);
  });

  it("CA-02.06.1 con manifest de la misma versión que la local, no descarga ni escribe nada (evita tráfico y escrituras innecesarias)", async () => {
    const manifestPort = new FakeCatalogManifestPort();
    manifestPort.manifestResult = ok({
      version: 2,
      exercisesEtag: "e",
      routinesEtag: "r",
      mediaBaseUrl: "https://cdn.fitapp.test/",
      updatedAt: new Date("2026-01-15T00:00:00Z"),
    });
    const exerciseRepository = new InMemoryExerciseRepository();
    const routineRepository = new InMemoryPredefinedRoutineRepository();
    const useCase = new DownloadCatalogUpdate(manifestPort, exerciseRepository, routineRepository);

    await useCase.execute({ localVersion: 2, lastSyncedAt: new Date("2026-01-01T00:00:00Z") });

    expect(manifestPort.fetchUpdatedSinceCalls).toHaveLength(0);
    expect(exerciseRepository.upsertedBatches).toHaveLength(0);
    expect(routineRepository.upsertedBatches).toHaveLength(0);
  });

  it("CA-02.06.1 nunca toca rutinas de usuario: el constructor solo acepta puertos de catálogo (ExerciseRepository/PredefinedRoutineRepository), ninguno de 'Mis rutinas'", () => {
    // Verificación estructural (plan.md §5, riesgo "confundir el catálogo con
    // datos de usuario sincronizables"): `DownloadCatalogUpdate` no depende
    // de ningún puerto de rutinas de usuario porque esa tabla no existe
    // hasta F03 (H2). Si la firma del constructor cambiara para aceptar uno,
    // esta prueba deja de compilar tal cual está escrita y obliga a revisar
    // la decisión.
    const manifestPort = new FakeCatalogManifestPort();
    const exerciseRepository = new InMemoryExerciseRepository();
    const routineRepository = new InMemoryPredefinedRoutineRepository();

    expect(
      () => new DownloadCatalogUpdate(manifestPort, exerciseRepository, routineRepository),
    ).not.toThrow();
  });
});
