import { useCallback } from "react";
import { FlatList, Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import type { Exercise } from "../../domain/Exercise";
import type { Id } from "@/shared/domain/Id";
import { ExerciseListItem } from "../components/ExerciseListItem";

/**
 * Pantalla "Lista de ejercicios" (RF-02.01/RF-02.02, tarea `F02-T15`).
 * CA-02.02.1: "el número de resultados se anuncia al lector de pantalla"
 * (`accessibilityLiveRegion="polite"` en el contador). Lista virtualizada con
 * `FlatList` (Art. 8.3: "listas con FlashList o FlatList virtualizada").
 */
export interface ExerciseListScreenProps {
  exercises: Exercise[];
  onSelectExercise: (id: Id) => void;
  onOpenFilters: () => void;
}

export function ExerciseListScreen({ exercises, onSelectExercise, onOpenFilters }: ExerciseListScreenProps): React.JSX.Element {
  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => <ExerciseListItem exercise={item} onPress={onSelectExercise} />,
    [onSelectExercise],
  );
  const keyExtractor = useCallback((item: Exercise) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm }}>
          {strings.catalog.list.title}
        </Text>
        <Text
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          style={{ color: colors.textSecondary, marginBottom: spacing.sm }}
        >
          {strings.catalog.list.resultsAnnouncement.replace("{{count}}", String(exercises.length))}
        </Text>
        <PrimaryButton label={strings.catalog.list.filtersCta} variant="secondary" onPress={onOpenFilters} />
      </View>

      {exercises.length === 0 ? (
        <Text style={{ color: colors.textSecondary, padding: spacing.lg }}>{strings.catalog.list.empty}</Text>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          accessibilityRole="list"
        />
      )}
    </View>
  );
}
