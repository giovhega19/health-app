/**
 * `useOnboardingStore` (Zustand, tarea `F01-T14`): borrador multi-paso del
 * asistente de onboarding. CA-01.02.1 depende de que los datos recogidos en
 * cada paso sobrevivan hasta la pantalla "Resumen".
 */
import { useOnboardingStore } from "../useOnboardingStore";

describe("RF-01.02 useOnboardingStore", () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
  });

  it("CA-01.02.1 acumula las respuestas de cada paso del onboarding", () => {
    const store = useOnboardingStore.getState();

    store.setGoal("MUSCLE_GAIN");
    store.setLevel("INTERMEDIATE");
    store.setAvailability(4, 60);
    store.toggleEquipment("DUMBBELLS");
    store.toggleEquipment("PULL_UP_BAR");
    store.setBodyData({ birthDate: "1996-01-15", gender: "FEMALE", heightCm: 165, weightKg: 60 });
    store.setFitnessQuestionnaireAnswers([false, false, false]);
    store.setHealthDataConsent(true);

    const state = useOnboardingStore.getState();
    expect(state.goal).toBe("MUSCLE_GAIN");
    expect(state.level).toBe("INTERMEDIATE");
    expect(state.daysPerWeek).toBe(4);
    expect(state.minutesPerSession).toBe(60);
    expect(state.equipment).toEqual(["DUMBBELLS", "PULL_UP_BAR"]);
    expect(state.heightCm).toBe(165);
    expect(state.weightKg).toBe(60);
    expect(state.healthDataConsent).toBe(true);
  });

  it("toggleEquipment() quita el equipo si ya estaba seleccionado", () => {
    const store = useOnboardingStore.getState();
    store.toggleEquipment("DUMBBELLS");

    store.toggleEquipment("DUMBBELLS");

    expect(useOnboardingStore.getState().equipment).toEqual([]);
  });

  it("reset() vuelve al borrador inicial", () => {
    const store = useOnboardingStore.getState();
    store.setGoal("STRENGTH");

    store.reset();

    expect(useOnboardingStore.getState().goal).toBeNull();
  });
});
