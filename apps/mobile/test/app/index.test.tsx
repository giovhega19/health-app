import { render, screen } from "@testing-library/react-native";

import IndexScreen from "../../app/index";

describe("IndexScreen", () => {
  // @testing-library/react-native v14+: render() es asíncrono. No hay un
  // patrón establecido en este proyecto para interceptar `useRouter().push`
  // en pruebas (jest-expo no lo mockea con jest.fn()), así que esta prueba
  // se limita a confirmar que el menú expone las tres secciones navegables
  // con roles/labels accesibles — el comportamiento real de navegación de
  // Expo Router ya está cubierto por el propio framework, no por FitApp.
  it("renderiza el título y un botón navegable por cada sección de H1", async () => {
    await render(<IndexScreen />);

    expect(screen.getByText("FitApp")).toBeTruthy();
    expect(screen.getByRole("button", { name: /empezar onboarding/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /ver catálogo/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /mi perfil/i })).toBeTruthy();
  });
});
