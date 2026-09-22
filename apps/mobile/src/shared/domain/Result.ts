/**
 * Resultado de una operación que puede fallar, sin lanzar excepciones para
 * errores esperados (validación, reglas de negocio). Lo usan los casos de
 * uso de `application` como tipo de retorno (ver 04-arquitectura.md §3.1).
 */
export type Result<T, E> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; error: E }>;

export function ok<T, E = never>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function err<E, T = never>(error: E): Result<T, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Readonly<{ ok: true; value: T }> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Readonly<{ ok: false; error: E }> {
  return !result.ok;
}
