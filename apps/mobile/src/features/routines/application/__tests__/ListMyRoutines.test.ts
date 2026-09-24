/** `ListMyRoutines` — pantalla "Mis rutinas" (RF-03.01…RF-03.06). */
import { isErr, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { Routine } from "../../domain/Routine";
import type { RepositoryError } from "../../domain/errors";
import type { RoutineRepository } from "../ports";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { aRoutine } from "@test/fakes/aRoutine";
import { ListMyRoutines } from "../ListMyRoutines";

describe("ListMyRoutines", () => {
  it("lista las rutinas activas del repositorio", async () => {
    const created = Routine.create(aRoutine().withItems(1).build());
    expect(isOk(created)).toBe(true);
    if (!isOk(created)) return;

    const repository = new FakeRoutineRepository([created.value]);
    const useCase = new ListMyRoutines(repository);

    const result = await useCase.execute();

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toHaveLength(1);
  });

  it("propaga el error del repositorio", async () => {
    const failing: RoutineRepository = {
      save: async () => ok(undefined),
      findById: async () => ok(null),
      listActive: async (): Promise<Result<Routine[], RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<Routine[], RepositoryError>,
      softDelete: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new ListMyRoutines(failing);

    const result = await useCase.execute();

    expect(isErr(result)).toBe(true);
  });
});
