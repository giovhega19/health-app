import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking } from "react-native";
import { isOk } from "@/shared/domain/Result";
import type { Id } from "@/shared/domain/Id";
import type { MuscleGroup } from "@/shared/domain/MuscleGroup";
import type { Equipment } from "@/shared/domain/Equipment";
import type { AppContainer } from "@/composition/container";
import type { Exercise } from "../../domain/Exercise";
import { ExerciseListScreen } from "../screens/ExerciseList";
import { FiltersScreen } from "../screens/Filters";
import { ExerciseDetailScreen } from "../screens/ExerciseDetail";

/**
 * `CatalogNavigator` (RF-02.01/RF-02.02, tarea `F02-T15`): orquesta
 * lista -> filtros -> detalle del catálogo, igual que `OnboardingNavigator`
 * (índice de paso en memoria en vez de rutas de Expo Router adicionales,
 * mismo razonamiento documentado ahí). La ruta (`app/catalog/index.tsx`)
 * solo inyecta el contenedor de composición.
 */
type View = "list" | "filters" | "detail";

export interface CatalogNavigatorProps {
  container: Pick<AppContainer, "catalog">;
}

export function CatalogNavigator({ container }: CatalogNavigatorProps): React.JSX.Element {
  const [view, setView] = useState<View>("list");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [draftMuscleGroup, setDraftMuscleGroup] = useState<MuscleGroup | null>(null);
  const [draftEquipment, setDraftEquipment] = useState<Equipment | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedId, setSelectedId] = useState<Id | null>(null);

  const loadExercises = useCallback(
    async (criteria: { muscleGroup?: MuscleGroup; equipment?: Equipment }) => {
      const result = await container.catalog.filterExercises.execute(criteria);
      if (isOk(result)) {
        setExercises(result.value.items);
      }
    },
    [container],
  );

  useEffect(() => {
    // `loadExercises` llama a `setExercises` solo dentro de su propio
    // `await` (lectura asíncrona vía `FilterExercises`), no de forma
    // síncrona en el cuerpo del efecto: patrón de "fetch de datos en un
    // efecto" recomendado por React, no una cascada de renders síncrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ver comentario
    void loadExercises({ muscleGroup: muscleGroup ?? undefined, equipment: equipment ?? undefined });
  }, [muscleGroup, equipment, loadExercises]);

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedId) ?? null,
    [exercises, selectedId],
  );

  if (view === "filters") {
    return (
      <FiltersScreen
        muscleGroup={draftMuscleGroup}
        equipment={draftEquipment}
        resultCount={exercises.length}
        onChangeMuscleGroup={setDraftMuscleGroup}
        onChangeEquipment={setDraftEquipment}
        onApply={() => {
          setMuscleGroup(draftMuscleGroup);
          setEquipment(draftEquipment);
          setView("list");
        }}
        onClear={() => {
          setDraftMuscleGroup(null);
          setDraftEquipment(null);
        }}
      />
    );
  }

  if (view === "detail" && selectedExercise) {
    return (
      <ExerciseDetailScreen
        exercise={selectedExercise}
        onWatchVideo={(videoUrl) => {
          void Linking.openURL(videoUrl);
        }}
      />
    );
  }

  return (
    <ExerciseListScreen
      exercises={exercises}
      onSelectExercise={(id) => {
        setSelectedId(id);
        setView("detail");
      }}
      onOpenFilters={() => {
        setDraftMuscleGroup(muscleGroup);
        setDraftEquipment(equipment);
        setView("filters");
      }}
    />
  );
}
