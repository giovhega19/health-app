/**
 * RF-01.02 pantalla "Permiso de notificaciones" (en contexto, último paso
 * del onboarding antes de Inicio, `spec.md` "Flujo de onboarding").
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { NotificationsPermissionScreen } from "../NotificationsPermission";

describe("RF-01.02 Pantalla de permiso de notificaciones", () => {
  it("CA-01.02.1 permite activar notificaciones u omitir y continuar a Inicio", async () => {
    const onAllow = jest.fn();
    const onSkip = jest.fn();
    await render(<NotificationsPermissionScreen onAllow={onAllow} onSkip={onSkip} />);

    await fireEvent.press(screen.getByRole("button", { name: /ahora no/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole("button", { name: /activar notificaciones/i }));
    expect(onAllow).toHaveBeenCalledTimes(1);
  });
});
