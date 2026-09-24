/**
 * `ListPredefinedRoutines` — CA-03.05.1 "Predefinidas protegidas" (cierre de
 * brecha H2-QA): expone las rutinas predefinidas del catálogo para que "Mis
 * rutinas" (F03) pueda ofrecer "Duplicar y editar" sobre ellas.
 */
import { isErr, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { PredefinedRoutine } from "../../domain/PredefinedRoutine";
import type { RepositoryError, PredefinedRoutineRepository } from "../ports";
import { asId } from "@/shared/domain/Id";
import { InMemoryPredefinedRoutineRepository } from "@test/fakes/InMemoryPredefinedRoutineRepository";
import { ListPredefinedRoutines } from "../ListPredefinedRoutines";

function aPredefinedRoutine(): PredefinedRoutine {
  return PredefinedRoutine.create({
    id: asId("00000000-0000-4000-c000-000000000001"),
    name: "Cuerpo completo sin equipo",
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
        id: asId("00000000-0000-4000-c000-000000000002"),
        type: "MAIN",
        grouping: "STRAIGHT",
        rounds: 1,
        items: [{ id: asId("00000000-0000-4000-c000-000000000003"), exerciseId: asId("00000000-0000-4000-c000-000000000004"), sets: 3, targetReps: 12 }],
      },
    ],
    version: 1,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  });
}

describe("ListPredefinedRoutines", () => {
  it("lista todas las rutinas predefinidas del repositorio", async () => {
    const repository = new InMemoryPredefinedRoutineRepository([aPredefinedRoutine()]);
    const useCase = new ListPredefinedRoutines(repository);

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]?.name).toBe("Cuerpo completo sin equipo");
  });

  it("propaga el error del repositorio", async () => {
    const failing: PredefinedRoutineRepository = {
      all: async (): Promise<Result<PredefinedRoutine[], RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<PredefinedRoutine[], RepositoryError>,
      upsertMany: async () => ok(undefined),
    };
    const useCase = new ListPredefinedRoutines(failing);

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });
});
