/** `GetRoutineDetail` — rama de error del repositorio (Art. 3.2). */
import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { Routine } from "../../domain/Routine";
import type { RepositoryError } from "../../domain/errors";
import type { RoutineRepository } from "../ports";
import { GetRoutineDetail } from "../GetRoutineDetail";

describe("GetRoutineDetail — error del repositorio", () => {
  it("propaga el error al buscar la rutina", async () => {
    const failing: RoutineRepository = {
      save: async () => ok(undefined),
      findById: async (): Promise<Result<Routine | null, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<Routine | null, RepositoryError>,
      listActive: async () => ok([]),
      softDelete: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new GetRoutineDetail(failing);

    const result = await useCase.execute(asId("00000000-0000-4000-9999-000000000001"));

    expect(isErr(result)).toBe(true);
  });
});
