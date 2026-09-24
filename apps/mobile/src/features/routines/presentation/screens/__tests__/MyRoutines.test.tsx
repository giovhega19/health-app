/**
 * `MyRoutines` — RF-03.01…RF-03.06, pantalla "Mis rutinas".
 * CA-03.01.1 (muestra la duración estimada) y CA-03.05.1 ("Duplicar y
 * editar" sobre rutinas PREDEFINED).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ok } from "@/shared/domain/Result";
import { MyRoutinesScreen } from "../MyRoutines";
import type { RoutineListItem } from "../MyRoutines";

function anOwnItem(overrides: Partial<RoutineListItem> = {}): RoutineListItem {
  return {
    id: "00000000-0000-4000-a000-000000000001",
    name: "Pierna casa",
    itemCount: 2,
    estimatedDurationSeconds: 600,
    source: "USER",
    ...overrides,
  };
}

function aPredefinedItem(overrides: Partial<RoutineListItem> = {}): RoutineListItem {
  return {
    id: "00000000-0000-4000-a000-000000000002",
    name: "Cuerpo completo sin equipo",
    itemCount: 4,
    estimatedDurationSeconds: 900,
    source: "PREDEFINED",
    ...overrides,
  };
}

describe("MyRoutinesScreen", () => {
  it("muestra el estado vacío cuando no hay rutinas", async () => {
    await render(
      <MyRoutinesScreen loadItems={async () => ok([])} onCreate={jest.fn()} onImport={jest.fn()} onDuplicate={jest.fn()} />,
    );

    await waitFor(() => expect(screen.getByText(/todavía no tienes rutinas/i)).toBeTruthy());
  });

  it("CA-03.01.1: lista las rutinas cargadas mostrando la duración estimada", async () => {
    await render(
      <MyRoutinesScreen
        loadItems={async () => ok([anOwnItem()])}
        onCreate={jest.fn()}
        onImport={jest.fn()}
        onDuplicate={jest.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText("Pierna casa")).toBeTruthy());
    // 600s = 10 min (RN-07, `estimateRoutineDurationSeconds`).
    expect(screen.getByText(/10 min/)).toBeTruthy();
  });

  it("llama a onCreate al pulsar 'Crear rutina'", async () => {
    const onCreate = jest.fn();
    await render(
      <MyRoutinesScreen loadItems={async () => ok([])} onCreate={onCreate} onImport={jest.fn()} onDuplicate={jest.fn()} />,
    );

    fireEvent.press(screen.getByRole("button", { name: /crear rutina/i }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("llama a onImport al pulsar 'Importar'", async () => {
    const onImport = jest.fn();
    await render(
      <MyRoutinesScreen loadItems={async () => ok([])} onCreate={jest.fn()} onImport={onImport} onDuplicate={jest.fn()} />,
    );

    fireEvent.press(screen.getByRole("button", { name: /^importar$/i }));

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('CA-03.05.1: ofrece "Duplicar y editar" sobre una rutina PREDEFINED y llama a onDuplicate con su id', async () => {
    const onDuplicate = jest.fn();
    const predefined = aPredefinedItem();
    await render(
      <MyRoutinesScreen
        loadItems={async () => ok([predefined])}
        onCreate={jest.fn()}
        onImport={jest.fn()}
        onDuplicate={onDuplicate}
      />,
    );

    await waitFor(() => expect(screen.getByText(/cuerpo completo sin equipo/i)).toBeTruthy());
    fireEvent.press(screen.getByRole("button", { name: /duplicar y editar/i }));

    expect(onDuplicate).toHaveBeenCalledWith(predefined.id);
  });

  it("no ofrece 'Duplicar y editar' sobre una rutina propia (source USER)", async () => {
    await render(
      <MyRoutinesScreen
        loadItems={async () => ok([anOwnItem()])}
        onCreate={jest.fn()}
        onImport={jest.fn()}
        onDuplicate={jest.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByText("Pierna casa")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /duplicar y editar/i })).toBeNull();
  });
});
