/**
 * RF-01.02 pantalla "Bienvenida" (`spec.md` "Flujo de onboarding": primer
 * paso del asistente). CA-01.02.1 (onboarding invitado completo) empieza
 * aquí.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { WelcomeScreen } from "../Welcome";

describe("RF-01.02 Pantalla de bienvenida", () => {
  it("CA-01.02.1 muestra el saludo y permite iniciar el onboarding", async () => {
    const onStart = jest.fn();
    await render(<WelcomeScreen onStart={onStart} />);

    expect(screen.getByRole("header")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /empezar/i }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
