/**
 * CA-04.04.2 Mismo grupo muscular (RN-13): "Dado minHoursSameMuscle = 48 y
 * ayer entrené PIERNA, cuando programo otra rutina de PIERNA para hoy,
 * entonces veo una advertencia con una rutina alternativa sugerida."
 * Heurística acotada a H2 (`plan.md` §1 punto 3): la alternativa sugerida es
 * otra rutina que el usuario ya tiene programada en un `ScheduleSlot` activo
 * para un día distinto.
 *
 * `ScheduleRoutine.execute` (tarea `F04-T08`) lanza deliberadamente — rojo
 * TDD esperado.
 */
import { isOk } from "@/shared/domain/Result";
import { asId } from "@/shared/domain/Id";
import { ScheduleRoutine } from "../ScheduleRoutine";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { FakeRoutineSummaryLookupPort } from "@test/fakes/FakeRoutineSummaryLookupPort";
import { FakeLastSessionQueryPort } from "@test/fakes/FakeLastSessionQueryPort";
import { FakeSchedulingPreferencesRepository } from "@test/fakes/FakeSchedulingPreferencesRepository";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";

describe("CA-04.04.2 ScheduleRoutine — mismo grupo muscular, alternativa sugerida", () => {
  it("ayer PIERNA hace <48h y programo otra rutina de PIERNA hoy -> advertencia con alternativa ya programada otro día", async () => {
    const legRoutine = aRoutineSummary({
      id: asId("00000000-0000-4000-e100-000000000003"),
      name: "Pierna intensa",
      muscleGroups: ["LEGS"],
    });
    const alternativeRoutine = aRoutineSummary({
      id: asId("00000000-0000-4000-e100-000000000004"),
      name: "Torso ligero",
      muscleGroups: ["CHEST"],
    });

    const scheduleSlotRepository = new FakeScheduleSlotRepository([
      aScheduleSlot({
        id: asId("00000000-0000-4000-e200-000000000005"),
        routineId: alternativeRoutine.id,
        daysOfWeek: [3],
      }),
    ]);
    const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
    routineSummaryLookupPort.register(legRoutine);
    routineSummaryLookupPort.register(alternativeRoutine);
    const lastSessionQueryPort = new FakeLastSessionQueryPort();
    lastSessionQueryPort.response = { completedAt: new Date("2026-09-20T18:00:00Z"), muscleGroups: ["LEGS"] };
    const schedulingPreferencesRepository = new FakeSchedulingPreferencesRepository();
    schedulingPreferencesRepository.current = {
      ...schedulingPreferencesRepository.current,
      minHoursSameMuscle: 48,
    };
    const eventBus = new FakeEventBus();
    const clock = new FakeClock("2026-09-21T18:00:00Z"); // 24h después de la última sesión de pierna

    const useCase = new ScheduleRoutine({
      scheduleSlotRepository,
      routineSummaryLookupPort,
      lastSessionQueryPort,
      schedulingPreferencesRepository,
      eventBus,
      clock,
    });

    const result = await useCase.execute({
      routineId: legRoutine.id,
      daysOfWeek: [1],
      startTime: "18:00",
      reminderOffsetMin: 15,
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const warning = result.value.warnings.find((w) => w.kind === "SAME_MUSCLE_GROUP");
      expect(warning).toBeDefined();
      expect(warning && "suggestedAlternativeRoutineId" in warning ? warning.suggestedAlternativeRoutineId : null).toBe(
        alternativeRoutine.id,
      );
    }
  });
});
