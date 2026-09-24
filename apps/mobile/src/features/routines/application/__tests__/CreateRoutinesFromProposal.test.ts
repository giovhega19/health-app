/**
 * `CreateRoutinesFromProposal` — cierre de CA-02.04.3
 * (`specs/F03-editor-rutinas/plan.md` §1: suscriptor de `ProposalAccepted`
 * que crea las `Routine` correspondientes y emite `RoutinesCreatedFromProposal`).
 */
import { isErr, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { ProposalAcceptedEvent } from "@/features/catalog";
import type { Routine } from "../../domain/Routine";
import type { RepositoryError } from "../../domain/errors";
import type { RoutineRepository } from "../ports";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { anItem, nextTestId } from "@test/fakes/aRoutine";
import { CreateRoutinesFromProposal } from "../CreateRoutinesFromProposal";

const APP_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 90,
  restBetweenRoundsSeconds: 120,
  halfwayCue: false,
};

function aProposalAcceptedEvent(overrides: Partial<ProposalAcceptedEvent> = {}): ProposalAcceptedEvent {
  return {
    type: "ProposalAccepted",
    occurredAt: new Date("2026-09-21T08:00:00Z"),
    profileId: asId("00000000-0000-4000-a100-000000000001"),
    plan: {
      days: [
        {
          dayNumber: 1,
          routine: {
            timerDefaults: APP_TIMER_DEFAULTS,
            blocks: [{ id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [anItem()] }],
          },
          estimatedDurationSeconds: 1800,
        },
        {
          dayNumber: 4,
          routine: {
            timerDefaults: APP_TIMER_DEFAULTS,
            blocks: [{ id: nextTestId(), type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [anItem()] }],
          },
          estimatedDurationSeconds: 1800,
        },
      ],
    },
    preferredSchedule: [{ dayNumber: 1, preferredTime: "18:00" }],
    ...overrides,
  };
}

describe("CA-02.04.3 CreateRoutinesFromProposal", () => {
  it("crea una Routine (source=USER) por cada día del plan y las guarda", async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new CreateRoutinesFromProposal(
      repository,
      new FakeEventBus(),
      new FakeClock("2026-09-21T08:00:00Z"),
      APP_TIMER_DEFAULTS,
    );

    const result = await useCase.execute(aProposalAcceptedEvent());

    expect(isOk(result)).toBe(true);
    expect(repository.savedRoutines).toHaveLength(2);
    expect(repository.savedRoutines.every((routine) => routine.source === "USER")).toBe(true);
  });

  it("emite RoutinesCreatedFromProposal con el preferredTime de cada día (o el valor por defecto si falta)", async () => {
    const eventBus = new FakeEventBus();
    const useCase = new CreateRoutinesFromProposal(
      new FakeRoutineRepository(),
      eventBus,
      new FakeClock("2026-09-21T08:00:00Z"),
      APP_TIMER_DEFAULTS,
    );

    const result = await useCase.execute(aProposalAcceptedEvent());

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.routines).toHaveLength(2);
    expect(result.value.routines[0]?.preferredTime).toBe("18:00");
    expect(result.value.routines[1]?.preferredTime).toBe("08:00"); // sin entrada en preferredSchedule -> por defecto

    const published = eventBus.eventsOfType("RoutinesCreatedFromProposal");
    expect(published).toHaveLength(1);
  });

  it("propaga el error del repositorio al guardar", async () => {
    const failing: RoutineRepository = {
      findById: async () => ok(null),
      save: async (): Promise<Result<void, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
      listActive: async () => ok([] as Routine[]),
      softDelete: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new CreateRoutinesFromProposal(
      failing,
      new FakeEventBus(),
      new FakeClock("2026-09-21T08:00:00Z"),
      APP_TIMER_DEFAULTS,
    );

    const result = await useCase.execute(aProposalAcceptedEvent());

    expect(isErr(result)).toBe(true);
  });
});
