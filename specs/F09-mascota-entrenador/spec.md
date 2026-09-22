# F09 · Mascota / entrenador virtual

| Campo | Valor |
|---|---|
| Versión | MVP 1.0 (básica) · v2 (personalizable) |
| RF | RF-09.01 … RF-09.05 |
| Módulos | `features/mascot` (suscrito a eventos), `shared/ui/Mascot` (componente) |

## Objetivo
Dar a la app una **personalidad cercana** que acompañe, anime y celebre. La mascota humaniza los recordatorios y reduce la sensación de "obligación".

## Concepto (a validar con diseño)
Nombre en clave **"Coach"**: personaje original y amigable (no basado en ningún personaje existente), con estilo simple y reconocible en tamaño pequeño (notificaciones) y grande (celebraciones). Animaciones en Lottie; peso ≤ 150 KB por animación.

## Estados y disparadores
| Estado | Animación | Disparador (evento) | Ejemplo de frase (i18n) |
|---|---|---|---|
| `GREETING` | Saluda | Onboarding, primera apertura del día | "¡Hola! ¿Listo para moverte hoy?" |
| `CHEERING` | Anima con los brazos | `WorkoutSessionStarted`, inicio de cada ejercicio, recordatorio START | "¡Vamos con las sentadillas!" |
| `RESTING` | Respira, bebe agua | Fases de descanso | "Respira… 30 segundos y seguimos" |
| `CELEBRATING` | Salta con confeti | `WorkoutSessionCompleted`, `LevelUp`, `BadgeUnlocked`, `PersonalRecordAchieved` | "¡Nuevo récord! Eres imparable" |
| `SLEEPING` | Duerme | Día de descanso, horas de silencio | "Hoy toca recuperar. ¡Mañana volvemos!" |

(v1.1: `CONCERNED` / añoranza suave para la inactividad, siempre sin culpa.)

## Criterios de aceptación
```gherkin
  Escenario: CA-09.01.1 Aparición al iniciar un ejercicio
    Dado la frecuencia de mascota "Normal"
    Cuando empieza el primer ejercicio de la sesión
    Entonces la mascota aparece en estado CHEERING con el nombre del ejercicio
    Y desaparece sola en 3 s sin tapar el cronómetro

  Escenario: CA-09.01.2 Recordatorio con mascota
    Cuando se entrega una notificación PRE_REMINDER o START
    Entonces incluye la imagen de la mascota donde la plataforma lo soporte
    Y un texto del catálogo según la hora del día

  Escenario: CA-09.03.1 Variedad de frases
    Dado que un contexto tiene al menos 5 frases
    Entonces nunca se repite la misma frase dos veces seguidas en ese contexto

  Escenario: CA-09.04.1 Frecuencia configurable
    Dado la frecuencia "Mínima"
    Entonces la mascota solo aparece en celebraciones y en el resumen final
    Y con "Oculta" no aparece en ninguna pantalla ni notificación

  Escenario: CA-09.00.1 Accesibilidad
    Entonces la frase de la mascota se anuncia al lector de pantalla una sola vez
    Y con "reducir movimiento" se muestra un fotograma estático
```

## Diseño técnico relevante
- `MascotDirector` (dominio) decide `(evento, contexto, preferencias) → {estado, fraseId} | null`. Es una función pura y probable.
- El catálogo de frases está en archivos i18n con clave por contexto (`mascot.cheering.exerciseStart.1…n`) y soporta interpolación (`{{exercise}}`).
- Assets en `assets/mascot/<skin>/<state>.json`: el *skin* permite la personalización de v2 sin cambiar código.

## v2
Elegir entre varias mascotas, accesorios desbloqueables por logros, evolución visual por nivel y la mascota como avatar en retos.
