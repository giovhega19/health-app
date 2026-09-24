import { useLocalSearchParams } from "expo-router";
import { SessionDeepLinkPlaceholderScreen } from "@/features/scheduling/presentation/screens/SessionDeepLinkPlaceholder";

/**
 * Ruta de Expo Router para el deep link de sesión
 * (`fitapp://session/start?slot=<id>`, `features/scheduling/domain/deepLink.ts`).
 * Placeholder mínimo de H2 (`specs/F04-programacion-recordatorios/plan.md`
 * §1 punto 2); F05 (H3) reemplaza esta pantalla sin cambiar la ruta ni el
 * contrato de la URL.
 */
export default function SessionStartRoute(): React.JSX.Element {
  const { slot } = useLocalSearchParams<{ slot?: string }>();

  return <SessionDeepLinkPlaceholderScreen scheduleSlotId={slot ?? null} />;
}
