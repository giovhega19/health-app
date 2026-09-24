import { Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import { PrimaryButton, spacing } from "@/shared/ui";

/**
 * CA-03.01.2 "Dado una rutina sin nombre o sin ejercicios, el botón
 * 'Guardar' está deshabilitado y se indica qué falta". Componente aislado
 * (no requiere el editor completo, `RoutineEditor.tsx`, que todavía no
 * existe) — es lo mínimo testeable con RNTL que exige el criterio.
 */
export interface SaveRoutineButtonProps {
  name: string;
  itemsCount: number;
  onSave: () => void;
}

export function SaveRoutineButton({ name, itemsCount, onSave }: SaveRoutineButtonProps): React.JSX.Element {
  const missingName = name.trim().length === 0;
  const missingItems = itemsCount < 1;
  const disabled = missingName || missingItems;

  return (
    <View>
      <PrimaryButton label={strings.routines.editor.saveCta} onPress={onSave} disabled={disabled} />
      {missingName ? <Text style={{ marginTop: spacing.xs }}>{strings.routines.editor.missingName}</Text> : null}
      {missingItems ? <Text style={{ marginTop: spacing.xs }}>{strings.routines.editor.missingItems}</Text> : null}
    </View>
  );
}
