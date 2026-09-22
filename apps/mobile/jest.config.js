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
 * @type {import('jest').Config}
 */
module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ["/node_modules/", "/e2e/", "/.expo/"],
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
    // NOTA (H0, CR-H0.7): los overrides por glob de
    // `./src/features/*/domain/**/*.ts` y
    // `./src/features/*/application/**/*.ts` (90 %/80 % respectivamente,
    // ver Art. 3.2 de la constitución) se agregan cuando la primera
    // feature tenga código real en esas carpetas (hoy solo tienen
    // `.gitkeep`). Un glob de `coverageThreshold` que no matchea ningún
    // archivo hace que Jest falle igual ("Coverage data ... was not
    // found"), así que mantenerlos vacíos ahora rompería `pnpm test
    // --coverage` sin razón. Retirar esta nota en H1.
  },
};
