import { Image, ScrollView, Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import type { Exercise } from "../../domain/Exercise";

/**
 * Pantalla "Detalle de ejercicio" (RF-02.01, tarea `F02-T15`). CA-02.01.1:
 * "Cuando abro el ejercicio 'Flexión de pecho', entonces veo su animación,
 * grupos musculares, equipo, dificultad, pasos y errores comunes, y si tiene
 * video, veo un botón 'Ver video'".
 */
export interface ExerciseDetailScreenProps {
  exercise: Exercise;
  onWatchVideo: (videoUrl: string) => void;
}

export function ExerciseDetailScreen({ exercise, onWatchVideo }: ExerciseDetailScreenProps): React.JSX.Element {
  const mediaUri = exercise.animationUrl ?? exercise.imageUrl;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Image
        source={{ uri: mediaUri }}
        accessibilityLabel={exercise.name}
        style={{ width: "100%", height: 220, borderRadius: 12, marginBottom: spacing.md, backgroundColor: colors.border }}
        resizeMode="cover"
      />
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.sm }}>
        {exercise.name}
      </Text>
      <Text accessibilityRole="text" style={{ color: colors.textSecondary, marginBottom: spacing.xs }}>
        {exercise.muscleGroups.join(", ")}
      </Text>
      <Text accessibilityRole="text" style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
        {strings.catalog.detail.equipmentLabel}: {exercise.equipment.join(", ")} · {strings.catalog.detail.difficultyLabel}: {exercise.difficulty}
      </Text>

      {exercise.hasVideo() ? (
        <View style={{ marginBottom: spacing.md }}>
          <PrimaryButton
            label={strings.catalog.detail.watchVideoCta}
            onPress={() => {
              if (exercise.videoUrl) {
                onWatchVideo(exercise.videoUrl);
              }
            }}
          />
        </View>
      ) : null}

      <Text accessibilityRole="header" style={{ ...typography.subtitle, color: colors.textPrimary, marginBottom: spacing.sm }}>
        {strings.catalog.detail.stepsTitle}
      </Text>
      {exercise.instructions.map((instruction, index) => (
        <Text key={instruction} accessibilityRole="text" style={{ color: colors.textPrimary, marginBottom: spacing.xs }}>
          {index + 1}. {instruction}
        </Text>
      ))}

      <Text
        accessibilityRole="header"
        style={{ ...typography.subtitle, color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm }}
      >
        {strings.catalog.detail.mistakesTitle}
      </Text>
      {exercise.commonMistakes.map((mistake) => (
        <Text key={mistake} accessibilityRole="text" style={{ color: colors.textPrimary, marginBottom: spacing.xs }}>
          • {mistake}
        </Text>
      ))}
    </ScrollView>
  );
}
