/**
 * Mutator HTTP usado por el cliente TypeScript generado con orval a partir
 * de `packages/api-contract/openapi.yaml` (ver ADR-004, T11).
 *
 * En H0 el contrato no tiene endpoints todavía, así que esta función no se
 * invoca desde ningún caso de uso real: es el punto único donde, cuando la
 * primera Fxx agregue el primer endpoint, se resolverán la URL base
 * (`/api/v1`), el header `Authorization: Bearer <accessJWT>`
 * (`06-contratos-api.md` §1) y el refresco de token, inyectados desde
 * `src/composition` (sin lógica de negocio aquí).
 */
export async function apiClient<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)} al llamar a ${url}`);
  }

  return (await response.json()) as T;
}
