import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import type { Id } from "@/shared/domain/Id";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import { colors, PrimaryButton, spacing, typography } from "@/shared/ui";
import { strings } from "@/shared/i18n";
import { SaveRoutineButton } from "../components/SaveRoutineButton";
import { useRoutineEditorStore } from "../stores/useRoutineEditorStore";

/**
 * `RoutineEditor` (CA-03.01.1/CA-03.01.2/CA-03.06.1): editor mínimo para
 * crear una rutina — un solo bloque `MAIN`/`STRAIGHT`, ejercicios genéricos
 * (3×12 por defecto). Usa `SaveRoutineButton` (ya validado por QA) y
 * `useRoutineEditorStore` para la ventana de "Deshacer" de 5 s al quitar un
 * ejercicio del borrador. Un selector real del catálogo/ejercicio
 * personalizado (RF-03.02/RF-03.07) queda fuera de este editor mínimo
 * (Art. 9.1, "sin sobre-diseñar"): se agrega en una ronda futura sin romper
 * este contrato — aquí cada "ejercicio" del borrador es un marcador de
 * posición con nombre libre, para poder ejercitar el flujo completo
 * crear → agregar → quitar/deshacer → guardar.
 */
export interface DraftItem {
  item: RoutineItem;
  name: string;
}

export interface RoutineEditorScreenProps {
  makeItemId: () => Id;
  onSave: (name: string, items: RoutineItem[]) => void;
  onCancel: () => void;
  saving?: boolean;
  /**
   * CA-03.05.1 ("Duplicar y editar"): pre-carga el borrador con la copia ya
   * persistida por `DuplicateRoutine`. Opcionales — por defecto el editor
   * arranca vacío (modo "crear", comportamiento sin cambios).
   */
  initialName?: string;
  initialItems?: DraftItem[];
}

const { title, nameLabel, newExerciseLabel, addItemCta, removeItemCta, cancelCta, undoDeleteCta } =
  strings.routines.editor;

export function RoutineEditorScreen({
  makeItemId,
  onSave,
  onCancel,
  saving = false,
  initialName = "",
  initialItems = [],
}: RoutineEditorScreenProps): React.JSX.Element {
  const [name, setName] = useState(initialName);
  const [draftItems, setDraftItems] = useState<DraftItem[]>(initialItems);
  const [nextExerciseName, setNextExerciseName] = useState("");
  const pendingRemoval = useRoutineEditorStore((state) => state.pendingRemoval);
  const stageRemoval = useRoutineEditorStore((state) => state.stageRemoval);
  const undoRemoval = useRoutineEditorStore((state) => state.undoRemoval);

  const addItem = (): void => {
    const trimmed = nextExerciseName.trim();
    if (trimmed.length === 0) {
      return;
    }
    const id = makeItemId();
    setDraftItems((current) => [
      ...current,
      { name: trimmed, item: { id, exerciseId: makeItemId(), sets: 3, targetReps: 12 } },
    ]);
    setNextExerciseName("");
  };

  const removeItem = (draft: DraftItem): void => {
    stageRemoval(draft.item, (expired) => {
      setDraftItems((current) => current.filter((candidate) => candidate.item.id !== expired.id));
    });
  };

  const visibleItems = draftItems.filter((draft) => draft.item.id !== pendingRemoval?.id);

  return (
    <View style={{ flex: 1, padding: spacing.lg, backgroundColor: colors.background }}>
      <Text accessibilityRole="header" style={{ ...typography.title, color: colors.textPrimary, marginBottom: spacing.lg }}>
        {title}
      </Text>

      <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>{nameLabel}</Text>
      <TextInput
        accessibilityLabel={nameLabel}
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.md }}
      />

      {/* Lista corta (máx. 40 ítems por RN-06): `.map()` en vez de
          `FlatList`/`FlashList` es apropiado aquí (la recomendación de listas
          virtualizadas del proyecto aplica a listas largas/scrollables como
          el catálogo de ejercicios, no a un borrador acotado). */}
      {visibleItems.map((draft) => (
        <View
          key={draft.item.id}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: spacing.xs,
          }}
        >
          <Text style={{ color: colors.textPrimary }}>{draft.name}</Text>
          <PrimaryButton label={removeItemCta} variant="secondary" onPress={() => removeItem(draft)} />
        </View>
      ))}

      {pendingRemoval ? (
        <PrimaryButton label={undoDeleteCta} variant="secondary" onPress={undoRemoval} />
      ) : null}

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
        <TextInput
          accessibilityLabel={newExerciseLabel}
          value={nextExerciseName}
          onChangeText={setNextExerciseName}
          style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.sm }}
        />
        <View style={{ width: spacing.sm }} />
        <PrimaryButton label={addItemCta} onPress={addItem} />
      </View>

      <View style={{ height: spacing.lg }} />
      <SaveRoutineButton
        name={name}
        itemsCount={visibleItems.length}
        onSave={() => onSave(name, visibleItems.map((draft) => draft.item))}
      />
      <View style={{ height: spacing.sm }} />
      <PrimaryButton label={cancelCta} variant="secondary" onPress={onCancel} disabled={saving} />
    </View>
  );
}
