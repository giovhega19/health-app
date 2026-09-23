/**
 * RF-01.01 pantalla "Iniciar sesión". CA-01.08.1 (última línea): tras
 * eliminar la cuenta, un intento de inicio de sesión con esas credenciales
 * muestra "El correo o la contraseña no son correctos.". También cubre el
 * estado "Email ya registrado: se ofrece iniciar sesión" (`spec.md` "Estados
 * de UI"): esta pantalla es a la que se llega desde ese estado.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { LoginScreen } from "../Login";

describe("RF-01.01 Pantalla de inicio de sesión", () => {
  it("con email/contraseña válidos, permite continuar", async () => {
    const onSubmit = jest.fn();
    await render(<LoginScreen onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByLabelText(/correo electrónico/i), "ana@fitapp.test");
    await fireEvent.changeText(screen.getByLabelText(/contraseña/i), "password123");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ email: "ana@fitapp.test", password: "password123" });
  });

  it("con un correo inválido, el botón queda deshabilitado", async () => {
    await render(<LoginScreen onSubmit={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText(/correo electrónico/i), "no-es-un-correo");
    await fireEvent.changeText(screen.getByLabelText(/contraseña/i), "password123");

    await waitFor(() => {
      expect(screen.getByText(/correo válido/i)).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeDisabled();
  });

  it("CA-01.08.1 con errorCode AUTH_INVALID_CREDENTIALS, muestra el mensaje de credenciales inválidas", async () => {
    await render(<LoginScreen onSubmit={jest.fn()} errorCode="AUTH_INVALID_CREDENTIALS" />);

    expect(screen.getByText(/el correo o la contraseña no son correctos/i)).toBeTruthy();
  });

  it("sin error, no muestra el mensaje de credenciales inválidas", async () => {
    await render(<LoginScreen onSubmit={jest.fn()} />);

    expect(screen.queryByText(/el correo o la contraseña no son correctos/i)).toBeNull();
  });

  it("con onBack, muestra el botón Atrás y lo invoca al presionarlo", async () => {
    const onBack = jest.fn();
    await render(<LoginScreen onSubmit={jest.fn()} onBack={onBack} />);

    await fireEvent.press(screen.getByRole("button", { name: /atrás/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("mientras submitting, el botón de enviar queda deshabilitado", async () => {
    await render(<LoginScreen onSubmit={jest.fn()} submitting />);

    await fireEvent.changeText(screen.getByLabelText(/correo electrónico/i), "ana@fitapp.test");
    await fireEvent.changeText(screen.getByLabelText(/contraseña/i), "password123");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /iniciar sesión/i })).toBeDisabled();
    });
  });
});
