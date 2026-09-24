/**
 * Regresión pendiente de F02 (`specs/F02-catalogo-propuesta/plan.md` §5,
 * CA-02.06.1) cerrada en la ronda de F03 (`specs/F03-editor-rutinas/plan.md`
 * §5): "la prueba de regresión de extremo a extremo con rutinas de usuario
 * reales se añade en el plan técnico de F03". Siembra una `user_routines`
 * real (con sus `routine_blocks`/`routine_items`, tablas compartidas con
 * `predefined_routines` desde F02) en SQLite real, corre
 * `DownloadCatalogUpdate` con un manifest que actualiza el catálogo, y
 * verifica que ni una fila de esa rutina de usuario cambió.
 *
 * No importa nada de `features/routines` (Art. 2.5): siembra directamente
 * contra `shared/infrastructure/db/schema.ts` (compartido entre features),
 * igual que hace `SqliteUserRoutineRepository` internamente.
 *
 * Vive en `infrastructure/__tests__/` (no en `application/__tests__/`, como
 * proponía originalmente `specs/F03-editor-rutinas/plan.md` §5) porque usa
 * SQLite real: la regla de arquitectura `application-no-ui-or-infrastructure`
 * (`.dependency-cruiser.js`) prohíbe que cualquier archivo bajo `application/`
 * —incluidas sus pruebas— importe infraestructura concreta. Mismo caso que
 * cubre, mismo nivel de integración que el resto de pruebas de
 * `infrastructure/__tests__/`.
 */
import { eq } from "drizzle-orm";
import { isOk, ok } from "@/shared/domain/Result";
import { routineBlocks, routineItems, userRoutines } from "@/shared/infrastructure/db/schema";
import { createTestDb } from "@test/helpers/createTestDb";
import { FakeClock } from "@test/fakes/FakeClock";
import { FakeCatalogManifestPort } from "@test/fakes/FakeCatalogManifestPort";
import { SqliteExerciseRepository } from "../SqliteExerciseRepository";
import { SqlitePredefinedRoutineRepository } from "../SqlitePredefinedRoutineRepository";
import { DownloadCatalogUpdate } from "../../application/DownloadCatalogUpdate";

const USER_ROUTINE_ID = "00000000-0000-4000-b200-000000000001";
const USER_BLOCK_ID = "00000000-0000-4000-b200-000000000002";
const USER_ITEM_ID = "00000000-0000-4000-b200-000000000003";

const UPDATED_EXERCISE_DTO = {
  id: "00000000-0000-4000-8000-000000000099",
  slug: "burpee",
  name: "Burpee",
  muscleGroups: ["CARDIO"],
  equipment: ["NONE"],
  difficulty: 2,
  mode: "REPS",
  met: 8,
  instructions: ["Uno.", "Dos.", "Tres."],
  commonMistakes: ["Uno.", "Dos."],
  imageUrl: "https://cdn.fitapp.test/img/burpee.png",
  animationUrl: null,
  videoUrl: null,
  updatedAt: "2026-02-01T00:00:00Z",
};

async function seedUserRoutine(db: Awaited<ReturnType<typeof createTestDb>>): Promise<void> {
  await db.insert(userRoutines).values({
    id: USER_ROUTINE_ID,
    name: "Mi rutina de pierna",
    description: null,
    goal: "GENERAL_HEALTH",
    level: "BEGINNER",
    source: "USER",
    timerDefaults: {
      prepSeconds: 10,
      workSeconds: 40,
      restBetweenSetsSeconds: 60,
      restBetweenExercisesSeconds: 60,
      restBetweenRoundsSeconds: 90,
      halfwayCue: false,
    },
    version: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
  });
  await db.insert(routineBlocks).values({
    id: USER_BLOCK_ID,
    routineId: USER_ROUTINE_ID,
    position: 0,
    type: "MAIN",
    grouping: "STRAIGHT",
    rounds: 1,
  });
  await db.insert(routineItems).values({
    id: USER_ITEM_ID,
    blockId: USER_BLOCK_ID,
    position: 0,
    exerciseId: "00000000-0000-4000-8000-000000000001",
    sets: 3,
    targetReps: 12,
    targetSeconds: null,
    weightKg: null,
    timerOverrides: null,
    exerciseSource: "CATALOG",
  });
}

describe("CA-02.06.1 (regresión) DownloadCatalogUpdate no toca rutinas de usuario", () => {
  it("una actualización del catálogo (SQLite real) deja intactas las filas de user_routines/routine_blocks/routine_items del usuario", async () => {
    const db = await createTestDb();
    await seedUserRoutine(db);

    const beforeRoutine = await db.select().from(userRoutines).where(eq(userRoutines.id, USER_ROUTINE_ID));
    const beforeBlocks = await db.select().from(routineBlocks).where(eq(routineBlocks.routineId, USER_ROUTINE_ID));
    const beforeItems = await db.select().from(routineItems).where(eq(routineItems.blockId, USER_BLOCK_ID));

    const clock = new FakeClock("2026-02-01T00:00:00Z");
    const exerciseRepository = new SqliteExerciseRepository(db, clock);
    const routineRepository = new SqlitePredefinedRoutineRepository(db, clock);
    const manifestPort = new FakeCatalogManifestPort();
    manifestPort.manifestResult = ok({
      version: 5,
      exercisesEtag: "etag-v5",
      routinesEtag: "etag-v5",
      mediaBaseUrl: "https://cdn.fitapp.test/",
      updatedAt: new Date("2026-02-01T00:00:00Z"),
    });
    manifestPort.updatedSinceResults.exercises = ok([UPDATED_EXERCISE_DTO]);
    manifestPort.updatedSinceResults.routines = ok([]);

    const useCase = new DownloadCatalogUpdate(manifestPort, exerciseRepository, routineRepository);
    const result = await useCase.execute({ localVersion: 1, lastSyncedAt: new Date("2026-01-15T00:00:00Z") });

    expect(isOk(result)).toBe(true);

    const afterRoutine = await db.select().from(userRoutines).where(eq(userRoutines.id, USER_ROUTINE_ID));
    const afterBlocks = await db.select().from(routineBlocks).where(eq(routineBlocks.routineId, USER_ROUTINE_ID));
    const afterItems = await db.select().from(routineItems).where(eq(routineItems.blockId, USER_BLOCK_ID));

    expect(afterRoutine).toEqual(beforeRoutine);
    expect(afterBlocks).toEqual(beforeBlocks);
    expect(afterItems).toEqual(beforeItems);
    expect(afterRoutine).toHaveLength(1);
    expect(afterBlocks).toHaveLength(1);
    expect(afterItems).toHaveLength(1);
  });
});
