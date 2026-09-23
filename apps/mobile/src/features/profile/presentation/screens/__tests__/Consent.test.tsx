/**
 * RF-01.07 pantalla de consentimiento (`features/profile/presentation/screens/Consent.tsx`,
 * tarea `F01-T14`, todavía no implementada: esta prueba falla ahora mismo
 * con "Cannot find module '../Consent'", el estado rojo esperado).
 *
 * CA-01.07.1 Consentimiento obligatorio: "no marco el consentimiento de
 * tratamiento de datos de salud -> el botón 'Continuar' está deshabilitado
 * y un texto explica por qué es necesario" (Art. 5.3). Nivel elegido:
 * componente (React Native Testing Library, incluye accesibilidad: roles y
 * labels, 07-estrategia-pruebas.md §1).
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ConsentScreen } from "../Consent";

describe("RF-01.07 Pantalla de consentimiento", () => {
  it("CA-01.07.1 con el consentimiento sin marcar, el botón Continuar está deshabilitado y un texto explica por qué", async () => {
    await render(<ConsentScreen onAccept={jest.fn()} />);

    const continueButton = screen.getByRole("button", { name: /continuar/i });

    expect(continueButton).toBeDisabled();
    expect(screen.getByText(/necesitamos tu consentimiento/i)).toBeTruthy();
  });

  it("CA-01.07.1 al marcar el consentimiento, el botón Continuar se habilita", async () => {
    await render(<ConsentScreen onAccept={jest.fn()} />);

    await fireEvent.press(
      screen.getByRole("checkbox", { name: /acepto el tratamiento de mis datos de salud/i }),
    );

    expect(screen.getByRole("button", { name: /continuar/i })).toBeEnabled();
  });

  it("CA-01.07.1 al presionar Continuar con el consentimiento marcado, se invoca onAccept", async () => {
    const onAccept = jest.fn();
    await render(<ConsentScreen onAccept={onAccept} />);

    await fireEvent.press(
      screen.getByRole("checkbox", { name: /acepto el tratamiento de mis datos de salud/i }),
    );
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
