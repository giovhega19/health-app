/**
 * RF-01.03/RF-01.06 pantalla "Editar perfil". Precarga los valores actuales
 * y permite cambiar objetivo, nivel, disponibilidad, estatura, equipo y peso
 * objetivo.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { EditProfileScreen } from "../EditProfile";
import type { EditProfileCurrentValues } from "../EditProfile";

const CURRENT_VALUES: EditProfileCurrentValues = {
  goal: "GENERAL_HEALTH",
  level: "BEGINNER",
  daysPerWeek: 3,
  minutesPerSession: 30,
  heightCm: 165,
  equipment: ["NONE"],
  targetWeightKg: null,
};

describe("RF-01.03/RF-01.06 Pantalla de editar perfil", () => {
  it("precarga los valores actuales del perfil", async () => {
    await render(<EditProfileScreen currentValues={CURRENT_VALUES} onSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/días por semana/i).props.value).toBe("3");
    expect(screen.getByLabelText(/minutos por sesión/i).props.value).toBe("30");
    expect(screen.getByLabelText(/estatura \(cm\)/i).props.value).toBe("165");
    expect(screen.getByRole("radio", { name: "Salud general" })).toBeSelected();
    expect(screen.getByRole("radio", { name: "Principiante" })).toBeSelected();
    expect(screen.getByRole("checkbox", { name: "Sin equipo" })).toBeSelected();
  });

  it("permite cambiar objetivo, nivel y equipo, y envía los valores actualizados", async () => {
    const onSubmit = jest.fn();
    await render(<EditProfileScreen currentValues={CURRENT_VALUES} onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByRole("radio", { name: "Ganar fuerza" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Intermedio" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Mancuernas" }));
    await fireEvent.changeText(screen.getByLabelText(/peso objetivo/i), "58");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          goal: "STRENGTH",
          level: "INTERMEDIATE",
          daysPerWeek: 3,
          minutesPerSession: 30,
          heightCm: 165,
          equipment: ["NONE", "DUMBBELLS"],
          targetWeightKg: 58,
        }),
      );
    });
  });

  it("con una estatura fuera de rango, deshabilita el botón de guardar", async () => {
    await render(<EditProfileScreen currentValues={CURRENT_VALUES} onSubmit={jest.fn()} />);

    await fireEvent.changeText(screen.getByLabelText(/estatura \(cm\)/i), "50");

    await waitFor(() => {
      expect(screen.getByText(/100 y 250 cm/i)).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeDisabled();
  });

  it("con el peso objetivo vacío, envía null (campo opcional)", async () => {
    const onSubmit = jest.fn();
    await render(<EditProfileScreen currentValues={CURRENT_VALUES} onSubmit={onSubmit} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeEnabled();
    });
    await fireEvent.press(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ targetWeightKg: null }));
    });
  });

  it("mientras submitting, el botón de guardar queda deshabilitado", async () => {
    await render(<EditProfileScreen currentValues={CURRENT_VALUES} onSubmit={jest.fn()} submitting />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeDisabled();
    });
  });
});
