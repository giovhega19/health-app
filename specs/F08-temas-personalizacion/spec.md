# F08 · Personalización y temas

| Campo | Valor |
|---|---|
| Versión | MVP 1.0 (básico) · v1.1 (completo) |
| RF | RF-08.01 … RF-08.06 |
| Módulos | `features/settings`, `shared/ui/theme` |

## Objetivo
Que el usuario sienta la app como **suya** (colores, sonidos, mascota), manteniendo accesibilidad y coherencia visual.

## Sistema de tokens
```ts
// shared/ui/theme/tokens.ts
interface ThemeTokens {
  color: { background; surface; surfaceAlt; textPrimary; textSecondary; accent; accentOn;
           work; rest; success; warning; danger; border };
  typography: { fontFamily; scale: { xs; sm; md; lg; xl; display } };  // respeta el tamaño dinámico del SO
  spacing: [0, 4, 8, 12, 16, 24, 32, 48];
  radius: { sm; md; lg; full };
  motion: { durationFast; durationBase; easing; reduceMotion: boolean };
}
```
- Un tema es un conjunto de tokens. Los componentes **nunca** usan colores literales (regla de lint).
- Los temas se definen en JSON validado. Agregar un tema nuevo no requiere cambios de código.

## Criterios de aceptación
```gherkin
  Escenario: CA-08.01.1 Tema del sistema
    Dado que elijo "Sistema"
    Cuando el SO cambia a modo oscuro
    Entonces la app cambia al tema oscuro sin reiniciar

  Escenario: CA-08.02.1 Color de acento
    Cuando elijo el acento "Verde"
    Entonces botones principales, anillo del cronómetro (WORK) y gráficas usan ese acento
    Y cada combinación acento/fondo cumple un contraste ≥ 4,5:1 (verificado por prueba automática)

  Escenario: CA-08.03.1 Sonido y vibración
    Cuando cambio el paquete de sonidos
    Entonces escucho una vista previa
    Y el cambio se aplica a la siguiente señal del cronómetro

  Escenario: CA-08.04.1 Texto grande
    Dado el tamaño de texto del SO al 200 %
    Entonces la pantalla de sesión sigue siendo usable sin cortes (el diseño se adapta)

  Escenario: CA-08.00.1 Persistencia
    Entonces las preferencias se guardan localmente, se sincronizan con la cuenta y se aplican al iniciar sin parpadeo
```

## v1.1 (fuera del MVP)
- Editor de temas personalizados (fondo, acento, forma de botones).
- Temas desbloqueables por nivel o insignias (conecta con RF-07.08).
- Iconos alternativos de la app.
- Selección de idioma.
