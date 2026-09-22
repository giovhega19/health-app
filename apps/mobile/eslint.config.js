// @ts-check
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier");

/**
 * Config base: reglas recomendadas de Expo/React Native (eslint-config-expo)
 * más eslint-config-prettier al final para desactivar las reglas de estilo
 * que Prettier ya resuelve (evita conflictos entre ambas herramientas).
 *
 * Las reglas de capas basadas en el grafo de imports (domain no importa
 * infrastructure/presentation, application no importa UI, features
 * aisladas entre sí) se verifican con dependency-cruiser
 * (`.dependency-cruiser.js`, script `pnpm run arch:check`, T09), no aquí:
 * dependency-cruiser analiza imports; ESLint analiza el AST de cada
 * archivo. Por eso la única regla "de arquitectura" que sí vive en ESLint
 * es la prohibición de `Date.now()`/`new Date()` directo en `domain`
 * (04-arquitectura.md §3.1, Art. 2.4 de la constitución): es una
 * restricción de sintaxis, no de imports.
 */
const typescriptConfigEntry = expoConfig.find(
  (entry) => entry.plugins && entry.plugins["@typescript-eslint"],
);

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    ignores: ["dist/*", "src/shared/infrastructure/http/generated/**", ".expo/*"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": typescriptConfigEntry.plugins["@typescript-eslint"],
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/shared/domain/**/*.ts", "src/features/*/domain/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message:
            "El dominio no puede leer la hora con Date.now(): recibe el tiempo por el puerto Clock (04-arquitectura.md §3.1).",
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            "El dominio no puede instanciar `new Date()` (hora actual) directamente: recibe el tiempo por el puerto Clock (04-arquitectura.md §3.1).",
        },
      ],
    },
  },
];
