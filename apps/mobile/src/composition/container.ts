/**
 * Composition root de la app (04-arquitectura.md §3.4, decisión 1): aquí
 * se construyen los adaptadores de infraestructura y se inyectan en los
 * casos de uso de `application`, con funciones fábrica (sin librería de
 * DI). En las pruebas, este archivo se sustituye por fakes/mocks.
 *
 * Sin lógica de negocio: en H0 no hay adaptadores ni casos de uso reales
 * todavía, así que el contenedor queda vacío a propósito. Cada Fxx agrega
 * aquí su propia función `createXxxContainer()` cuando implemente su
 * primer caso de uso.
 */
export {};
