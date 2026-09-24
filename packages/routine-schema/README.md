# @fitapp/routine-schema

**JSON Schema** del formato de importación y exportación de rutinas `.fitroutine.json` (ver `06-contratos-api.md` §4, RF-03.08, ADR-009).

## Estado (F03, H2)

`fitroutine.schema.v1.json` (JSON Schema draft 2020-12) es la fuente normativa y portable del formato: útil para un entrenador o herramienta de terceros que genere `.fitroutine.json` en otro lenguaje sin depender de TypeScript ni de zod.

**El validador que la app móvil ejecuta en producción es distinto**: un zod escrito a mano en `apps/mobile/src/features/routines/application/import/fitRoutineFileSchema.ts` (ADR-009 — cero dependencias nuevas en el bundle de producción, mejor ergonomía de tipos). Ambos se mantienen sincronizados mediante una prueba de paridad automatizada.

## Pruebas

```sh
pnpm --filter @fitapp/routine-schema test
```

`__tests__/parity.test.ts` ejercita una batería de fixtures (válidos e inválidos, incluidos los casos de CA-03.08.2/.3/.4) contra ambos validadores usando `ajv` — **solo como `devDependency` de este paquete**, nunca como dependencia de `apps/mobile` ni empaquetado en la app (ADR-009). Corre con `tsx --test` (el runner de pruebas nativo de Node), no con Jest: es intencionalmente independiente del pipeline de pruebas de la app móvil.

## Alcance

El esquema valida la **forma estructural** del archivo (campos presentes, tipos correctos). Deliberadamente NO valida:
- Los límites numéricos de RN-06 (eso lo hace `clampToLimits` en `PreviewImportRoutine`, con advertencia, CA-03.08.3 — un valor fuera de rango es estructuralmente válido, se recorta después).
- Si `schemaVersion` es soportado (eso lo hace `PreviewImportRoutine` con el mensaje amigable de CA-03.08.4).
- El tamaño máximo de 256 KB (se verifica antes de parsear el JSON, fuera de este esquema).
