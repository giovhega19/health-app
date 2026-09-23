const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/private/defaults/exclusionList").default;

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation loads a WebAssembly worker
// (wa-sqlite.wasm). Metro's default config treats .wasm as a source
// extension it tries to parse as JS, which fails to bundle the worker
// chunk ("Worker chunk not found for .../wa-sqlite/worker.ts"). Moving
// .wasm to assetExts makes Metro serve it as a binary asset instead.
config.resolver.assetExts.push("wasm");
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== "wasm");

// Expo Router (this version) treats every source file under app/ as a
// route candidate — it has no built-in exclusion for *.test.* files or
// __tests__ folders (unlike Next.js-style frameworks). A stray test file
// placed inside app/ gets bundled and executed as if it were a screen,
// crashing at runtime with "expect is not defined" (Jest globals don't
// exist outside the test runner). Tests belong in test/ or src/**/__tests__
// instead, but this blockList is a safety net against that mistake
// recurring. Jest is unaffected: it has its own file discovery, unrelated
// to Metro's resolver.
config.resolver.blockList = exclusionList([/\/app\/.*\.test\.[jt]sx?$/, /\/app\/.*\/__tests__\/.*/]);

// expo-sqlite's web build runs its WASM engine on a worker thread and
// communicates with it via SharedArrayBuffer. Browsers only expose that
// global when the page is "cross-origin isolated", which requires the
// server to send COOP/COEP response headers — Metro's dev server doesn't
// send them by default, so without this the app crashes on startup with
// "SharedArrayBuffer is not defined" the moment it opens the local
// database (see shared/infrastructure/db/client.ts).
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    return middleware(req, res, next);
  };
};

module.exports = config;
