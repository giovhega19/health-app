/**
 * RF-02.01/RF-02.02 pantalla "Lista de ejercicios". CA-02.02.1 (el número de
 * resultados se anuncia al lector de pantalla).
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ExerciseListScreen } from "../ExerciseList";
import { seedExercises } from "@test/fakes/aCatalogSnapshot";

describe("RF-02.02 Pantalla de lista de ejercicios", () => {
  it("CA-02.02.1 anuncia el número de resultados al lector de pantalla", async () => {
    const exercises = seedExercises();

    await render(<ExerciseListScreen exercises={exercises} onSelectExercise={jest.fn()} onOpenFilters={jest.fn()} />);

    expect(screen.getByText(`${String(exercises.length)} ejercicios encontrados`)).toBeTruthy();
    expect(screen.getByText("Flexión de pecho")).toBeTruthy();
  });

  it("al presionar un ejercicio, invoca onSelectExercise con su id", async () => {
    const exercises = seedExercises();
    const onSelectExercise = jest.fn();

    await render(<ExerciseListScreen exercises={exercises} onSelectExercise={onSelectExercise} onOpenFilters={jest.fn()} />);

    await fireEvent.press(screen.getByRole("button", { name: "Flexión de pecho" }));

    expect(onSelectExercise).toHaveBeenCalledWith(exercises[0]!.id);
  });

  it("con una lista vacía (filtros sin resultados), muestra el mensaje vacío", async () => {
    await render(<ExerciseListScreen exercises={[]} onSelectExercise={jest.fn()} onOpenFilters={jest.fn()} />);

    expect(screen.getByText("0 ejercicios encontrados")).toBeTruthy();
    expect(screen.getByText(/no hay ejercicios/i)).toBeTruthy();
  });

  it("permite abrir la pantalla de filtros", async () => {
    const onOpenFilters = jest.fn();
    await render(<ExerciseListScreen exercises={[]} onSelectExercise={jest.fn()} onOpenFilters={onOpenFilters} />);

    await fireEvent.press(screen.getByRole("button", { name: /filtros/i }));

    expect(onOpenFilters).toHaveBeenCalledTimes(1);
  });
});
