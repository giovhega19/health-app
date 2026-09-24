import { create } from "zustand";
import type { RoutineItem } from "@/shared/domain/RoutineItem";

/**
 * `useRoutineEditorStore` (CA-03.06.1 "al eliminar un ejercicio aparece
 * 'Deshacer' durante 5 s", tarea `F03-T16`). Temporizador de **UI** (no de
 * dominio, `specs/F03-editor-rutinas/plan.md` §2): tras 5 s sin deshacer, se
 * invoca `onExpire` (borrado definitivo, delegado normalmente en
 * `RemoveRoutineItem`).
 */
export const UNDO_WINDOW_MS = 5000;

export interface RoutineEditorStoreState {
  pendingRemoval: RoutineItem | null;
  stageRemoval: (item: RoutineItem, onExpire: (item: RoutineItem) => void) => void;
  undoRemoval: () => void;
}

// El id del `setTimeout` en curso vive fuera del estado reactivo de Zustand
// (no es un dato serializable de UI, solo un handle de temporizador) para
// poder cancelarlo desde `undoRemoval`.
let expireTimeoutId: ReturnType<typeof setTimeout> | null = null;

export const useRoutineEditorStore = create<RoutineEditorStoreState>((set) => ({
  pendingRemoval: null,
  stageRemoval: (item, onExpire) => {
    if (expireTimeoutId !== null) {
      clearTimeout(expireTimeoutId);
    }
    expireTimeoutId = setTimeout(() => {
      expireTimeoutId = null;
      onExpire(item);
      set({ pendingRemoval: null });
    }, UNDO_WINDOW_MS);
    set({ pendingRemoval: item });
  },
  undoRemoval: () => {
    if (expireTimeoutId !== null) {
      clearTimeout(expireTimeoutId);
      expireTimeoutId = null;
    }
    set({ pendingRemoval: null });
  },
}));
