/**
 * `PermissionDeniedBanner` — CA-04.01.3 "el calendario muestra un aviso con
 * un botón a los ajustes del sistema".
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { PermissionDeniedBanner } from "../PermissionDeniedBanner";

describe("CA-04.01.3 PermissionDeniedBanner", () => {
  it("no muestra nada cuando el permiso no está denegado", async () => {
    await render(<PermissionDeniedBanner visible={false} />);

    expect(screen.queryByText(/notificaciones están desactivadas/i)).toBeNull();
  });

  it("muestra el aviso y el botón a los ajustes cuando el permiso está denegado", async () => {
    const onOpenSettings = jest.fn();
    await render(<PermissionDeniedBanner visible onOpenSettings={onOpenSettings} />);

    expect(screen.getByText(/notificaciones están desactivadas/i)).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: /ajustes/i }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
