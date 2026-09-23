/**
 * RF-01.04 pantalla "Cuestionario de aptitud" (PAR-Q). CA-01.04.1.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { FitnessQuestionnaireScreen } from "../FitnessQuestionnaire";

describe("RF-01.04 Pantalla de cuestionario de aptitud", () => {
  it("CA-01.04.1 con todas las respuestas 'No', permite continuar sin advertencia", async () => {
    const onContinue = jest.fn();
    await render(<FitnessQuestionnaireScreen onContinue={onContinue} step={7} totalSteps={9} />);

    for (const noButton of screen.getAllByRole("radio", { name: /^no$/i })) {
      await fireEvent.press(noButton);
    }

    expect(screen.queryByRole("alert")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));
    expect(onContinue).toHaveBeenCalledWith([false, false, false]);
  });

  it("CA-01.04.1 con alguna respuesta 'Sí', muestra la recomendación y exige marcar 'Entiendo' para continuar", async () => {
    const onContinue = jest.fn();
    await render(<FitnessQuestionnaireScreen onContinue={onContinue} step={7} totalSteps={9} />);

    const yesButtons = screen.getAllByRole("radio", { name: /^sí$/i });
    await fireEvent.press(yesButtons[0]!);
    const noButtons = screen.getAllByRole("radio", { name: /^no$/i });
    await fireEvent.press(noButtons[1]!);
    await fireEvent.press(noButtons[2]!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /continuar/i })).toBeDisabled();

    await fireEvent.press(screen.getByRole("checkbox", { name: /entiendo/i }));

    expect(screen.getByRole("button", { name: /continuar/i })).toBeEnabled();
    await fireEvent.press(screen.getByRole("button", { name: /continuar/i }));
    expect(onContinue).toHaveBeenCalledWith([true, false, false]);
  });
});
