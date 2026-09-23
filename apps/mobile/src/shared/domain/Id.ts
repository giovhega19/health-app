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
import type { Clock } from "./Clock";

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

let generateIdCallCount = 0;

/**
 * Generador de `Id` determinista basado en el puerto `Clock` (H1+, ver el
 * comentario superior de este archivo): el dominio/aplicación nunca lee la
 * hora directamente (Art. 2.4), así que el "tiempo" que ordena estos IDs
 * llega siempre por parámetro. No es un UUIDv7 conforme al RFC todavía (eso
 * queda para cuando `06-contratos-api.md` lo exija de forma estricta contra
 * el backend): combina la hora del reloj con un contador incremental para
 * garantizar unicidad dentro del mismo proceso.
 */
export function generateId(clock: Clock): Id {
  generateIdCallCount += 1;
  const hex = (clock.now().getTime().toString(16) + generateIdCallCount.toString(16))
    .padStart(32, "0")
    .slice(-32);
  const formatted = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  return asId(formatted);
}
