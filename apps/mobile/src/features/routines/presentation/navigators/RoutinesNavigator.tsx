import { useCallback, useState } from "react";
import { generateId } from "@/shared/domain/Id";
import { isOk, ok } from "@/shared/domain/Result";
import type { RoutineItem } from "@/shared/domain/RoutineItem";
import { estimateRoutineDurationSeconds } from "@/shared/domain/routineDuration";
import type { PredefinedRoutine } from "@/features/catalog";
import type { AppContainer } from "@/composition/container";
import { strings } from "@/shared/i18n";
import { MyRoutinesScreen } from "../screens/MyRoutines";
import type { RoutineListItem } from "../screens/MyRoutines";
import { RoutineEditorScreen } from "../screens/RoutineEditor";
import type { DraftItem } from "../screens/RoutineEditor";
import { ImportPreviewScreen } from "../screens/ImportPreview";

type View = "list" | "editor" | "import";

/**
 * `RoutinesNavigator` (F03-T16): orquesta "Mis rutinas" -> "Nueva rutina" /
 * "Duplicar y editar" (CA-03.05.1) / "Importar" (CA-03.08.2…CA-03.08.4),
 * mismo patrón de índice de vista en memoria que `CatalogNavigator`/
 * `OnboardingNavigator` (sin rutas de Expo Router adicionales por cada
 * paso). La ruta (`app/routines/index.tsx`) solo inyecta el contenedor.
 */
export interface RoutinesNavigatorProps {
  container: Pick<AppContainer, "routines" | "clock" | "catalog">;
}

const { duplicatedItemLabel } = strings.routines.editor;

export function RoutinesNavigator({ container }: RoutinesNavigatorProps): React.JSX.Element {
  const [view, setView] = useState<View>("list");
  const [reloadToken, setReloadToken] = useState(0);
  const [predefinedRoutines, setPredefinedRoutines] = useState<PredefinedRoutine[]>([]);
  // CA-03.05.1: borrador pre-cargado con la copia ya persistida por
  // `DuplicateRoutine` — distingue el modo "revisar duplicado" del modo
  // "crear rutina nueva" dentro de la misma vista `editor` (`handleSave`).
  const [duplicateDraft, setDuplicateDraft] = useState<{ name: string; items: DraftItem[] } | null>(null);

  const loadItems = useCallback(async () => {
    const [ownResult, predefinedResult] = await Promise.all([
      container.routines.listMyRoutines.execute(),
      container.catalog.listPredefinedRoutines.execute(),
    ]);
    const appTimerDefaults = container.routines.appTimerDefaults;

    const ownItems: RoutineListItem[] = isOk(ownResult)
      ? ownResult.value.map((routine) => ({
          id: routine.id,
          name: routine.name,
          itemCount: routine.itemCount,
          // CA-03.01.1 "muestra la duración estimada según RN-07": se
          // recalcula al listar (en vez de solo guardarla al crear) con la
          // misma función pura que usa `CreateRoutine`.
          estimatedDurationSeconds: estimateRoutineDurationSeconds(
            { timerDefaults: routine.timerDefaults, blocks: routine.blocks },
            appTimerDefaults,
          ),
          source: routine.source,
        }))
      : [];

    const predefined = isOk(predefinedResult) ? predefinedResult.value : [];
    setPredefinedRoutines(predefined);
    const predefinedItems: RoutineListItem[] = predefined.map((routine) => ({
      id: routine.id,
      name: routine.name,
      itemCount: routine.blocks.reduce((total, block) => total + block.items.length, 0),
      estimatedDurationSeconds: estimateRoutineDurationSeconds(
        { timerDefaults: routine.timerDefaults, blocks: routine.blocks },
        appTimerDefaults,
      ),
      source: "PREDEFINED" as const,
    }));

    return ok([...ownItems, ...predefinedItems]);
  }, [container]);

  const handleSave = useCallback(
    async (name: string, items: RoutineItem[]) => {
      if (duplicateDraft) {
        // CA-03.05.1: la copia ya se persistió al pulsar "Duplicar y editar"
        // (`DuplicateRoutine`); este paso solo confirma la revisión — no hay
        // caso de uso de "renombrar" todavía (fuera de alcance, ver
        // `MyRoutines.tsx`), así que "Guardar" aquí vuelve a la lista.
        setDuplicateDraft(null);
        setReloadToken((token) => token + 1);
        setView("list");
        return;
      }

      await container.routines.createRoutine.execute({
        name,
        goal: "GENERAL_HEALTH",
        level: "BEGINNER",
        timerDefaults: container.routines.appTimerDefaults,
        blocks: [
          {
            id: generateId(container.clock),
            type: "MAIN",
            grouping: "STRAIGHT",
            rounds: 1,
            items,
          },
        ],
      });
      setReloadToken((token) => token + 1);
      setView("list");
    },
    [container, duplicateDraft],
  );

  const handleCancelEditor = useCallback(() => {
    const wasDuplicateReview = duplicateDraft !== null;
    setDuplicateDraft(null);
    if (wasDuplicateReview) {
      // La copia ya quedó persistida antes de entrar al editor: refleja el
      // nuevo ítem en "Mis rutinas" aunque el usuario no pulse "Guardar".
      setReloadToken((token) => token + 1);
    }
    setView("list");
  }, [duplicateDraft]);

  const handleDuplicate = useCallback(
    async (id: string) => {
      const predefined = predefinedRoutines.find((routine) => routine.id === id);
      if (!predefined) {
        return;
      }
      const result = await container.routines.duplicateRoutine.execute({
        snapshot: {
          id: predefined.id,
          name: predefined.name,
          goal: predefined.goal,
          level: predefined.level,
          timerDefaults: predefined.timerDefaults,
          blocks: predefined.blocks,
        },
      });
      if (!isOk(result)) {
        return;
      }
      const duplicated = result.value;
      setDuplicateDraft({
        name: duplicated.name,
        items: duplicated.blocks.flatMap((block) =>
          block.items.map((item, index) => ({
            item,
            name: duplicatedItemLabel.replace("{{index}}", String(index + 1)),
          })),
        ),
      });
      setView("editor");
    },
    [container, predefinedRoutines],
  );

  if (view === "editor") {
    return (
      <RoutineEditorScreen
        makeItemId={() => generateId(container.clock)}
        initialName={duplicateDraft?.name}
        initialItems={duplicateDraft?.items}
        onSave={(name, items) => {
          void handleSave(name, items);
        }}
        onCancel={handleCancelEditor}
      />
    );
  }

  if (view === "import") {
    return (
      <ImportPreviewScreen
        pickFile={container.routines.pickImportFile}
        previewImport={(content, sizeBytes) => container.routines.previewImportRoutine.execute(content, sizeBytes)}
        confirmImport={(content, sizeBytes) => container.routines.confirmImportRoutine.execute(content, sizeBytes)}
        onImported={() => {
          setReloadToken((token) => token + 1);
          setView("list");
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  return (
    <MyRoutinesScreen
      key={reloadToken}
      loadItems={loadItems}
      onCreate={() => setView("editor")}
      onImport={() => setView("import")}
      onDuplicate={(id) => {
        void handleDuplicate(id);
      }}
    />
  );
}
