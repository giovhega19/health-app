/**
 * `CatalogNavigator` (RF-02.01/RF-02.02, tarea `F02-T15`). Prueba de
 * integración: lista -> filtros -> detalle, con `InMemoryExerciseRepository`
 * (sin SQLite real, ya cubierto en pruebas de infraestructura).
 * CA-02.01.1, CA-02.02.1.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { createCatalogContainer } from "@/features/catalog";
import { CatalogNavigator } from "../CatalogNavigator";
import { InMemoryExerciseRepository } from "@test/fakes/InMemoryExerciseRepository";
import { InMemoryPredefinedRoutineRepository } from "@test/fakes/InMemoryPredefinedRoutineRepository";
import { FakeCatalogManifestPort } from "@test/fakes/FakeCatalogManifestPort";
import { FakeMediaCachePort } from "@test/fakes/FakeMediaCachePort";
import { seedExercises } from "@test/fakes/aCatalogSnapshot";

function buildContainer() {
  const exerciseRepository = new InMemoryExerciseRepository(seedExercises());
  const catalog = createCatalogContainer({
    exerciseRepository,
    routineRepository: new InMemoryPredefinedRoutineRepository(),
    manifestPort: new FakeCatalogManifestPort(),
    mediaCachePort: new FakeMediaCachePort(),
  });
  return { catalog };
}

describe("RF-02.01/RF-02.02 CatalogNavigator", () => {
  it("CA-02.01.1 navega de la lista al detalle de un ejercicio con botón Ver video", async () => {
    const { catalog } = buildContainer();
    await render(<CatalogNavigator container={{ catalog }} />);

    await waitFor(() => {
      expect(screen.getByText("Flexión de pecho")).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole("button", { name: "Flexión de pecho" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /ver video/i })).toBeTruthy();
    });
  });

  it("CA-02.02.1 aplica un filtro combinado (grupo muscular + equipo) desde la pantalla de filtros", async () => {
    const { catalog } = buildContainer();
    await render(<CatalogNavigator container={{ catalog }} />);

    await waitFor(() => {
      expect(screen.getByText(/8 ejercicios encontrados/)).toBeTruthy();
    });
    await fireEvent.press(screen.getByRole("button", { name: /filtros/i }));

    await fireEvent.press(screen.getByRole("radio", { name: "LEGS" }));
    await fireEvent.press(screen.getByRole("radio", { name: "NONE" }));
    await fireEvent.press(screen.getByRole("button", { name: /aplicar/i }));

    await waitFor(() => {
      expect(screen.getByText(/1 ejercicios encontrados/)).toBeTruthy();
    });
    expect(screen.getByText("Zancadas")).toBeTruthy();
  });
});
