/**
 * Reglas de arquitectura verificadas automáticamente sobre el grafo de
 * imports (04-arquitectura.md §3.1, Art. 2.6 de la constitución):
 *
 *   - `domain` no puede importar React, React Native, Expo ni SQLite/Drizzle.
 *   - `domain` no puede depender de `infrastructure`, `presentation` ni `application`.
 *   - `application` no puede depender de UI ni de infraestructura concreta.
 *   - `infrastructure` no puede depender de `presentation`.
 *   - Ninguna feature puede importar los internos de otra: solo su `index.ts` público.
 *
 * La restricción de dominio "sin `Date.now()`/`new Date()` directo" NO se
 * expresa aquí porque dependency-cruiser solo analiza el grafo de imports,
 * no el cuerpo de cada archivo: se aplica como regla de ESLint
 * (`no-restricted-syntax` en `eslint.config.js`), que sí corre sobre el AST.
 *
 * Ejecutar con: `pnpm run arch:check` (ver package.json).
 */

/** @type {string[]} */
const FEATURES = [
  "profile",
  "catalog",
  "routines",
  "scheduling",
  "workout-session",
  "progress",
  "gamification",
  "settings",
  "mascot",
  "sync",
  "social",
];

const DOMAIN_PATH = "^src/(shared/domain|features/[^/]+/domain)";
const APPLICATION_PATH = "^src/features/[^/]+/application";
const INFRASTRUCTURE_PATH = "^src/(shared/infrastructure|features/[^/]+/infrastructure)";

const featureIsolationRules = FEATURES.map((feature) => ({
  name: `feature-isolation-${feature}`,
  comment: `Ninguna otra feature puede importar los internos de "${feature}"; solo su index.ts público (Art. 2.5 de la constitución).`,
  severity: "error",
  from: { path: `^src/features/(?!${feature}/)[^/]+/` },
  to: { path: `^src/features/${feature}/(?!index)` },
}));

module.exports = {
  forbidden: [
    {
      name: "domain-no-react-native-expo-sqlite",
      comment:
        "El dominio es TypeScript puro: sin React, Expo, fetch ni SQLite/Drizzle (04-arquitectura.md §3.1).",
      severity: "error",
      from: { path: DOMAIN_PATH },
      to: { path: "node_modules/(react|react-native|expo|@expo|drizzle-orm|expo-sqlite)" },
    },
    {
      name: "domain-no-infrastructure",
      comment: "El dominio no puede depender de infrastructure.",
      severity: "error",
      from: { path: DOMAIN_PATH },
      to: { path: "/infrastructure/" },
    },
    {
      name: "domain-no-presentation",
      comment: "El dominio no puede depender de presentation.",
      severity: "error",
      from: { path: DOMAIN_PATH },
      to: { path: "/presentation/" },
    },
    {
      name: "domain-no-application",
      comment:
        "El dominio no puede depender de application (la dependencia va en sentido contrario).",
      severity: "error",
      from: { path: DOMAIN_PATH },
      to: { path: "/application/" },
    },
    {
      name: "application-no-ui-or-infrastructure",
      comment:
        "Los casos de uso solo dependen de domain; no de UI ni de infraestructura concreta (04-arquitectura.md §3.1).",
      severity: "error",
      from: { path: APPLICATION_PATH },
      to: {
        path: "(/(infrastructure|presentation)/|node_modules/(react|react-native|expo|@expo))",
      },
    },
    {
      name: "infrastructure-no-presentation",
      comment: "La infraestructura no puede depender de presentation (se inyecta al revés).",
      severity: "error",
      from: { path: INFRASTRUCTURE_PATH },
      to: { path: "/presentation/" },
    },
    ...featureIsolationRules,
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["require", "node", "default"],
    },
    // El workspace usa `nodeLinker: hoisted` (pnpm-workspace.yaml): node_modules
    // vive en la raíz del monorepo (fuera de apps/mobile), así que hay que
    // decirle explícitamente a dependency-cruiser que no siga esos paquetes.
    doNotFollow: {
      path: "node_modules",
    },
    // OJO: node_modules NO va aquí (a diferencia de doNotFollow, `exclude`
    // elimina el módulo del grafo por completo, así que una regla forbidden
    // nunca vería la arista y nunca detectaría la violación).
    exclude: {
      path: "(\\.expo|dist|coverage|e2e)",
    },
  },
};
