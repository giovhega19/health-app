/**
 * RF-01.01 pantalla "Crear cuenta". CA-01.01.1 (pasar de invitado a cuenta).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccountChoiceScreen } from "../AccountChoice";

describe("RF-01.01 Pantalla de crear cuenta", () => {
  it("CA-01.01.1 con email/contraseña válidos, permite continuar", async () => {
    const onSubmit = jest.fn();
    await render(<AccountChoiceScreen onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByLabelText(/correo electrónico/i), "user@example.com");
    await fireEvent.changeText(screen.getByLabelText(/contraseña/i), "password123");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ email: "user@example.com", password: "password123" }),
    );
  });

  it("con una contraseña de menos de 8 caracteres, el botón queda deshabilitado", async () => {
    await render(<AccountChoiceScreen onSubmit={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText(/correo electrónico/i), "user@example.com");
    await fireEvent.changeText(screen.getByLabelText(/contraseña/i), "short");

    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeDisabled();
  });
});
