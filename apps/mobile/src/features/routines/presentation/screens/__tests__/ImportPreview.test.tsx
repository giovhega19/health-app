/**
 * `ImportPreview` — CA-03.08.2 (importar válido: vista previa + confirmar),
 * CA-03.08.3 (advertencias antes de confirmar) y CA-03.08.4 (versión no
 * soportada). Cierra la brecha H2-QA: `PreviewImportRoutine`/
 * `ConfirmImportRoutine` ya existían pero ninguna pantalla los invocaba.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { err, ok } from "@/shared/domain/Result";
import { Routine } from "../../../domain/Routine";
import { aRoutine } from "@test/fakes/aRoutine";
import { ImportPreviewScreen } from "../ImportPreview";

function aConfirmedRoutine(): Routine {
  const created = Routine.create({ ...aRoutine().withName("Rutina importada").build(), source: "IMPORTED" });
  if (!created.ok) throw new Error("fixture inválido");
  return created.value;
}

describe("ImportPreviewScreen", () => {
  it('CA-03.08.2: elige un archivo, muestra la vista previa (ejercicios, duración) y confirma la importación', async () => {
    const onImported = jest.fn();
    const pickFile = jest.fn(async () => ok({ content: "{}", sizeBytes: 10 }));
    const previewImport = jest.fn(() =>
      ok({ name: "Rutina importada", goal: "GENERAL_HEALTH" as const, level: "BEGINNER" as const, itemCount: 3, estimatedDurationSeconds: 600, warnings: [] }),
    );
    const confirmImport = jest.fn(async () => ok(aConfirmedRoutine()));

    await render(
      <ImportPreviewScreen
        pickFile={pickFile}
        previewImport={previewImport}
        confirmImport={confirmImport}
        onImported={onImported}
        onCancel={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: /elegir archivo/i }));

    await waitFor(() => expect(screen.getByText("Rutina importada")).toBeTruthy());
    expect(screen.getByText(/3 ejercicios/)).toBeTruthy();
    expect(screen.getByText(/10 min/)).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => expect(confirmImport).toHaveBeenCalledWith("{}", 10));
    await waitFor(() => expect(onImported).toHaveBeenCalledWith(expect.objectContaining({ id: expect.anything() })));
  });

  it("CA-03.08.3: muestra la lista de advertencias antes de confirmar", async () => {
    const pickFile = jest.fn(async () => ok({ content: "{}", sizeBytes: 10 }));
    const previewImport = jest.fn(() =>
      ok({
        name: "Rutina con problemas",
        goal: "GENERAL_HEALTH" as const,
        level: "BEGINNER" as const,
        itemCount: 1,
        estimatedDurationSeconds: 120,
        warnings: [
          {
            kind: "UNKNOWN_EXERCISE_CONVERTED" as const,
            message: 'El ejercicio "no-existe" no existe en el catálogo local y se convirtió en ejercicio personalizado.',
            itemRef: "catalog:no-existe",
          },
          {
            kind: "VALUE_CLAMPED" as const,
            message: 'El valor de "reps" (500) se ajustó a 100 (límite de RN-06).',
            itemRef: "catalog:no-existe",
            field: "reps",
          },
        ],
      }),
    );

    await render(
      <ImportPreviewScreen
        pickFile={pickFile}
        previewImport={previewImport}
        confirmImport={jest.fn(async () => ok(aConfirmedRoutine()))}
        onImported={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: /elegir archivo/i }));

    await waitFor(() => expect(screen.getByText(/no existe en el catálogo local/)).toBeTruthy());
    expect(screen.getByText(/se ajustó a 100/)).toBeTruthy();
  });

  it("CA-03.08.4: schemaVersion no soportada muestra el mensaje exacto de la spec y no permite confirmar", async () => {
    const pickFile = jest.fn(async () => ok({ content: "{}", sizeBytes: 10 }));
    const previewImport = jest.fn(() =>
      err({ kind: "UNSUPPORTED_VERSION" as const, fileSchemaVersion: 2, supportedSchemaVersion: 1 }),
    );

    await render(
      <ImportPreviewScreen
        pickFile={pickFile}
        previewImport={previewImport}
        confirmImport={jest.fn(async () => ok(aConfirmedRoutine()))}
        onImported={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: /elegir archivo/i }));

    await waitFor(() =>
      expect(
        screen.getByText("Esta rutina se creó con una versión más nueva de la app. Actualiza para importarla."),
      ).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: /confirmar/i })).toBeNull();
  });

  it("el usuario puede cancelar la selección de archivo sin mostrar error ni vista previa", async () => {
    const pickFile = jest.fn(async () => ok(null));

    await render(
      <ImportPreviewScreen
        pickFile={pickFile}
        previewImport={jest.fn()}
        confirmImport={jest.fn(async () => ok(aConfirmedRoutine()))}
        onImported={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: /elegir archivo/i }));

    await waitFor(() => expect(pickFile).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button", { name: /confirmar/i })).toBeNull();
  });

  it("llama a onCancel al pulsar 'Cancelar'", async () => {
    const onCancel = jest.fn();
    await render(
      <ImportPreviewScreen
        pickFile={jest.fn(async () => ok(null))}
        previewImport={jest.fn()}
        confirmImport={jest.fn(async () => ok(aConfirmedRoutine()))}
        onImported={jest.fn()}
        onCancel={onCancel}
      />,
    );

    await fireEvent.press(screen.getByRole("button", { name: /^cancelar$/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
