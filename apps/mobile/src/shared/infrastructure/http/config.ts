/**
 * URL base de la API (`/api/v1`, `06-contratos-api.md` §1). Se lee de la
 * variable de entorno pública de Expo `EXPO_PUBLIC_API_BASE_URL` (inyectada
 * en build time, ver documentación de Expo sobre variables `EXPO_PUBLIC_*`),
 * con un valor de desarrollo local por defecto para no bloquear `expo start`
 * sin `.env`. Único punto de lectura de esta variable: se inyecta desde
 * `src/composition/container.ts` a los adaptadores HTTP (Art. 2.6).
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";
