/**
 * Carpeta reservada para el design system compartido: tokens (color,
 * tipografía, espaciado, radios, movimiento), tema, componentes base y
 * componentes especiales como `Mascot`/`Celebration`
 * (04-arquitectura.md §3.2, §3.4). El design system completo se implementa
 * en F08. H1 solo agrega los tokens mínimos que las primeras pantallas
 * reales necesitan (ver `./tokens.ts`).
 */
export { colors, radii, spacing, typography } from "./tokens";
export { PrimaryButton } from "./PrimaryButton";
export { OptionButton } from "./OptionButton";
export { ProgressBar } from "./ProgressBar";
