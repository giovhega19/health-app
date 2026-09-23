import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { colors, spacing } from "@/shared/ui";
import type { Exercise } from "../../domain/Exercise";

/**
 * Fila de la lista de ejercicios (CA-02.02.1). Memoizado (Art. 8.3
 * rendimiento: "memoriza los componentes del cronómetro" se extiende aquí a
 * las filas de listas largas, que re-renderizan con cada cambio de filtro).
 */
export interface ExerciseListItemProps {
  exercise: Exercise;
  onPress: (id: Exercise["id"]) => void;
}

function ExerciseListItemComponent({ exercise, onPress }: ExerciseListItemProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={exercise.name}
      onPress={() => {
        onPress(exercise.id);
      }}
      style={{
        minHeight: 44,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View>
        <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{exercise.name}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {exercise.muscleGroups.join(", ")} · {exercise.equipment.join(", ")}
        </Text>
      </View>
    </Pressable>
  );
}

export const ExerciseListItem = memo(ExerciseListItemComponent);
