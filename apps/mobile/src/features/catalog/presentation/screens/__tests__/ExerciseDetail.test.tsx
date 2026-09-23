/**
 * RF-02.01 pantalla "Detalle de ejercicio". CA-02.01.1.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ExerciseDetailScreen } from "../ExerciseDetail";
import { EXERCISE_IDS, seedExercises } from "@test/fakes/aCatalogSnapshot";

describe("RF-02.01 Pantalla de detalle de ejercicio", () => {
  it('CA-02.01.1 "Flexión de pecho" muestra animación, grupos musculares, equipo, dificultad, pasos, errores comunes y botón "Ver video"', async () => {
    const pushUp = seedExercises().find((exercise) => exercise.id === EXERCISE_IDS.pushUp)!;
    const onWatchVideo = jest.fn();

    await render(<ExerciseDetailScreen exercise={pushUp} onWatchVideo={onWatchVideo} />);

    expect(screen.getByText("Flexión de pecho")).toBeTruthy();
    expect(screen.getByText(/CHEST/)).toBeTruthy();
    expect(screen.getByText(/NONE/)).toBeTruthy();
    expect(screen.getByText(pushUp.instructions[0]!, { exact: false })).toBeTruthy();
    expect(screen.getByText(pushUp.commonMistakes[0]!, { exact: false })).toBeTruthy();

    const watchVideoButton = screen.getByRole("button", { name: /ver video/i });
    await fireEvent.press(watchVideoButton);
    expect(onWatchVideo).toHaveBeenCalledWith(pushUp.videoUrl);
  });

  it('CA-02.01.1 un ejercicio sin video (p. ej. "Remo con mancuerna") no ofrece el botón "Ver video"', async () => {
    const dumbbellRow = seedExercises().find((exercise) => exercise.id === EXERCISE_IDS.dumbbellRow)!;

    await render(<ExerciseDetailScreen exercise={dumbbellRow} onWatchVideo={jest.fn()} />);

    expect(screen.queryByRole("button", { name: /ver video/i })).toBeNull();
  });
});
