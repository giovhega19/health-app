/**
 * `WeeklyCalendar` — CA-04.01.1 "los días sin programación se muestran como
 * 'Descanso'".
 */
import { render, screen } from "@testing-library/react-native";
import { WeeklyCalendarScreen } from "../WeeklyCalendar";

describe("CA-04.01.1 WeeklyCalendarScreen", () => {
  it("muestra 'Descanso' en los días sin programación y el nombre de la rutina en los que sí", async () => {
    await render(
      <WeeklyCalendarScreen
        days={[
          { day: 1, routineName: "Pierna casa" },
          { day: 2, routineName: null },
        ]}
        permissionDenied={false}
      />,
    );

    expect(screen.getByText("Pierna casa")).toBeTruthy();
    expect(screen.getByText("Descanso")).toBeTruthy();
  });

  it("muestra el aviso de permiso denegado cuando corresponde", async () => {
    await render(<WeeklyCalendarScreen days={[]} permissionDenied />);

    expect(screen.getByText(/notificaciones están desactivadas/i)).toBeTruthy();
  });
});
