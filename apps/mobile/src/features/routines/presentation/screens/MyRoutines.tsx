import { useCallback, useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { isOk } from "@/shared/domain/Result";
import type { Result } from "@/shared/domain/Result";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import { strings } from "@/shared/i18n";
import type { RoutineSource } from "../../domain/Routine";

/**
 * `MyRoutines` (RF-03.01…RF-03.06, "Mis rutinas"): lista las rutinas propias
 * del usuario (`ListMyRoutines`) junto con las rutinas predefinidas del
 * catálogo, ofrece crear una nueva, importar un archivo y — sobre una
 * rutina `PREDEFINED` (CA-03.05.1) — "Duplicar y editar". Pantalla mínima
 * (Art. 9.1, "sin sobre-diseñar"): sin edición/borrado inline todavía — eso
 * se agrega en una ronda futura sin romper este contrato.
 */
export interface RoutineListItem {
  id: string;
  name: string;
  itemCount: number;
  /** RN-07 (CA-03.01.1 "muestra la duración estimada"), recalculada al listar con `estimateRoutineDurationSeconds`. */
  estimatedDurationSeconds: number;
  source: RoutineSource;
}

export interface MyRoutinesScreenProps {
  /** Combina `ListMyRoutines.execute()` (USER/IMPORTED) y las predefinidas del catálogo. */
  loadItems: () => Promise<Result<RoutineListItem[], unknown>>;
  onCreate: () => void;
  onImport: () => void;
  /** CA-03.05.1: solo se invoca sobre ítems `source === "PREDEFINED"`. */
  onDuplicate: (id: string) => void;
}

const { title, empty, createCta, importCta, itemsCount, durationLabel, predefinedBadge, duplicateCta } =
  strings.routines.myRoutines;

function minutesLabel(estimatedDurationSeconds: number): string {
  return durationLabel.replace("{{minutes}}", String(Math.round(estimatedDurationSeconds / 60)));
}

export function MyRoutinesScreen({
  loadItems,
  onCreate,
  onImport,
  onDuplicate,
}: MyRoutinesScreenProps): React.JSX.Element {
  const [items, setItems] = useState<RoutineListItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const result = await loadItems();
    if (isOk(result)) {
      setItems(result.value);
    }
    setLoaded(true);
  }, [loadItems]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de datos en efecto, ver `CatalogNavigator.tsx` (mismo patrón ya aprobado en H1).
    void load();
  }, [load]);

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg }}>
        {title}
      </Text>

      {loaded && items.length === 0 ? (
        <Text style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>{empty}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              accessibilityRole="text"
              style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                {item.name}
                {item.source === "PREDEFINED" ? ` · ${predefinedBadge}` : ""}
              </Text>
              <Text style={{ color: colors.textSecondary }}>
                {itemsCount.replace("{{count}}", String(item.itemCount))} · {minutesLabel(item.estimatedDurationSeconds)}
              </Text>
              {item.source === "PREDEFINED" ? (
                <View style={{ marginTop: spacing.xs, alignItems: "flex-start" }}>
                  <PrimaryButton
                    label={duplicateCta}
                    variant="secondary"
                    onPress={() => onDuplicate(item.id)}
                    accessibilityHint={item.name}
                  />
                </View>
              ) : null}
            </View>
          )}
        />
      )}

      <View style={{ height: spacing.md }} />
      <PrimaryButton label={createCta} onPress={onCreate} />
      <View style={{ height: spacing.sm }} />
      <PrimaryButton label={importCta} variant="secondary" onPress={onImport} />
    </View>
  );
}
