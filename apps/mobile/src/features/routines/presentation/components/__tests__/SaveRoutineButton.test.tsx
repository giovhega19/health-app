/**
 * CA-03.01.2 "el botón 'Guardar' está deshabilitado ... se indica qué
 * falta". Componente aislado (no requiere el editor completo).
 *
 * Fase roja: `SaveRoutineButton` (`F03-T16`) todavía no calcula
 * `missingName`/`missingItems` de verdad — estas pruebas deben fallar en la
 * aserción.
 */
import { render, screen } from "@testing-library/react-native";
import { SaveRoutineButton } from "../SaveRoutineButton";

describe("CA-03.01.2 SaveRoutineButton", () => {
  it("está deshabilitado cuando falta el nombre", async () => {
    await render(<SaveRoutineButton name="" itemsCount={1} onSave={jest.fn()} />);

    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("está deshabilitado cuando no hay ejercicios", async () => {
    await render(<SaveRoutineButton name="Pierna casa" itemsCount={0} onSave={jest.fn()} />);

    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("indica qué falta (mensaje de nombre) cuando falta el nombre", async () => {
    await render(<SaveRoutineButton name="" itemsCount={1} onSave={jest.fn()} />);

    expect(screen.getByText(/falta el nombre/i)).toBeTruthy();
  });

  it("habilitado y sin mensajes cuando hay nombre y al menos un ejercicio", async () => {
    await render(<SaveRoutineButton name="Pierna casa" itemsCount={1} onSave={jest.fn()} />);

    expect(screen.getByRole("button", { name: /guardar/i })).toBeEnabled();
  });
});
