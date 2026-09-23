/**
 * Tokens mínimos del design system (color, espaciado). El design system
 * completo (tipografía, radios, movimiento, `Mascot`/`Celebration`) se
 * implementa en F08 (`04-arquitectura.md` §3.2/§3.4). H1 solo necesita un
 * puñado de tokens para que las primeras pantallas reales (p. ej.
 * `profile/presentation/screens/Consent.tsx`) no usen colores literales
 * (Art. 8.2). Se amplía sin romper compatibilidad cuando F08 llegue.
 */
export const colors = {
  background: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  primary: "#2563EB",
  primaryDisabled: "#93C5FD",
  border: "#D1D5DB",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: "700" as const },
  subtitle: { fontSize: 16, fontWeight: "400" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  label: { fontSize: 13, fontWeight: "600" as const },
} as const;
