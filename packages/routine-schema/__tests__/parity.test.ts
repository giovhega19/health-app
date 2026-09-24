/**
 * Prueba de paridad JSON Schema ↔ zod (ADR-009, `specs/F03-editor-rutinas/plan.md`
 * §4/§5, tarea `F03-T08`). `ajv` se usa **únicamente** como `devDependency`
 * de este paquete (nunca de `apps/mobile`, nunca empaquetado en la app,
 * `packages/routine-schema/package.json`). Corre bajo Node/`tsx` (no Jest):
 * no forma parte del bundle de la app ni del pipeline de pruebas de
 * `apps/mobile` (`pnpm test` en `apps/mobile` no lo incluye; se ejecuta con
 * `pnpm --filter @fitapp/routine-schema test`, o desde la raíz con
 * `pnpm -r test`).
 *
 * Ejercita una batería de fixtures (válidos e inválidos, incluyendo
 * explícitamente los casos de CA-03.08.2/.3/.4) contra ambos validadores y
 * falla si no coinciden exactamente en aceptar/rechazar cada uno.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
// `ajv` (core) solo entiende JSON Schema draft-07 por defecto; el esquema
// usa draft 2020-12 (`packages/routine-schema/plan.md`/ADR-009), así que se
// importa la build específica de `ajv/dist/2020`.
import Ajv2020 from "ajv/dist/2020";
import { fitRoutineFileSchema } from "../../../apps/mobile/src/features/routines/application/import/fitRoutineFileSchema.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(here, "..", "fitroutine.schema.v1.json");
const jsonSchema: object = JSON.parse(readFileSync(schemaPath, "utf-8"));

const ajv = new Ajv2020({ strict: false, allErrors: true });
const validateWithAjv = ajv.compile(jsonSchema);

function validRoutineFile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema: "fitapp.routine",
    schemaVersion: 1,
    exportedAt: "2026-09-21T10:00:00Z",
    routine: {
      name: "Pecho y flexiones",
      goal: "MUSCLE_GAIN",
      level: "INTERMEDIATE",
      timerDefaults: { prepSeconds: 10, restBetweenSetsSeconds: 60, restBetweenExercisesSeconds: 90 },
      blocks: [
        {
          type: "MAIN",
          grouping: "STRAIGHT",
          rounds: 1,
          items: [
            { exercise: { ref: "catalog:push-up" }, sets: 4, targetReps: 12 },
            {
              exercise: { ref: "custom", name: "Flexión en toalla", mode: "REPS", muscleGroups: ["CHEST"] },
              sets: 3,
              targetReps: 10,
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

interface Fixture {
  name: string;
  file: unknown;
  expectValid: boolean;
}

const fixtures: Fixture[] = [
  { name: "CA-03.08.1/.2 archivo válido (catálogo + custom)", file: validRoutineFile(), expectValid: true },
  {
    name: "CA-03.08.3 referencia de catálogo inexistente + reps fuera de rango (estructuralmente válido: la resolución/recorte son responsabilidad de la app, no del esquema)",
    file: validRoutineFile({
      routine: {
        ...(validRoutineFile().routine as object),
        blocks: [
          {
            type: "MAIN",
            grouping: "STRAIGHT",
            rounds: 1,
            items: [{ exercise: { ref: "catalog:no-existe" }, sets: 3, targetReps: 500 }],
          },
        ],
      },
    }),
    expectValid: true,
  },
  {
    name: "CA-03.08.4 schemaVersion futuro (estructuralmente válido: el rechazo por versión es responsabilidad de PreviewImportRoutine, no del esquema)",
    file: validRoutineFile({ schemaVersion: 2 }),
    expectValid: true,
  },
  { name: "falta el campo schema", file: (() => { const f = validRoutineFile() as Record<string, unknown>; delete f.schema; return f; })(), expectValid: false },
  { name: "schema con valor incorrecto", file: validRoutineFile({ schema: "otra-cosa" }), expectValid: false },
  { name: "schemaVersion no positivo", file: validRoutineFile({ schemaVersion: 0 }), expectValid: false },
  { name: "routine sin nombre", file: validRoutineFile({ routine: { ...(validRoutineFile().routine as object), name: "" } }), expectValid: false },
  { name: "routine.goal inválido", file: validRoutineFile({ routine: { ...(validRoutineFile().routine as object), goal: "NO_EXISTE" } }), expectValid: false },
  { name: "bloque sin ítems", file: validRoutineFile({ routine: { ...(validRoutineFile().routine as object), blocks: [{ type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [] }] } }), expectValid: false },
  {
    name: "referencia de catálogo con formato inválido (sin prefijo catalog:)",
    file: validRoutineFile({
      routine: {
        ...(validRoutineFile().routine as object),
        blocks: [{ type: "MAIN", grouping: "STRAIGHT", rounds: 1, items: [{ exercise: { ref: "push-up" }, sets: 3, targetReps: 10 }] }],
      },
    }),
    expectValid: false,
  },
  {
    name: "referencia custom sin muscleGroups",
    file: validRoutineFile({
      routine: {
        ...(validRoutineFile().routine as object),
        blocks: [
          {
            type: "MAIN",
            grouping: "STRAIGHT",
            rounds: 1,
            items: [{ exercise: { ref: "custom", name: "X", mode: "REPS", muscleGroups: [] }, sets: 3, targetReps: 10 }],
          },
        ],
      },
    }),
    expectValid: false,
  },
  { name: "no es un objeto", file: "no soy un objeto", expectValid: false },
];

for (const fixture of fixtures) {
  test(`paridad JSON Schema/zod: ${fixture.name}`, () => {
    const ajvResult = validateWithAjv(fixture.file);
    const zodResult = fitRoutineFileSchema.safeParse(fixture.file);

    assert.equal(ajvResult, fixture.expectValid, `ajv esperaba ${fixture.expectValid}, obtuvo ${ajvResult}`);
    assert.equal(
      zodResult.success,
      fixture.expectValid,
      `zod esperaba ${fixture.expectValid}, obtuvo ${zodResult.success}`,
    );
    assert.equal(
      ajvResult,
      zodResult.success,
      `JSON Schema (${ajvResult}) y zod (${zodResult.success}) discrepan para "${fixture.name}"`,
    );
  });
}
