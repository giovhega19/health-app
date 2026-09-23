import { ScrollView, Text, View } from "react-native";
import { strings } from "@/shared/i18n";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { Equipment } from "@/shared/domain/Equipment";
import { colors, OptionButton, PrimaryButton, spacing, typography } from "@/shared/ui";

/**
 * Pantalla "Filtros" del catálogo (RF-02.02, tarea `F02-T15`). CA-02.02.1:
 * "Dado el filtro grupo muscular = PECHO y equipo = NONE, entonces solo veo
 * ejercicios que trabajan pecho y no requieren equipo, y el número de
 * resultados se anuncia al lector de pantalla" — el anuncio en sí vive en
 * `ExerciseList.tsx` (el contador con `accessibilityLiveRegion`); esta
 * pantalla también muestra el conteo en vivo mientras se ajustan los
 * filtros, para feedback inmediato.
 */
const MUSCLE_GROUPS: MuscleGroup[] = ["CHEST", "BACK", "LEGS", "SHOULDERS", "ARMS", "CORE", "GLUTES", "CARDIO", "FULL_BODY"];
const EQUIPMENT_VALUES: Equipment[] = ["NONE", "DUMBBELLS", "PULL_UP_BAR", "BANDS", "KETTLEBELL", "BENCH", "JUMP_ROPE", "GYM"];

export interface FiltersScreenProps {
  muscleGroup: MuscleGroup | null;
  equipment: Equipment | null;
  resultCount: number;
  onChangeMuscleGroup: (value: MuscleGroup | null) => void;
  onChangeEquipment: (value: Equipment | null) => void;
  onApply: () => void;
  onClear: () => void;
}

export function FiltersScreen({
  muscleGroup,
  equipment,
  resultCount,
  onChangeMuscleGroup,
  onChangeEquipment,
  onApply,
  onClear,
}: FiltersScreenProps): React.JSX.Element {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.md }}>
        {strings.catalog.filters.title}
      </Text>
      <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={{ color: colors.textSecondary, marginBottom: spacing.md }}>
        {strings.catalog.list.resultsAnnouncement.replace("{{count}}", String(resultCount))}
      </Text>

      <ScrollView style={{ flex: 1 }}>
        <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>
          {strings.catalog.filters.muscleGroupLabel}
        </Text>
        <OptionButton
          label={strings.catalog.filters.allOption}
          selected={muscleGroup === null}
          onPress={() => {
            onChangeMuscleGroup(null);
          }}
        />
        {MUSCLE_GROUPS.map((value) => (
          <OptionButton
            key={value}
            label={value}
            selected={muscleGroup === value}
            onPress={() => {
              onChangeMuscleGroup(value);
            }}
          />
        ))}

        <Text style={{ ...typography.label, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs }}>
          {strings.catalog.filters.equipmentLabel}
        </Text>
        <OptionButton
          label={strings.catalog.filters.allOption}
          selected={equipment === null}
          onPress={() => {
            onChangeEquipment(null);
          }}
        />
        {EQUIPMENT_VALUES.map((value) => (
          <OptionButton
            key={value}
            label={value}
            selected={equipment === value}
            onPress={() => {
              onChangeEquipment(value);
            }}
          />
        ))}
      </ScrollView>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
        <PrimaryButton label={strings.catalog.filters.clearCta} variant="secondary" onPress={onClear} />
        <PrimaryButton label={strings.catalog.filters.applyCta} onPress={onApply} />
      </View>
    </View>
  );
}
