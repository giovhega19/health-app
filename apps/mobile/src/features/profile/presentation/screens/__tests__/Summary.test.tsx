/**
 * RF-01.05 pantalla "Resumen". CA-01.05.1 (IMC/TMB de referencia con aviso
 * "Estimación, no es consejo médico") y CA-01.02.1 (plan semanal propuesto
 * visible antes de elegir cuenta/invitado).
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SummaryScreen } from "../Summary";

describe("RF-01.05 Pantalla de resumen", () => {
  it('CA-01.05.1 con un perfil de 30 años, FEMALE, 165 cm y 60 kg, muestra IMC 22,0 "Normal", TMB 1320 y el aviso de estimación', async () => {
    await render(
      <SummaryScreen
        bmi={22.0}
        bmiCategory="NORMAL"
        bmr={1320}
        plan={[{ dayNumber: 1, durationMinutes: 45 }]}
        onCreateAccount={jest.fn()}
        onContinueAsGuest={jest.fn()}
      />,
    );

    expect(screen.getByText(/22\.0 \(Normal\)/)).toBeTruthy();
    expect(screen.getByText(/1320/)).toBeTruthy();
    expect(screen.getByText(/estimación, no es consejo médico/i)).toBeTruthy();
  });

  it("CA-01.02.1 muestra el plan semanal propuesto por día", async () => {
    await render(
      <SummaryScreen
        bmi={22}
        bmiCategory="NORMAL"
        bmr={1320}
        plan={[
          { dayNumber: 1, durationMinutes: 45 },
          { dayNumber: 2, durationMinutes: 60 },
        ]}
        onCreateAccount={jest.fn()}
        onContinueAsGuest={jest.fn()}
      />,
    );

    expect(screen.getByText(/día 1/i)).toBeTruthy();
    expect(screen.getByText(/día 2/i)).toBeTruthy();
  });

  it("CA-01.02.1 permite elegir crear cuenta o continuar como invitado", async () => {
    const onCreateAccount = jest.fn();
    const onContinueAsGuest = jest.fn();
    await render(
      <SummaryScreen
        bmi={22}
        bmiCategory="NORMAL"
        bmr={1320}
        plan={null}
        onCreateAccount={onCreateAccount}
        onContinueAsGuest={onContinueAsGuest}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: /continuar como invitado/i }));
    expect(onContinueAsGuest).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole("button", { name: /crear cuenta/i }));
    expect(onCreateAccount).toHaveBeenCalledTimes(1);
  });
});
