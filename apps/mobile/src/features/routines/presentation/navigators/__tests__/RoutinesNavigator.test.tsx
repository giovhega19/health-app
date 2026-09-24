/**
 * `RoutinesNavigator` — prueba de integración (mismo patrón que
 * `CatalogNavigator.test.tsx`): "Mis rutinas" combinado con las
 * predefinidas del catálogo, con repositorios en memoria (sin SQLite real,
 * ya cubierto en pruebas de infraestructura).
 *
 * CA-03.01.1 (duración estimada en "Mis rutinas") y CA-03.05.1 ("Duplicar y
 * editar" sobre una rutina PREDEFINED: la copia se persiste con
 * source = USER y el nombre "<nombre> (mi versión)") de punta a punta
 * (navegador + pantallas + casos de uso reales, solo infraestructura en
 * memoria).
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { isOk } from "@/shared/domain/Result";
import { createCatalogContainer } from "@/features/catalog";
import { createRoutinesContainer } from "@/features/routines";
import { asId } from "@/shared/domain/Id";
import { RoutinesNavigator } from "../RoutinesNavigator";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { FakeCustomExerciseRepository } from "@test/fakes/FakeCustomExerciseRepository";
import { FakeFileGateway } from "@test/fakes/FakeFileGateway";
import { FakeExerciseDisplayLookupPort } from "@test/fakes/FakeExerciseDisplayLookupPort";
import { FakeEventBus } from "@test/fakes/FakeEventBus";
import { FakeClock } from "@test/fakes/FakeClock";
import { InMemoryExerciseRepository } from "@test/fakes/InMemoryExerciseRepository";
import { InMemoryPredefinedRoutineRepository } from "@test/fakes/InMemoryPredefinedRoutineRepository";
import { FakeCatalogManifestPort } from "@test/fakes/FakeCatalogManifestPort";
import { FakeMediaCachePort } from "@test/fakes/FakeMediaCachePort";
import { aPredefinedRoutine } from "@test/fakes/aPredefinedRoutine";

const APP_TIMER_DEFAULTS = {
  prepSeconds: 10,
  workSeconds: 40,
  restBetweenSetsSeconds: 60,
  restBetweenExercisesSeconds: 60,
  restBetweenRoundsSeconds: 90,
  halfwayCue: false,
};

function buildContainer() {
  const clock = new FakeClock("2026-09-24T10:00:00Z");
  const routines = createRoutinesContainer({
    routineRepository: new FakeRoutineRepository(),
    customExerciseRepository: new FakeCustomExerciseRepository(),
    fileGateway: new FakeFileGateway(),
    exerciseDisplayLookupPort: new FakeExerciseDisplayLookupPort(),
    eventBus: new FakeEventBus(),
    clock,
    appTimerDefaults: APP_TIMER_DEFAULTS,
  });
  const catalog = createCatalogContainer({
    exerciseRepository: new InMemoryExerciseRepository(),
    routineRepository: new InMemoryPredefinedRoutineRepository([
      aPredefinedRoutine({
        id: asId("00000000-0000-4000-c000-000000000010"),
        name: "Cuerpo completo sin equipo",
        timerDefaults: APP_TIMER_DEFAULTS,
        blocks: [
          {
            id: asId("00000000-0000-4000-c000-000000000011"),
            type: "MAIN",
            grouping: "STRAIGHT",
            rounds: 1,
            items: [
              {
                id: asId("00000000-0000-4000-c000-000000000012"),
                exerciseId: asId("00000000-0000-4000-c000-000000000013"),
                sets: 2,
                targetReps: 10,
              },
            ],
          },
        ],
      }),
    ]),
    manifestPort: new FakeCatalogManifestPort(),
    mediaCachePort: new FakeMediaCachePort(),
  });
  return { routines, catalog, clock };
}

describe("RoutinesNavigator", () => {
  it("CA-03.01.1: 'Mis rutinas' muestra la duración estimada de una rutina recién creada", async () => {
    const { routines, catalog, clock } = buildContainer();
    await render(<RoutinesNavigator container={{ routines, catalog, clock }} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /crear rutina/i })).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: /crear rutina/i }));

    await fireEvent.changeText(screen.getByLabelText(/nombre de la rutina/i), "Pierna casa");
    await fireEvent.changeText(screen.getByLabelText(/nombre del ejercicio nuevo/i), "Sentadilla");
    await fireEvent.press(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /guardar/i })).toBeEnabled());
    await fireEvent.press(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(screen.getByText("Pierna casa")).toBeTruthy());
    // RN-07: prep(10s) + 3 sets x 12 reps x 3s + 2 descansos entre series x 60s = 238s ~ 4 min.
    expect(screen.getByText(/4 min/)).toBeTruthy();
  });

  it('CA-03.05.1: ofrece "Duplicar y editar" sobre una rutina PREDEFINED y la copia queda como USER', async () => {
    const { routines, catalog, clock } = buildContainer();
    await render(<RoutinesNavigator container={{ routines, catalog, clock }} />);

    await waitFor(() => expect(screen.getByText(/cuerpo completo sin equipo/i)).toBeTruthy());
    await fireEvent.press(screen.getByRole("button", { name: /duplicar y editar/i }));

    // Navega al editor con la copia ya persistida (CA-03.05.1 "se me ofrece
    // 'Duplicar y editar'"): el nombre precargado confirma el sufijo exigido.
    await waitFor(() => expect(screen.getByDisplayValue(/cuerpo completo sin equipo \(mi versión\)/i)).toBeTruthy());

    const savedResult = await routines.listMyRoutines.execute();
    expect(isOk(savedResult)).toBe(true);
    if (!isOk(savedResult)) return;
    expect(savedResult.value).toHaveLength(1);
    expect(savedResult.value[0]?.name).toBe("Cuerpo completo sin equipo (mi versión)");
    expect(savedResult.value[0]?.source).toBe("USER");
  });
});
