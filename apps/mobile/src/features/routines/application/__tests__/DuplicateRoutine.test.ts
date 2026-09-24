/**
 * `DuplicateRoutine` — CA-03.05.1 "Predefinidas protegidas": al duplicar,
 * la copia se llama "<nombre> (mi versión)" y queda editable (source=USER).
 *
 * Fase roja: `DuplicateRoutine` (`F03-T09`) es andamiaje mínimo que
 * conserva el nombre y el `source` originales — estas pruebas deben fallar
 * en la aserción.
 */
import { isOk } from "@/shared/domain/Result";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeRoutineRepository } from "@test/fakes/FakeRoutineRepository";
import { aPredefinedRoutineSnapshot } from "@test/fakes/aPredefinedRoutineSnapshot";
import { DuplicateRoutine } from "../DuplicateRoutine";

describe('CA-03.05.1 DuplicateRoutine — "Duplicar y editar"', () => {
  it('la copia se llama "<nombre> (mi versión)" y su source es USER (editable)', async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new DuplicateRoutine(repository, new FakeClock("2026-09-23T10:00:00Z"));
    const snapshot = aPredefinedRoutineSnapshot({ name: "Cuerpo completo sin equipo" });

    const result = await useCase.execute({ snapshot });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.name).toBe("Cuerpo completo sin equipo (mi versión)");
    expect(result.value.source).toBe("USER");
  });

  it("la copia se persiste como una rutina nueva (no sobrescribe nada del original)", async () => {
    const repository = new FakeRoutineRepository();
    const useCase = new DuplicateRoutine(repository, new FakeClock("2026-09-23T10:00:00Z"));
    const snapshot = aPredefinedRoutineSnapshot();

    const result = await useCase.execute({ snapshot });

    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).not.toBe(snapshot.id);
    expect(repository.savedRoutines).toHaveLength(1);
  });
});
