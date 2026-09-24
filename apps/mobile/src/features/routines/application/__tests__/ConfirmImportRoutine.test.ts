/**
 * `ConfirmImportRoutine` — CA-03.08.2 "al confirmar se guarda con
 * source = IMPORTED".
 *
 * Fase roja: `ConfirmImportRoutine` (`F03-T10`) persiste con
 * `source = "PREDEFINED"` (TODO inline en el archivo de producción) — esta
 * prueba debe fallar en la aserción.
 */
import { isOk } from "@/shared/domain/Result";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { aFitRoutineFileWithProblems, aValidFitRoutineFile } from "@test/fakes/aFitRoutineFile";
import type { RoutineImportedEvent } from "../../domain/events";
import { ConfirmImportRoutine } from "../ConfirmImportRoutine";

const APP_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

describe("CA-03.08.2 ConfirmImportRoutine — confirmar y persistir", () => {
  it("guarda la rutina importada con source = IMPORTED", async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new ConfirmImportRoutine(
      repository,
      new FakeClock("2026-09-23T10:00:00Z"),
      new FakeEventBus(),
      APP_TIMER_DEFAULTS,
    );
    const content = JSON.stringify(aValidFitRoutineFile());

    const result = await useCase.execute(content, content.length);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.source).toBe("IMPORTED");
    expect(repository.savedRoutines).toHaveLength(1);
  });

  it("publica RoutineImported al confirmar", async () => {
    const eventBus = new FakeEventBus();
    const useCase = new ConfirmImportRoutine(
      new FakeRoutineRepository(),
      new FakeClock("2026-09-23T10:00:00Z"),
      eventBus,
      APP_TIMER_DEFAULTS,
    );
    const content = JSON.stringify(aValidFitRoutineFile());

    await useCase.execute(content, content.length);

    expect(eventBus.eventsOfType("RoutineImported")).toHaveLength(1);
  });

  it("CA-03.08.3 (hallazgo H2): recorta targetReps=500 a 100 (RN-06) en vez de rechazar la importación, y publica la advertencia real", async () => {
    const repository = new FakeRoutineRepository();
    const eventBus = new FakeEventBus();
    const useCase = new ConfirmImportRoutine(
      repository,
      new FakeClock("2026-09-23T10:00:00Z"),
      eventBus,
      APP_TIMER_DEFAULTS,
    );
    const content = JSON.stringify(aFitRoutineFileWithProblems());

    const result = await useCase.execute(content, content.length);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(repository.savedRoutines).toHaveLength(1);
    const persistedReps = result.value.blocks[0]?.items[0]?.targetReps;
    expect(persistedReps).toBe(100);

    const events = eventBus.eventsOfType<RoutineImportedEvent>("RoutineImported");
    expect(events).toHaveLength(1);
    expect(events[0]?.warnings.some((warning) => warning.kind === "VALUE_CLAMPED")).toBe(true);
  });

  it("CA-03.08.3 (hallazgo H2): recorta targetSeconds y weightKg fuera de rango (RN-06)", async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new ConfirmImportRoutine(
      repository,
      new FakeClock("2026-09-23T10:00:00Z"),
      new FakeEventBus(),
      APP_TIMER_DEFAULTS,
    );
    const file = aValidFitRoutineFile({
      routine: {
        name: "Plancha con peso",
        goal: "GENERAL_HEALTH",
        level: "BEGINNER",
        timerDefaults: { prepSeconds: 10, restBetweenSetsSeconds: 60, restBetweenExercisesSeconds: 90 },
        blocks: [
          {
            type: "MAIN",
            grouping: "STRAIGHT",
            rounds: 1,
            items: [{ exercise: { ref: "catalog:plank" }, sets: 3, targetSeconds: 700, weightKg: 999 }],
          },
        ],
      },
    });
    const content = JSON.stringify(file);

    const result = await useCase.execute(content, content.length);

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    const item = result.value.blocks[0]?.items[0];
    expect(item?.targetSeconds).toBe(600);
    expect(item?.weightKg).toBe(500);
  });
});
