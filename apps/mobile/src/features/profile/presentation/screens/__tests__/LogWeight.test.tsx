/**
 * RF-01.06 pantalla "Registrar peso". CA-01.06.1: registra el peso del día
 * (25-350 kg); si ya existía un registro de hoy, se reemplaza (comportamiento
 * de `LogBodyWeight`, ya probado en su propio archivo — esta pantalla solo
 * cubre la validación de entrada y el envío del valor numérico).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { LogWeightScreen } from "../LogWeight";

describe("RF-01.06 Pantalla de registrar peso", () => {
  it("CA-01.06.1 con un peso válido, permite guardar y envía el valor numérico", async () => {
    const onSubmit = jest.fn();
    await render(<LogWeightScreen onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByLabelText(/peso de hoy/i), "59.5");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardar/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /guardar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(59.5);
    });
  });

  it("con un peso fuera de rango (25-350 kg), el botón queda deshabilitado y muestra el error", async () => {
    await render(<LogWeightScreen onSubmit={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText(/peso de hoy/i), "5");

    await waitFor(() => {
      expect(screen.getByText(/25 y 350 kg/i)).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
  });

  it("mientras submitting, el botón de guardar queda deshabilitado", async () => {
    await render(<LogWeightScreen onSubmit={jest.fn()} submitting />);

    await fireEvent.changeText(screen.getByLabelText(/peso de hoy/i), "59.5");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled();
    });
  });
});
