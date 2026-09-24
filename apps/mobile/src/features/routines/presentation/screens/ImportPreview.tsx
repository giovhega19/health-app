import { useState } from "react";
import { Text, View } from "react-native";
import { isOk } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import { strings } from "@/shared/i18n";
import type { RoutineImportPreview } from "../../application/PreviewImportRoutine";
import type { FileGateway, PickedFile } from "../../application/ports";
import type { ImportError, ImportWarning, RepositoryError, RoutineValidationError } from "../../domain/errors";
import type { Routine } from "../../domain/Routine";

/**
 * `ImportPreview` (CA-03.08.2/CA-03.08.3/CA-03.08.4, cierre de brecha H2-QA:
 * `PreviewImportRoutine`/`ConfirmImportRoutine` ya estaban implementados y
 * probados en aislamiento, pero ninguna pantalla los invocaba — nadie podía
 * importar una rutina de verdad). Flujo de dos fases (`spec.md`
 * §"Diseño técnico relevante"): "Elegir archivo" -> vista previa (ejercicios,
 * duración, advertencias) -> "Confirmar" (persiste con `source = IMPORTED`).
 * Si `schemaVersion` no es soportada, se muestra el mensaje exacto de
 * `spec.md` y no hay botón de confirmar (CA-03.08.4).
 */
export interface ImportPreviewScreenProps {
  pickFile: FileGateway["pickFile"];
  previewImport: (content: string, sizeBytes: number) => Result<RoutineImportPreview, ImportError>;
  confirmImport: (
    content: string,
    sizeBytes: number,
  ) => Promise<Result<Routine, ImportError | RoutineValidationError | RepositoryError>>;
  onImported: (routine: Routine) => void;
  onCancel: () => void;
}

type PickedContent = { content: string; sizeBytes: number };

const {
  title,
  pickCta,
  itemsCount,
  durationLabel,
  warningsTitle,
  confirmCta,
  cancelCta,
  unsupportedVersion,
  invalidFormat,
  fileTooLarge,
  genericError,
} = strings.routines.importPreview;

function minutesLabel(estimatedDurationSeconds: number): string {
  return durationLabel.replace("{{minutes}}", String(Math.round(estimatedDurationSeconds / 60)));
}

function warningMessage(warning: ImportWarning): string {
  return warning.message;
}

function errorMessage(error: ImportError): string {
  switch (error.kind) {
    case "UNSUPPORTED_VERSION":
      return unsupportedVersion;
    case "FILE_TOO_LARGE":
      return fileTooLarge;
    case "INVALID_FORMAT":
      return invalidFormat;
  }
}

export function ImportPreviewScreen({
  pickFile,
  previewImport,
  confirmImport,
  onImported,
  onCancel,
}: ImportPreviewScreenProps): React.JSX.Element {
  const [picked, setPicked] = useState<PickedContent | null>(null);
  const [preview, setPreview] = useState<RoutineImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handlePick = async (): Promise<void> => {
    setError(null);
    setPreview(null);
    const result = await pickFile();
    if (!isOk(result)) {
      setError(genericError);
      return;
    }
    const file: PickedFile | null = result.value;
    if (!file) {
      return; // el usuario canceló la selección
    }
    const previewResult = previewImport(file.content, file.sizeBytes);
    if (!isOk(previewResult)) {
      setError(errorMessage(previewResult.error));
      return;
    }
    setPicked({ content: file.content, sizeBytes: file.sizeBytes });
    setPreview(previewResult.value);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!picked) {
      return;
    }
    setConfirming(true);
    const result = await confirmImport(picked.content, picked.sizeBytes);
    setConfirming(false);
    if (!isOk(result)) {
      setError(genericError);
      return;
    }
    onImported(result.value);
  };

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg }}>
        {title}
      </Text>

      <PrimaryButton label={pickCta} onPress={() => void handlePick()} />
      <View style={{ height: spacing.md }} />

      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.textPrimary, marginBottom: spacing.md }}>
          {error}
        </Text>
      ) : null}

      {preview ? (
        <View>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>{preview.name}</Text>
          <Text style={{ color: colors.textSecondary }}>
            {itemsCount.replace("{{count}}", String(preview.itemCount))} · {minutesLabel(preview.estimatedDurationSeconds)}
          </Text>

          {preview.warnings.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.label, color: colors.textPrimary }}>{warningsTitle}</Text>
              {preview.warnings.map((warning, index) => (
                <Text key={`${warning.kind}-${index}`} style={{ color: colors.textSecondary }}>
                  {warningMessage(warning)}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={{ height: spacing.md }} />
          <PrimaryButton label={confirmCta} onPress={() => void handleConfirm()} disabled={confirming} />
        </View>
      ) : null}

      <View style={{ height: spacing.md }} />
      <PrimaryButton label={cancelCta} variant="secondary" onPress={onCancel} disabled={confirming} />
    </View>
  );
}
