# F04 · Programación y recordatorios

| Campo | Valor |
|---|---|
| Versión | MVP 1.0 |
| Estado | Aprobado — implementado y cerrado el 2026-09-24 (hito H2, PR #4) |
| RF | RF-04.01 … RF-04.07 |
| Reglas | RN-07, RN-13, RN-15, RN-16 |
| Módulos | `features/scheduling`; puerto `NotificationScheduler` → expo-notifications |

## Objetivo
Que el usuario **programe su semana** y la app le avise antes, al inicio y al final previsto de cada rutina, sin resultar invasiva.

## Historias de usuario
- **HU-04.1** Como usuario, quiero asignar mis rutinas a días y horas, para crear un hábito.
- **HU-04.2** Como usuario, quiero que me avisen X minutos antes y cuando debería terminar.
- **HU-04.3** Como usuario, quiero definir un tiempo mínimo de descanso entre rutinas.
- **HU-04.4** Como usuario, quiero posponer un recordatorio desde la notificación.

## Tipos de notificación
| Tipo | Momento | Acciones |
|---|---|---|
| `PRE_REMINDER` | `inicio − reminderOffsetMin` | Iniciar ahora · Posponer · Omitir hoy |
| `START` | Hora de inicio | Iniciar · Posponer 10 / 30 / 60 min |
| `EXPECTED_END` | Inicio real + duración estimada (solo si la sesión sigue activa) | Abrir sesión |
| `MISSED` | Fin del día o de la ventana de +3 h sin sesión | Reprogramar |
| `INTERVAL_END` | Durante la sesión en segundo plano (ver F05) | — |

## Criterios de aceptación
```gherkin
  Escenario: CA-04.01.1 Programar recurrencia
    Cuando asigno "Pecho y flexiones" a lunes y jueves a las 18:00
    Entonces se crea un ScheduleSlot activo
    Y el calendario semanal lo muestra en ambos días
    Y los días sin programación se muestran como "Descanso"

  Escenario: CA-04.02.1 Recordatorio previo
    Dado un slot a las 18:00 con reminderOffsetMin = 15
    Entonces se programa una notificación local PRE_REMINDER a las 17:45 con el nombre de la rutina y la mascota

  Escenario: CA-04.03.1 Aviso de fin estimado
    Dado que inicio a las 18:05 una rutina con duración estimada de 65 min
    Entonces se programa EXPECTED_END a las 19:10
    Y si termino la sesión antes, EXPECTED_END se cancela

  Escenario: CA-04.04.1 Tiempo mínimo entre rutinas
    Dado minHoursBetweenRoutines = 12 y una sesión completada hoy a las 07:00
    Cuando intento programar o iniciar otra rutina hoy a las 12:00
    Entonces veo la advertencia "Han pasado 5 h desde tu última rutina; recomendamos 12 h"
    Y puedo continuar de todas formas

  Escenario: CA-04.04.2 Mismo grupo muscular
    Dado minHoursSameMuscle = 48 y ayer entrené PIERNA
    Cuando programo otra rutina de PIERNA para hoy
    Entonces veo una advertencia con una rutina alternativa sugerida

  Escenario: CA-04.05.1 Posponer
    Cuando pulso "Posponer 30 min" en la notificación START
    Entonces se programa una nueva notificación START 30 min después
    Y el conteo de pospuestos del día aumenta (máximo 3)

  Escenario: CA-04.06.1 Horas de silencio
    Dado horas de silencio de 22:00 a 07:00
    Cuando una notificación que no es de sesión cae a las 23:00
    Entonces no se entrega en ese momento

  Escenario: CA-04.06.2 Límite diario
    Dado maxNotificationsPerDay = 3 y 3 notificaciones ya entregadas
    Entonces una notificación de reactivación no se entrega hoy

  Escenario: CA-04.01.2 Reprogramación coherente
    Cuando edito o elimino un ScheduleSlot o su rutina
    Entonces todas las notificaciones futuras asociadas se cancelan y se reprograman

  Escenario: CA-04.01.3 Permiso denegado
    Dado que el usuario denegó el permiso de notificaciones
    Entonces el calendario muestra un aviso con un botón a los ajustes del sistema
    Y la programación sigue funcionando sin avisos
```

## Diseño técnico relevante
- Los sistemas operativos limitan la cantidad de notificaciones locales pendientes (en iOS, 64). Por eso `NotificationPlanner` (dominio) solo mantiene programados los **próximos 7 días**, y se replanifica al abrir la app y cada vez que cambia la programación.
- Canales de Android: `reminders`, `workout-timer` (alta prioridad), `motivation`.
- Las acciones de la notificación llevan a deep links (`fitapp://session/start?slot=…`).

## Fuera de alcance
Sincronización con el calendario del sistema (v1.1).

## Preguntas abiertas
Resuelta: **sincronización de `ScheduleSlot` con el backend.** **Confirmado por el dueño del producto (2026-09-23), misma decisión que `specs/F03-editor-rutinas/spec.md`:** sí, se sincroniza en H2. Aunque las notificaciones del sistema operativo nunca sobreviven una reinstalación (son artefactos del dispositivo, no del backend), la programación (`ScheduleSlot`) sí sobrevive si se sincroniza — y como la app ya tiene que "replanificar los próximos 7 días" cada vez que se abre (límite de notificaciones pendientes del SO, ver ADR-010), reconstruir las notificaciones tras reinstalar es automático en cuanto llega el `pull` de sincronización, sin mecanismo adicional.

**Nota informativa, no requiere decisión:** RN-13 (descanso mínimo) y el deep link de las notificaciones a "iniciar sesión" dependen de datos/pantallas de `workout-session` (F05), que no existe hasta H3. **Decisión del arquitecto (no ambigua, documentada en `plan.md` §1):** en H2, `LastSessionQueryPort` usa un adaptador *stub* que nunca produce advertencias (comportamiento seguro por defecto) y el deep link apunta a una pantalla placeholder mínima; F05 sustituye ambos sin tocar código de F04. Se registra aquí solo para que quede explícito que RN-13/CA-04.04.1/.2 contra una **sesión ya completada** (el escenario exacto de los Gherkin de CA-04.04.1/.2, "una sesión completada hoy a las 07:00"/"ayer entrené PIERNA") **no están verificadas de punta a punta hasta H3**, igual que F02 dejó parcialmente verificada CA-02.04.3 al cerrar H1.

**Actualización (cierre de la ronda de verificación final de H2):** `CreateScheduleSlotsFromProposal` (el único flujo real de F04 que crea varios `ScheduleSlot` a la vez, al aceptar una propuesta de F02) sí invoca `RestRuleChecker` de verdad, comparando los slots del propio lote entre sí (sin depender de `LastSessionQueryPort`) — así RN-13 se calcula y se muestra en el calendario semanal (`WeeklyCalendarScreen`) cuando una propuesta programa, por ejemplo, dos rutinas del mismo grupo muscular a menos de `minHoursSameMuscle` de diferencia. Esto cierra parcialmente CA-04.04.1/.2 para ese camino real (no para el escenario exacto del Gherkin, que sigue esperando a F05/H3).
