/**
 * RF-01.03 pantalla "Datos corporales". CA-01.03.1 (edad mínima 16 años) y
 * CA-01.03.2 (unidades: imperial ft/in/lb se convierte a cm/kg).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { BodyDataScreen } from "../BodyData";

describe("RF-01.03 Pantalla de datos corporales", () => {
  it("CA-01.03.1 con una fecha de nacimiento que da menos de 16 años, Continuar queda deshabilitado y se explica por qué", async () => {
    await render(<BodyDataScreen unitSystem="METRIC" onContinue={jest.fn()} step={6} totalSteps={9} />);

    await fireEvent.changeText(screen.getByLabelText(/fecha de nacimiento/i), "2015-01-01");
    await fireEvent.changeText(screen.getByLabelText(/estatura \(cm\)/i), "165");
    await fireEvent.changeText(screen.getByLabelText(/peso \(kg\)/i), "60");

    await waitFor(() => {
      expect(screen.getByText(/edad mínima de 16 años/i)).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
  });

  it("CA-01.03.1 con una fecha de nacimiento válida (edad >= 16), permite continuar", async () => {
    const onContinue = jest.fn();
    await render(<BodyDataScreen unitSystem="METRIC" onContinue={onContinue} step={6} totalSteps={9} />);

    await fireEvent.changeText(screen.getByLabelText(/fecha de nacimiento/i), "1996-01-15");
    await fireEvent.changeText(screen.getByLabelText(/estatura \(cm\)/i), "165");
    await fireEvent.changeText(screen.getByLabelText(/peso \(kg\)/i), "60");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continuar/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({ birthDate: "1996-01-15", heightCm: 165, weightKg: 60 }),
      );
    });
  });

  it("CA-01.03.2 con sistema imperial, convierte 5 ft 9 in y 165 lb a cm/kg", async () => {
    const onContinue = jest.fn();
    await render(<BodyDataScreen unitSystem="IMPERIAL" onContinue={onContinue} step={6} totalSteps={9} />);

    await fireEvent.changeText(screen.getByLabelText(/fecha de nacimiento/i), "1996-01-15");
    await fireEvent.changeText(screen.getByLabelText(/estatura \(cm\) \(ft\)/i), "5");
    await fireEvent.changeText(screen.getByLabelText(/estatura \(cm\) \(in\)/i), "9");
    await fireEvent.changeText(screen.getByLabelText(/peso \(kg\) \(lb\)/i), "165");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continuar/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
    const result = onContinue.mock.calls[0][0];
    expect(result.heightCm).toBeCloseTo(175.3, 0);
    expect(result.weightKg).toBeCloseTo(74.8, 0);
  });
});
