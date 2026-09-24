/**
 * `RoutineEditor` — CA-03.01.1/CA-03.01.2/CA-03.06.1 editor mínimo.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { asId } from "@/shared/domain/Id";
import { useRoutineEditorStore } from "../../stores/useRoutineEditorStore";
import { RoutineEditorScreen } from "../RoutineEditor";

let idCounter = 0;
function makeItemId() {
  idCounter += 1;
  return asId(`00000000-0000-4000-d000-${idCounter.toString().padStart(12, "0")}`);
}

describe("RoutineEditorScreen", () => {
  beforeEach(() => {
    idCounter = 0;
    useRoutineEditorStore.setState({ pendingRemoval: null });
  });

  it("el botón Guardar está deshabilitado sin nombre ni ejercicios", async () => {
    await render(<RoutineEditorScreen makeItemId={makeItemId} onSave={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("agrega un ejercicio y guarda con el nombre y los ítems ingresados", async () => {
    const onSave = jest.fn();
    await render(<RoutineEditorScreen makeItemId={makeItemId} onSave={onSave} onCancel={jest.fn()} />);

    fireEvent.changeText(screen.getByLabelText(/nombre de la rutina/i), "Pierna casa");
    await waitFor(() => expect(screen.getByDisplayValue("Pierna casa")).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText(/nombre del ejercicio nuevo/i), "Sentadilla");
    await waitFor(() => expect(screen.getByDisplayValue("Sentadilla")).toBeTruthy());
    fireEvent.press(screen.getByRole("button", { name: /agregar ejercicio/i }));

    await waitFor(() => expect(screen.getByText("Sentadilla")).toBeTruthy());
    await waitFor(() => expect(screen.getByRole("button", { name: /guardar/i })).toBeEnabled());

    fireEvent.press(screen.getByRole("button", { name: /guardar/i }));

    expect(onSave).toHaveBeenCalledWith(
      "Pierna casa",
      expect.arrayContaining([expect.objectContaining({ sets: 3, targetReps: 12 })]),
    );
  });

  it("quitar un ejercicio quita el ejercicio de la lista visible y muestra 'Deshacer'", async () => {
    await render(<RoutineEditorScreen makeItemId={makeItemId} onSave={jest.fn()} onCancel={jest.fn()} />);

    fireEvent.changeText(screen.getByLabelText(/nombre del ejercicio nuevo/i), "Sentadilla");
    await waitFor(() => expect(screen.getByDisplayValue("Sentadilla")).toBeTruthy());
    fireEvent.press(screen.getByRole("button", { name: /agregar ejercicio/i }));
    await waitFor(() => expect(screen.getByText("Sentadilla")).toBeTruthy());

    fireEvent.press(screen.getByRole("button", { name: /quitar/i }));

    await waitFor(() => expect(screen.queryByText("Sentadilla")).toBeNull());
    expect(screen.getByRole("button", { name: /deshacer/i })).toBeTruthy();

    // Limpia el `setTimeout` real de 5 s programado por `stageRemoval` (el
    // temporizador de la ventana de "Deshacer" es real de propósito, CA-03.06.1
    // — se prueba con fake timers en `useRoutineEditorStore.undo.test.ts`);
    // aquí solo se evita dejarlo pendiente tras la prueba.
    useRoutineEditorStore.getState().undoRemoval();
  });

  it("llama a onCancel al pulsar 'Cancelar'", async () => {
    const onCancel = jest.fn();
    await render(<RoutineEditorScreen makeItemId={makeItemId} onSave={jest.fn()} onCancel={onCancel} />);

    fireEvent.press(screen.getByRole("button", { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
