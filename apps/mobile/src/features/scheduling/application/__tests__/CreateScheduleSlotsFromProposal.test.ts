/**
 * `CreateScheduleSlotsFromProposal` — cierre final de CA-02.04.3
 * (`specs/F04-programacion-recordatorios/plan.md` §1: suscriptor de
 * `RoutinesCreatedFromProposal`, crea los `ScheduleSlot` reales) y de RN-13
 * (CA-04.04.1/CA-04.04.2, cierre de brecha H2-QA: este era el único flujo
 * real que creaba `ScheduleSlot`s sin pasar por `RestRuleChecker`).
 */
import { isErr, isOk, ok } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import type { RepositoryError, ScheduleSlotRepository } from "../ports";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { FakeRoutineSummaryLookupPort } from "@test/fakes/FakeRoutineSummaryLookupPort";
import { FakeSchedulingPreferencesRepository } from "@test/fakes/FakeSchedulingPreferencesRepository";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";
import { FakeRestWarningStore } from "@test/fakes/FakeRestWarningStore";
import { CreateScheduleSlotsFromProposal } from "../CreateScheduleSlotsFromProposal";

const ROUTINE_ID_1 = asId("00000000-0000-4000-e100-000000000050");
const ROUTINE_ID_2 = asId("00000000-0000-4000-e100-000000000051");

describe("CA-02.04.3 CreateScheduleSlotsFromProposal", () => {
  it("crea un ScheduleSlot activo por cada rutina creada desde la propuesta", async () => {
    const repository = new FakeScheduleSlotRepository();
    const eventBus = new FakeEventBus();
    const useCase = new CreateScheduleSlotsFromProposal(repository, eventBus, new FakeClock("2026-09-21T08:00:00Z"));

    const result = await useCase.execute({
      routines: [
        { routineId: ROUTINE_ID_1, dayNumber: 1, preferredTime: "18:00" },
        { routineId: ROUTINE_ID_2, dayNumber: 4, preferredTime: "07:00" },
      ],
    });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.createdCount).toBe(2);
    expect(repository.saved).toHaveLength(2);
    expect(repository.saved[0]?.active).toBe(true);
    expect(repository.saved[0]?.daysOfWeek).toEqual([1]);
    expect(repository.saved[0]?.startTime).toBe("18:00");
    expect(eventBus.eventsOfType("RoutineScheduled")).toHaveLength(2);
  });

  it("propaga el error del repositorio al guardar", async () => {
    const failing: ScheduleSlotRepository = {
      save: async (): Promise<Result<void, RepositoryError>> =>
        ({ ok: false, error: { kind: "STORAGE_ERROR" } }) as Result<void, RepositoryError>,
      listActive: async () => ok([]),
      findById: async () => ok(null),
      cancel: async () => ok(undefined),
      clear: async () => ok(undefined),
    };
    const useCase = new CreateScheduleSlotsFromProposal(failing, new FakeEventBus(), new FakeClock("2026-09-21T08:00:00Z"));

    const result = await useCase.execute({ routines: [{ routineId: ROUTINE_ID_1, dayNumber: 1, preferredTime: "18:00" }] });

    expect(isErr(result)).toBe(true);
  });

  describe("RN-13: descanso insuficiente entre los slots del propio lote (CA-04.04.1/CA-04.04.2)", () => {
    it('calcula una advertencia SAME_MUSCLE_GROUP cuando dos rutinas de la misma propuesta comparten grupo muscular y quedan a menos de "minHoursSameMuscle"', async () => {
      const repository = new FakeScheduleSlotRepository();
      const eventBus = new FakeEventBus();
      const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
      routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID_1, name: "Piernas lunes", muscleGroups: ["LEGS"] }));
      routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID_2, name: "Piernas martes", muscleGroups: ["LEGS"] }));
      // `minHoursSameMuscle` por defecto es 48h (`DEFAULT_SCHEDULING_PREFERENCES`).
      const schedulingPreferencesRepository = new FakeSchedulingPreferencesRepository();
      const clock = new FakeClock("2026-09-21T08:00:00Z"); // lunes 2026-09-21

      const useCase = new CreateScheduleSlotsFromProposal(
        repository,
        eventBus,
        clock,
        routineSummaryLookupPort,
        schedulingPreferencesRepository,
      );

      const result = await useCase.execute({
        routines: [
          { routineId: ROUTINE_ID_1, dayNumber: 1, preferredTime: "18:00" }, // lunes 18:00
          { routineId: ROUTINE_ID_2, dayNumber: 2, preferredTime: "18:00" }, // martes 18:00 (24h después)
        ],
      });

      expect(isOk(result)).toBe(true);
      if (!isOk(result)) return;
      expect(result.value.createdCount).toBe(2);
      expect(result.value.warnings).toHaveLength(1);
      const [warningEntry] = result.value.warnings;
      expect(warningEntry?.warnings).toEqual([
        expect.objectContaining({ kind: "SAME_MUSCLE_GROUP", hoursSinceLastSession: 24, minHoursRequired: 48 }),
      ]);
      // El slot con la advertencia es el que ocurre después (martes), no el lunes.
      const tuesdaySlot = repository.saved.find((slot) => slot.daysOfWeek.includes(2));
      expect(warningEntry?.scheduleSlotId).toBe(tuesdaySlot?.id);
    });

    it("no genera advertencias cuando las rutinas de la propuesta no comparten grupo muscular ni violan el mínimo entre rutinas", async () => {
      const repository = new FakeScheduleSlotRepository();
      const eventBus = new FakeEventBus();
      const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
      routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID_1, name: "Piernas", muscleGroups: ["LEGS"] }));
      routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID_2, name: "Espalda", muscleGroups: ["BACK"] }));
      const schedulingPreferencesRepository = new FakeSchedulingPreferencesRepository();
      const clock = new FakeClock("2026-09-21T08:00:00Z");

      const useCase = new CreateScheduleSlotsFromProposal(
        repository,
        eventBus,
        clock,
        routineSummaryLookupPort,
        schedulingPreferencesRepository,
      );

      const result = await useCase.execute({
        routines: [
          { routineId: ROUTINE_ID_1, dayNumber: 1, preferredTime: "18:00" },
          { routineId: ROUTINE_ID_2, dayNumber: 2, preferredTime: "18:00" },
        ],
      });

      expect(isOk(result)).toBe(true);
      if (!isOk(result)) return;
      expect(result.value.warnings).toHaveLength(0);
    });

    it("deja las advertencias accesibles vía RestWarningStore para que la presentación las muestre", async () => {
      const repository = new FakeScheduleSlotRepository();
      const eventBus = new FakeEventBus();
      const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
      routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID_1, name: "Piernas lunes", muscleGroups: ["LEGS"] }));
      routineSummaryLookupPort.register(aRoutineSummary({ id: ROUTINE_ID_2, name: "Piernas martes", muscleGroups: ["LEGS"] }));
      const schedulingPreferencesRepository = new FakeSchedulingPreferencesRepository();
      const clock = new FakeClock("2026-09-21T08:00:00Z");
      const restWarningStore = new FakeRestWarningStore();

      const useCase = new CreateScheduleSlotsFromProposal(
        repository,
        eventBus,
        clock,
        routineSummaryLookupPort,
        schedulingPreferencesRepository,
        restWarningStore,
      );

      await useCase.execute({
        routines: [
          { routineId: ROUTINE_ID_1, dayNumber: 1, preferredTime: "18:00" },
          { routineId: ROUTINE_ID_2, dayNumber: 2, preferredTime: "18:00" },
        ],
      });

      expect(restWarningStore.listAll()).toHaveLength(1);
      expect(restWarningStore.listAll()[0]?.warnings[0]?.kind).toBe("SAME_MUSCLE_GROUP");
    });
  });
});
