/**
 * Jest + jest-expo (preset oficial de Expo, incluye la config de Babel y
 * los mocks de módulos nativos) + React Native Testing Library + MSW +
 * fast-check (ver 04-arquitectura.md §2, `07-estrategia-pruebas.md`).
 *
 * Umbrales de cobertura (Art. 3.2 de la constitución): dominio ≥ 90 %,
 * aplicación ≥ 80 %, global ≥ 70 %. Jest permite pasar rutas/globs como
 * llaves de `coverageThreshold` además de "global", así que se expresan
 * directamente por capa en vez de necesitar una herramienta aparte.
 *
 * MSW v2 (usado desde F02) y algunas de sus dependencias (p. ej. `rettime`)
 * se publican como ESM puro, sin build CJS. `jest-runtime` solo sabe
 * `require()` un módulo así de forma nativa cuando Node expone
 * `vm.SourceTextModule` (Jest, `src/internals/nodeCapabilities.ts`), algo
 * que solo ocurre con el flag `--experimental-vm-modules`. Por eso el script
 * `test` de `package.json` invoca Jest como
 * `node --experimental-vm-modules .../jest.js` en vez de solo `jest`: sin
 * ese flag, cualquier prueba que importe `msw` falla con "Must use import to
 * load ES Module" (un fallo de entorno, no el rojo esperado de TDD). No hace
 * falta ningún `transform`/`transformIgnorePatterns` adicional aquí: con el
 * flag, Jest usa el mismo `require()` síncrono nativo de Node que ya
 * funciona fuera de Jest.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ["/node_modules/", "/e2e/", "/.expo/"],
  // `@test/*` apunta a `apps/mobile/test/` (fakes de puertos, builders de
  // datos y catálogo semilla reutilizables entre features, ver
  // `07-estrategia-pruebas.md` §2.4/2.6 y `specs/F02-catalogo-propuesta/plan.md`
  // §5). Solo se usa desde archivos de prueba, nunca desde código de
  // producción (por eso no hace falta reflejarlo en `.dependency-cruiser.js`,
  // que solo analiza `src`/`app`).
  moduleNameMapper: {
    "^@test/(.*)$": "<rootDir>/test/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/*.test.{ts,tsx}",
    // La navegación raíz (Stack de Expo Router) se cubre con pruebas de
    // integración/E2E cuando existan pantallas reales; en H0 es solo
    // cableado declarativo sin lógica propia.
    "!app/_layout.tsx",
    // Código generado por orval (T11): no se escriben pruebas a mano sobre
    // archivos regenerables; hoy solo son interfaces (Problem, ...) sin
    // sentencias ejecutables.
    "!src/shared/infrastructure/http/generated/**",
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    "./src/shared/domain/**/*.ts": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // H1 (F01/F02): primera vez que `features/*/domain` y
    // `features/*/application` tienen código real (antes solo `.gitkeep`,
    // ver nota de H0/CR-H0.7 que este cambio retira). Art. 3.2: dominio
    // ≥ 90 %, aplicación ≥ 80 %.
    "./src/features/*/domain/**/*.ts": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "./src/features/*/application/**/*.ts": {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
