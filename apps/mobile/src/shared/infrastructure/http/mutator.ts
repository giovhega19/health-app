/**
 * Mutator HTTP usado por el cliente TypeScript generado con orval a partir
 * de `packages/api-contract/openapi.yaml` (ver ADR-004, T11), y también
 * directamente por los adaptadores de infraestructura que no usan las
 * funciones generadas (`HttpAuthAdapter`, `HttpCatalogAdapter`,
 * `HttpSyncAdapter`, ver el comentario de cada uno sobre por qué).
 *
 * El header `Authorization: Bearer <accessJWT>` (`06-contratos-api.md` §1) se
 * inyecta explícitamente por cada adaptador que lo necesita (reciben un
 * `getAccessToken()` desde `src/composition`), no de forma global aquí: este
 * mutator también lo usan endpoints públicos (login, registro, catálogo) que
 * no deben enviar ningún token. El refresco de token en 401 queda fuera de
 * este mutator por el mismo motivo (F01-T10: `LoginUser`/el ciclo de refresh
 * no son bloqueantes en esta ronda, ver `specs/F01-perfil-onboarding/tasks.md`
 * F01-T12); se añadirá como un adaptador explícito (p. ej. un
 * `AuthenticatedApiClient` que envuelve a este) el día que haya un
 * consumidor real.
 */
export async function apiClient<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)} al llamar a ${url}`);
  }

  // Varias respuestas exitosas del contrato no tienen cuerpo (`202`, `204`,
  // p. ej. `DELETE /me`, `POST /auth/logout`, `POST /auth/password/forgot`):
  // `response.json()` lanzaría `SyntaxError` sobre un cuerpo vacío. Se lee
  // como texto primero y solo se parsea si hay contenido, en vez de asumir
  // una lista fija de códigos de estado sin cuerpo.
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
