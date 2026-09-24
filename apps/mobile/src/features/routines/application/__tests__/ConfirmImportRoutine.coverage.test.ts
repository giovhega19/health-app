/**
 * `ConfirmImportRoutine` — pruebas adicionales de cobertura (Art. 3.2) para
 * las ramas de error que `ConfirmImportRoutine.test.ts` (QA) no ejercita:
 * archivo demasiado grande, JSON inválido, formato inválido contra el
 * esquema zod, RN-06 rechazado por `Routine.create` y error del repositorio
 * al guardar.
 */
import { isErr, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { aValidFitRoutineFile } from "@test/fakes/aFitRoutineFile";
import type { RepositoryError } from "../../domain/errors";
import type { RoutineRepository } from "../ports";
import { ConfirmImportRoutine } from "../ConfirmImportRoutine";

const APP_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

describe("ConfirmImportRoutine — ramas de error", () => {
  it("rechaza un archivo mayor a 256 KB (FILE_TOO_LARGE)", async () => {
    const useCase = new ConfirmImportRoutine(
      new FakeRoutineRepository(),
      new FakeClock("2026-09-23T10:00:00Z"),
      new FakeEventBus(),
      APP_TIMER_DEFAULTS,
    );

    const result = await useCase.execute("{}", 300 * 1024);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("FILE_TOO_LARGE");
    }
  });

  it("rechaza contenido que no es JSON válido (INVALID_FORMAT)", async () => {
    const useCase = new ConfirmImportRoutine(
      new FakeRoutineRepository(),
      new FakeClock("2026-09-23T10:00:00Z"),
      new FakeEventBus(),
      APP_TIMER_DEFAULTS,
    );

    const result = await useCase.execute("no es json", 10);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("INVALID_FORMAT");
    }
  });

  it("rechaza un archivo que no cumple el esquema (INVALID_FORMAT)", async () => {
    const useCase = new ConfirmImportRoutine(
      new FakeRoutineRepository(),
      new FakeClock("2026-09-23T10:00:00Z"),
      new FakeEventBus(),
      APP_TIMER_DEFAULTS,
    );
    const content = JSON.stringify({ schema: "fitapp.routine" });

    const result = await useCase.execute(content, content.length);

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("INVALID_FORMAT");
    }
  });

  it("propaga el rechazo de Routine.create (RN-06) cuando el nombre queda vacío", async () => {
    const useCase = new ConfirmImportRoutine(
      new FakeRoutineRepository(),
      new FakeClock("2026-09-23T10:00:00Z"),
      new FakeEventBus(),
      APP_TIMER_DEFAULTS,
    );
    const content = JSON.stringify(aValidFitRoutineFile({ routine: { ...aValidFitRoutineFile().routine as object, name: "" } }));

    const result = await useCase.execute(content, content.length);

    expect(isErr(result)).toBe(true);
  });

  it("propaga el error del repositorio al guardar", async () => {
    const failing: RoutineRepository = {
      findById: async () => ok(null),
      save: async (): Promise<Result<void, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
      listActive: async () => ok([]),
      softDelete: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new ConfirmImportRoutine(
      failing,
      new FakeClock("2026-09-23T10:00:00Z"),
      new FakeEventBus(),
      APP_TIMER_DEFAULTS,
    );
    const content = JSON.stringify(aValidFitRoutineFile());

    const result = await useCase.execute(content, content.length);

    expect(isErr(result)).toBe(true);
  });
});
