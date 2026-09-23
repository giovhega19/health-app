/**
 * RF-01.02 pantalla "Equipo" (multi-selección). CA-01.02.1.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { EquipmentScreen } from "../Equipment";

describe("RF-01.02 Pantalla de equipo", () => {
  it("CA-01.02.1 permite seleccionar más de un equipo (multi-selección) y continuar sin seleccionar ninguno", async () => {
    const onToggle = jest.fn();
    const onContinue = jest.fn();
    await render(
      <EquipmentScreen selected={["DUMBBELLS"]} onToggle={onToggle} onContinue={onContinue} step={5} totalSteps={9} />,
    );

    expect(screen.getByRole("checkbox", { name: /mancuernas/i })).toBeTruthy();
    await fireEvent.press(screen.getByRole("checkbox", { name: /barra de dominadas/i }));
    expect(onToggle).toHaveBeenCalledWith("PULL_UP_BAR");

    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
