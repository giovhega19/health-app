/**
 * `RoutineSyncEntityApplier` (tarea `F03-T15`): aplica cambios remotos de
 * `routine`/`customExercise` al almacenamiento local, mismo patrón que
 * `ProfileSyncEntityApplier` (F01/CA-01.01.1). Sin CA propio (F03 lo
 * sincroniza por decisión registrada en `spec.md` §"Preguntas abiertas", no
 * por un escenario Gherkin nuevo), pero es un caso crítico obligatorio de
 * `07-estrategia-pruebas.md` §3 ("Sync: ... idempotencia, conflicto LWW,
 * propagación de eliminaciones").
 */
import { isOk } from "@/shared/domain/Result";
import type { RemoteChange } from "@/features/sync";
import { RoutineSyncEntityApplier } from "../RoutineSyncEntityApplier";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { FakeCustomExerciseRepository } from "@test/fakes/FakeCustomExerciseRepository";

describe("RoutineSyncEntityApplier", () => {
  it("supports() solo acepta routine y customExercise", () => {
    const applier = new RoutineSyncEntityApplier(new FakeRoutineRepository(), new FakeCustomExerciseRepository());

    expect(applier.supports("routine")).toBe(true);
    expect(applier.supports("customExercise")).toBe(true);
    expect(applier.supports("profile")).toBe(false);
  });

  it("aplica un cambio remoto de routine guardándolo localmente (LWW, RN-18)", async () => {
    const routineRepository = new FakeRoutineRepository();
    const applier = new RoutineSyncEntityApplier(routineRepository, new FakeCustomExerciseRepository());
    const change: RemoteChange = {
      entity: "routine",
      op: "upsert",
      id: "00000000-0000-4000-b100-000000000001",
      updatedAt: "2026-09-23T10:00:00Z",
      data: {
        id: "00000000-0000-4000-b100-000000000001",
        name: "Pierna casa",
        description: null,
        goal: "GENERAL_HEALTH",
        level: "BEGINNER",
        source: "USER",
        timerDefaults: {
          prepSeconds: 10,
          workSeconds: 40,
          restBetweenSetsSeconds: 60,
          restBetweenExercisesSeconds: 90,
          restBetweenRoundsSeconds: 120,
          halfwayCue: false,
        },
        blocks: [
          {
            id: "00000000-0000-4000-b100-000000000010",
            type: "MAIN",
            grouping: "STRAIGHT",
            rounds: 1,
            items: [
              {
                id: "00000000-0000-4000-b100-000000000011",
                exerciseId: "00000000-0000-4000-b100-000000000012",
                sets: 3,
                targetReps: 12,
              },
            ],
          },
        ],
        version: 1,
        updatedAt: "2026-09-23T10:00:00.000Z",
        deletedAt: null,
      },
    };

    const result = await applier.apply(change);

    expect(isOk(result)).toBe(true);
    expect(routineRepository.savedRoutines).toHaveLength(1);
  });

  it("aplica un cambio remoto de customExercise", async () => {
    const customExerciseRepository = new FakeCustomExerciseRepository();
    const applier = new RoutineSyncEntityApplier(new FakeRoutineRepository(), customExerciseRepository);
    const change: RemoteChange = {
      entity: "customExercise",
      op: "upsert",
      id: "00000000-0000-4000-b100-000000000002",
      updatedAt: "2026-09-23T10:00:00Z",
      data: {
        id: "00000000-0000-4000-b100-000000000002",
        name: "Fondos en silla",
        notes: null,
        photoUri: null,
        muscleGroups: ["ARMS"],
        mode: "REPS",
      },
    };

    const result = await applier.apply(change);

    expect(isOk(result)).toBe(true);
    expect(customExerciseRepository.savedExercises).toHaveLength(1);
  });

  it("propaga la eliminación de una routine (op=delete) mediante softDelete", async () => {
    const routineRepository = new FakeRoutineRepository();
    const applier = new RoutineSyncEntityApplier(routineRepository, new FakeCustomExerciseRepository());

    const result = await applier.apply({
      entity: "routine",
      op: "delete",
      id: "00000000-0000-4000-b100-000000000003",
      updatedAt: "2026-09-23T10:00:00Z",
    });

    expect(isOk(result)).toBe(true);
    expect(routineRepository.softDeletedIds).toEqual(["00000000-0000-4000-b100-000000000003"]);
  });
});
