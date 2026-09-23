/**
 * RF-01.02 pantalla "Disponibilidad". CA-01.02.1.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AvailabilityScreen } from "../Availability";

describe("RF-01.02 Pantalla de disponibilidad", () => {
  it("CA-01.02.1 con valores válidos por defecto, permite continuar con días/minutos", async () => {
    const onContinue = jest.fn();
    await render(<AvailabilityScreen onContinue={onContinue} step={4} totalSteps={9} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continuar/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
    });
    expect(onContinue.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ daysPerWeek: 3, minutesPerSession: 30 }),
    );
  });

  it("un valor de días fuera de rango (0) deshabilita Continuar", async () => {
    await render(<AvailabilityScreen onContinue={jest.fn()} step={4} totalSteps={9} />);

    await fireEvent.changeText(screen.getByLabelText(/días por semana/i), "0");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
    });
  });
});
