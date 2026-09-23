/**
 * RF-01.08 pantalla "Eliminar cuenta" (HU-01.4). CA-01.08.1: "elijo
 * 'Eliminar cuenta' y confirmo escribiendo 'ELIMINAR'" — el botón de
 * confirmación permanece deshabilitado hasta escribir exactamente esa
 * palabra.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { DeleteAccountConfirmationScreen } from "../DeleteAccountConfirmation";

describe("RF-01.08 Pantalla de confirmación de eliminar cuenta (HU-01.4)", () => {
  it("el botón de confirmar empieza deshabilitado", async () => {
    await render(<DeleteAccountConfirmationScreen onConfirm={jest.fn()} />);

    expect(screen.getByRole("button", { name: /eliminar cuenta/i })).toBeDisabled();
  });

  it("con un texto distinto de ELIMINAR, el botón sigue deshabilitado", async () => {
    await render(<DeleteAccountConfirmationScreen onConfirm={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText(/escribe "eliminar"/i), "eliminar");

    expect(screen.getByRole("button", { name: /eliminar cuenta/i })).toBeDisabled();
  });

  it("CA-01.08.1 al escribir exactamente ELIMINAR, habilita el botón y lo invoca al presionarlo", async () => {
    const onConfirm = jest.fn();
    await render(<DeleteAccountConfirmationScreen onConfirm={onConfirm} />);

    await fireEvent.changeText(screen.getByLabelText(/escribe "eliminar"/i), "ELIMINAR");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /eliminar cuenta/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /eliminar cuenta/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("con onCancel, muestra el botón Cancelar y lo invoca al presionarlo", async () => {
    const onCancel = jest.fn();
    await render(<DeleteAccountConfirmationScreen onConfirm={jest.fn()} onCancel={onCancel} />);

    await fireEvent.press(screen.getByRole("button", { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("mientras submitting, el botón de confirmar queda deshabilitado aun con el texto correcto", async () => {
    await render(<DeleteAccountConfirmationScreen onConfirm={jest.fn()} submitting />);

    await fireEvent.changeText(screen.getByLabelText(/escribe "eliminar"/i), "ELIMINAR");

    expect(screen.getByRole("button", { name: /eliminar cuenta/i })).toBeDisabled();
  });
});
