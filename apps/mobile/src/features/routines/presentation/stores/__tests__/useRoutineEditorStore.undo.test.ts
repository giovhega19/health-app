/**
 * `useRoutineEditorStore` — CA-03.06.1 "al eliminar un ejercicio aparece
 * 'Deshacer' durante 5 s". Jest fake timers (07-estrategia-pruebas.md §2.2:
 * "Sin red real / reloj real en pruebas unitarias").
 *
 * Fase roja: `stageRemoval` (`F03-T16`) no programa el temporizador de 5 s
 * todavía — la primera prueba debe fallar en la aserción.
 */
import { anItem } from "@test/fakes/aRoutine";
import { useRoutineEditorStore } from "../useRoutineEditorStore";

beforeEach(() => {
  jest.useFakeTimers();
  useRoutineEditorStore.setState({ pendingRemoval: null });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("CA-03.06.1 useRoutineEditorStore — ventana de 5s para deshacer", () => {
  it("si no se deshace en 5s, se ejecuta el borrado definitivo (onExpire)", () => {
    const item = anItem();
    const onExpire = jest.fn();

    useRoutineEditorStore.getState().stageRemoval(item, onExpire);
    jest.advanceTimersByTime(5000);

    expect(onExpire).toHaveBeenCalledWith(item);
  });

  it("marca el ítem como pendiente de eliminar inmediatamente tras stageRemoval", () => {
    const item = anItem();

    useRoutineEditorStore.getState().stageRemoval(item, jest.fn());

    expect(useRoutineEditorStore.getState().pendingRemoval).toEqual(item);
  });

  it("si se deshace antes de 5s, no se ejecuta onExpire y pendingRemoval vuelve a null", () => {
    const item = anItem();
    const onExpire = jest.fn();

    useRoutineEditorStore.getState().stageRemoval(item, onExpire);
    useRoutineEditorStore.getState().undoRemoval();
    jest.advanceTimersByTime(5000);

    expect(onExpire).not.toHaveBeenCalled();
    expect(useRoutineEditorStore.getState().pendingRemoval).toBeNull();
  });
});
