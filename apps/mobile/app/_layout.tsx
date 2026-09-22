import { Stack } from "expo-router";

/**
 * Root layout de Expo Router. Solo declara el stack de navegación raíz:
 * NO contiene lógica de negocio. Cada feature registra sus propias rutas
 * bajo `app/` delegando en `features/<nombre>/presentation` (ver 04-arquitectura.md §3.2).
 */
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
