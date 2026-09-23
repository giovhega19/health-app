/**
 * RF-02.02 pantalla "Filtros". CA-02.02.1: filtro combinado (grupo muscular +
 * equipo) y conteo de resultados anunciado.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";
import { FiltersScreen } from "../Filters";

describe("RF-02.02 Pantalla de filtros", () => {
  it("CA-02.02.1 permite elegir grupo muscular = PECHO y equipo = NONE (filtro combinado)", async () => {
    const onChangeMuscleGroup = jest.fn();
    const onChangeEquipment = jest.fn();
    await render(
      <FiltersScreen
        muscleGroup={null}
        equipment={null}
        resultCount={8}
        onChangeMuscleGroup={onChangeMuscleGroup}
        onChangeEquipment={onChangeEquipment}
        onApply={jest.fn()}
        onClear={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole("radio", { name: "CHEST" }));
    expect(onChangeMuscleGroup).toHaveBeenCalledWith("CHEST");

    await fireEvent.press(screen.getByRole("radio", { name: "NONE" }));
    expect(onChangeEquipment).toHaveBeenCalledWith("NONE");
  });

  it("CA-02.02.1 el conteo de resultados se anuncia al lector de pantalla", async () => {
    await render(
      <FiltersScreen
        muscleGroup="CHEST"
        equipment="NONE"
        resultCount={2}
        onChangeMuscleGroup={jest.fn()}
        onChangeEquipment={jest.fn()}
        onApply={jest.fn()}
        onClear={jest.fn()}
      />,
    );

    expect(screen.getByText("2 ejercicios encontrados")).toBeTruthy();
  });

  it("permite aplicar y limpiar los filtros", async () => {
    const onApply = jest.fn();
    const onClear = jest.fn();
    await render(
      <FiltersScreen
        muscleGroup={null}
        equipment={null}
        resultCount={8}
        onChangeMuscleGroup={jest.fn()}
        onChangeEquipment={jest.fn()}
        onApply={onApply}
        onClear={onClear}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: /aplicar/i }));
    expect(onApply).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole("button", { name: /limpiar filtros/i }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
