# @fitapp/routine-schema

Paquete reservado para el **JSON Schema** del formato de importación y exportación de rutinas `.fitroutine.json` (ver `06-contratos-api.md` §4, RF-03.08).

## Estado en H0

Carpeta reservada, sin esquema todavía. El JSON Schema real (validación de `schema`, `schemaVersion`, `routine.blocks[].items[]`, límites de RN-06, tamaño máximo de 256 KB, etc.) se completa en el **plan técnico de F03 (rutinas)**, junto con la validación equivalente en zod que usa el cliente móvil.

Cuando se implemente, este paquete debe exponer:
- El archivo del esquema (p. ej. `fitroutine.schema.json`).
- Un script de validación reutilizable tanto desde Node (backend/tests) como desde el cliente móvil.
