/**
 * RF-01.02 pantalla "Nivel". CA-01.02.1: máximo una pregunta por pantalla.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { LevelScreen } from "../Level";

describe("RF-01.02 Pantalla de nivel", () => {
  it("CA-01.02.1 muestra las tres opciones de nivel y permite seleccionar una", async () => {
    const onSelect = jest.fn();
    await render(<LevelScreen selected={null} onSelect={onSelect} onContinue={jest.fn()} step={3} totalSteps={9} />);

    await fireEvent.press(screen.getByRole("radio", { name: /principiante/i }));

    expect(onSelect).toHaveBeenCalledWith("BEGINNER");
  });
});
