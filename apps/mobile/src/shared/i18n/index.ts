/**
 * Configuración real de i18next + react-i18next (04-arquitectura.md §2,
 * RNF-11). Todo texto de UI debe pasar por aquí: ningún literal en
 * componentes (Art. 8.2 de la constitución). Un único idioma disponible en
 * el MVP (español, `05-modelo-dominio-reglas.md`/specs no mencionan
 * localización adicional en H1): `expo-localization` se usa solo para
 * detectar el idioma del dispositivo a futuro, sin bloquear si el
 * dispositivo reporta un locale no soportado (se cae a `es`).
 *
 * `strings` (`./es.ts`) se mantiene como export adicional: es el mismo
 * diccionario cargado como recurso de i18next, y algunos componentes de H1
 * (p. ej. `Consent.tsx`) ya lo consumen directamente por objeto en vez de
 * por la clave con puntos (`t("profile.consent.explanation")`); ambas formas
 * son válidas mientras convivan (no hay literales fuera de `es.ts` en
 * ningún caso).
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { strings } from "./es";

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: {
    es: { translation: strings },
  },
  lng: "es",
  fallbackLng: "es",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export { strings };
export default i18n;
