/**
 * Identificador de una entidad de dominio.
 *
 * En H0 esto es un placeholder fundacional: se declara el tipo (string con
 * formato UUID, "branded" para no confundirlo con un string cualquiera) y
 * una validación, sin acoplar el dominio a una librería concreta de
 * generación de UUIDv7 todavía.
 *
 * `06-contratos-api.md` §1 exige IDs UUIDv7 (ordenables por tiempo)
 * generados por el cliente. Generarlos requiere leer la hora actual, y el
 * dominio tiene prohibido usar `Date.now()`/`new Date()` directamente
 * (04-arquitectura.md §3.1). Por eso la función de generación real se
 * implementa cuando la primera feature la necesite (H1+), recibiendo el
 * tiempo desde el puerto `Clock` en vez de leerlo directamente, por ejemplo:
 * `generateId(clock: Clock): Id`.
 */
export type Id = string & { readonly __brand: "Id" };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isId(value: string): value is Id {
  return UUID_PATTERN.test(value);
}

export function asId(value: string): Id {
  if (!isId(value)) {
    throw new Error(`"${value}" no es un Id (UUID) válido.`);
  }
  return value;
}
