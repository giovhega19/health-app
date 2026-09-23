/**
 * RF-01.02 pantalla "Objetivo". CA-01.02.1: máximo una pregunta por
 * pantalla, se puede retroceder.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { GoalScreen } from "../Goal";

describe("RF-01.02 Pantalla de objetivo", () => {
  it("CA-01.02.1 el botón Continuar está deshabilitado hasta elegir un objetivo", async () => {
    const onContinue = jest.fn();
    await render(<GoalScreen selected={null} onSelect={jest.fn()} onContinue={onContinue} step={2} totalSteps={9} />);

    expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();
  });

  it("CA-01.02.1 al elegir un objetivo y continuar, se invoca onSelect/onContinue", async () => {
    const onSelect = jest.fn();
    const onContinue = jest.fn();
    await render(<GoalScreen selected="MUSCLE_GAIN" onSelect={onSelect} onContinue={onContinue} step={2} totalSteps={9} />);

    await fireEvent.press(screen.getByRole("radio", { name: /ganar músculo/i }));
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("CA-01.02.1 permite retroceder cuando se provee onBack", async () => {
    const onBack = jest.fn();
    await render(
      <GoalScreen selected={null} onSelect={jest.fn()} onContinue={jest.fn()} onBack={onBack} step={2} totalSteps={9} />,
    );

    await fireEvent.press(screen.getByRole("button", { name: /atrás/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
