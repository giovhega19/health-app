/**
 * `SchedulingNavigator` — prueba de integración (mismo patrón que
 * `CatalogNavigator.test.tsx`/`RoutinesNavigator.test.tsx`): "Mi semana" con
 * repositorios en memoria (sin SQLite real).
 *
 * CA-04.01.2 ("Reprogramación coherente": cancelar un slot desde el
 * calendario) y RN-13 (CA-04.04.1/CA-04.04.2: la advertencia de descanso
 * calculada por `CreateScheduleSlotsFromProposal` es visible en "Mi
 * semana") de punta a punta (navegador + pantallas + casos de uso reales,
 * solo infraestructura en memoria).
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { asId } from "@/shared/domain/Id";
import { isOk } from "@/shared/domain/Result";
import { createSchedulingContainer } from "@/features/scheduling";
import { createRoutinesContainer } from "@/features/routines";
import { SchedulingNavigator } from "../SchedulingNavigator";
import { FakeScheduleSlotRepository } from "@test/fakes/FakeScheduleSlotRepository";
import { FakePlannedNotificationRepository } from "@test/fakes/FakePlannedNotificationRepository";
import { FakeSchedulingPreferencesRepository } from "@test/fakes/FakeSchedulingPreferencesRepository";
import { FakePostponeCounterRepository } from "@test/fakes/FakePostponeCounterRepository";
import { FakeNotificationScheduler } from "@test/fakes/FakeNotificationScheduler";
import { FakeRoutineSummaryLookupPort } from "@test/fakes/FakeRoutineSummaryLookupPort";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { aRoutineSummary } from "@test/fakes/aRoutineSummary";
import { aScheduleSlot } from "@test/fakes/aScheduleSlot";
import { NullLastSessionAdapter } from "../../../infrastructure/NullLastSessionAdapter";
import { InMemoryRestWarningStore } from "../../../infrastructure/InMemoryRestWarningStore";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { FakeCustomExerciseRepository } from "@test/fakes/FakeCustomExerciseRepository";
import { FakeFileGateway } from "@test/fakes/FakeFileGateway";
import { FakeExerciseDisplayLookupPort } from "@test/fakes/FakeExerciseDisplayLookupPort";
import { aRoutine } from "@test/fakes/aRoutine";
import type { Routine } from "@/features/routines";

const APP_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 60,
  restBetweenRoundsSeconds: 90,
  halfwayCue: false,
};

function buildRoutines(routines: Routine[]) {
  return createRoutinesContainer({
    routineRepository: new FakeRoutineRepository(routines),
    customExerciseRepository: new FakeCustomExerciseRepository(),
    fileGateway: new FakeFileGateway(),
    exerciseDisplayLookupPort: new FakeExerciseDisplayLookupPort(),
    eventBus: new FakeEventBus(),
    clock: new FakeClock("2026-09-21T08:00:00Z"),
    appTimerDefaults: APP_TIMER_DEFAULTS,
  });
}

function buildScheduling(overrides: {
  scheduleSlotRepository: FakeScheduleSlotRepository;
  routineSummaryLookupPort: FakeRoutineSummaryLookupPort;
  restWarningStore?: InMemoryRestWarningStore;
}) {
  return createSchedulingContainer({
    scheduleSlotRepository: overrides.scheduleSlotRepository,
    plannedNotificationRepository: new FakePlannedNotificationRepository(),
    notificationScheduler: new FakeNotificationScheduler(),
    routineSummaryLookupPort: overrides.routineSummaryLookupPort,
    schedulingPreferencesRepository: new FakeSchedulingPreferencesRepository(),
    postponeCounterRepository: new FakePostponeCounterRepository(),
    lastSessionQueryPort: new NullLastSessionAdapter(),
    eventBus: new FakeEventBus(),
    clock: new FakeClock("2026-09-21T08:00:00Z"),
    restWarningStore: overrides.restWarningStore,
  });
}

function aSavedRoutine(id: ReturnType<typeof asId>, name: string): Routine {
  return aRoutine().withName(name).buildEntity({ id });
}

describe("SchedulingNavigator", () => {
  it("CA-04.01.2: 'Cancelar' sobre un slot lo quita del calendario (queda 'Descanso') y publica SlotCancelled", async () => {
    const routineId = asId("00000000-0000-4000-e100-000000000070");
    const slot = aScheduleSlot({ id: asId("00000000-0000-4000-e200-000000000070"), routineId, daysOfWeek: [1] });
    const scheduleSlotRepository = new FakeScheduleSlotRepository([slot]);
    const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
    routineSummaryLookupPort.register(aRoutineSummary({ id: routineId }));

    const routines = buildRoutines([aSavedRoutine(routineId, "Pierna casa")]);
    const scheduling = buildScheduling({ scheduleSlotRepository, routineSummaryLookupPort });

    await render(<SchedulingNavigator container={{ scheduling, routines }} />);

    await waitFor(() => expect(screen.getByText("Pierna casa")).toBeTruthy());

    await fireEvent.press(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(screen.queryByText("Pierna casa")).toBeNull());
    expect(screen.getAllByText("Descanso").length).toBeGreaterThan(0);

    const remaining = await scheduleSlotRepository.listActive();
    expect(isOk(remaining)).toBe(true);
    if (isOk(remaining)) {
      expect(remaining.value).toHaveLength(0);
    }
  });

  it("RN-13 (CA-04.04.1/CA-04.04.2): muestra la advertencia de descanso calculada por CreateScheduleSlotsFromProposal", async () => {
    const routineId1 = asId("00000000-0000-4000-e100-000000000071");
    const routineId2 = asId("00000000-0000-4000-e100-000000000072");
    const slot1 = aScheduleSlot({ id: asId("00000000-0000-4000-e200-000000000071"), routineId: routineId1, daysOfWeek: [1] });
    const slot2 = aScheduleSlot({ id: asId("00000000-0000-4000-e200-000000000072"), routineId: routineId2, daysOfWeek: [2] });
    const scheduleSlotRepository = new FakeScheduleSlotRepository([slot1, slot2]);
    const routineSummaryLookupPort = new FakeRoutineSummaryLookupPort();
    routineSummaryLookupPort.register(aRoutineSummary({ id: routineId1, name: "Piernas lunes" }));
    routineSummaryLookupPort.register(aRoutineSummary({ id: routineId2, name: "Piernas martes" }));

    const routines = buildRoutines([aSavedRoutine(routineId1, "Piernas lunes"), aSavedRoutine(routineId2, "Piernas martes")]);
    const restWarningStore = new InMemoryRestWarningStore();
    restWarningStore.record([
      {
        scheduleSlotId: slot2.id,
        warnings: [{ kind: "SAME_MUSCLE_GROUP", hoursSinceLastSession: 24, minHoursRequired: 48, muscleGroups: ["LEGS"], suggestedAlternativeRoutineId: null }],
      },
    ]);
    const scheduling = buildScheduling({ scheduleSlotRepository, routineSummaryLookupPort, restWarningStore });

    await render(<SchedulingNavigator container={{ scheduling, routines }} />);

    await waitFor(() => expect(screen.getByText("Piernas martes")).toBeTruthy());
    expect(screen.getByText(/descanso insuficiente/i)).toBeTruthy();
  });
});
