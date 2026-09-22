# F10 · Amigos y retos (versión 2.0)

| Campo | Valor |
|---|---|
| Versión | **v2.0**, oculta tras el feature flag `social.enabled` |
| RF | RF-10.01 … RF-10.08 |
| Reglas | RN-09, RN-10, RN-16, RN-17 |
| Módulos | `features/social`, backend `social` + `gamification` (autoridad), push APNs / FCM |

## Objetivo
Aprovechar la **motivación social**: entrenar "con" amigos que también usan la app, mediante retos sanos y sin exponer datos de salud.

## Privacidad por diseño
- Solo se comparte el alias, el avatar de la mascota y las métricas **del reto** (sesiones, minutos, reps del ejercicio del reto, racha). **Nunca** peso, IMC, edad ni género.
- Perfil social desactivado por defecto; se activa con consentimiento explícito.
- Bloquear y reportar disponibles en todo perfil y reto.

## Tipos de reto
| Tipo | Métrica | Ejemplo |
|---|---|---|
| `SESSIONS` | Sesiones completadas | "Quién completa más sesiones en 2 semanas" |
| `MINUTES` | Minutos activos | "300 minutos en marzo" |
| `EXERCISE_REPS` | Reps acumuladas de un ejercicio | "1000 flexiones" |
| `STREAK` | Racha mantenida | "Nadie rompe la racha en 21 días" |

Modalidades:

- **Competitiva:** clasificación.
- **Cooperativa:** meta grupal compartida.

## Criterios de aceptación
```gherkin
  Escenario: CA-10.02.1 Agregar amigo por código
    Dado que mi amigo comparte su código de invitación
    Cuando lo ingreso o escaneo su QR
    Entonces se envía una solicitud
    Y al aceptarla ambos aparecemos en la lista de amigos

  Escenario: CA-10.03.1 Crear reto
    Cuando creo un reto EXERCISE_REPS "Flexión de pecho", meta 1000, de 14 días, e invito a 3 amigos
    Entonces se crea el reto con estado PENDING hasta la fecha de inicio
    Y los invitados reciben una notificación push

  Escenario: CA-10.04.1 Clasificación
    Dado un reto activo
    Cuando un participante sincroniza una sesión válida
    Entonces la clasificación se actualiza en menos de 1 min
    Y si adelanta a otro participante, el adelantado recibe una notificación (respetando RN-16)

  Escenario: CA-10.08.1 Sesión sospechosa
    Dado una sesión con 300 reps en una serie
    Entonces el servidor no la cuenta para el reto (RN-17)
    Y el usuario ve "Esta sesión no cuenta para el reto" con la razón

  Escenario: CA-10.07.1 Bloquear
    Cuando bloqueo a un usuario
    Entonces deja de ver mi perfil y mis retos
    Y no puede invitarme ni enviarme ánimos

  Escenario: CA-10.00.1 Sin conexión
    Dado que estoy en modo avión
    Entonces veo la última clasificación en caché con la marca "actualizado hace X"
```

## Diseño técnico relevante
- El backend es la **autoridad** del progreso de los retos: recalcula a partir de las sesiones sincronizadas.
- Tiempo casi real: actualización por push y *pull on focus*. WebSocket o SSE se evaluará si la escala lo exige (ADR a futuro).
- Módulo `social` independiente (Spring Modulith). Escucha `WorkoutSessionSynced`. No modifica `training`.
