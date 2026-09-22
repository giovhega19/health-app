# F07 · Motivación y gamificación

| Campo | Valor |
|---|---|
| Versión | MVP 1.0 |
| RF | RF-07.01 … RF-07.07 |
| Reglas | RN-09, RN-10, RN-11, RN-13, RN-15, RN-16 |
| Principio | Constitución, Art. 6 (motivar sin manipular) |
| Módulos | `features/gamification`, suscrito a eventos de `workout-session`, `progress` y `scheduling` |

## Objetivo
**Reducir el abandono**: recompensar la constancia, celebrar los logros y rescatar al usuario cuando se aleja.

## Catálogo inicial de insignias (MVP)
| ID | Insignia | Condición |
|---|---|---|
| B01 | Primer paso | 1.ª sesión completada |
| B02 | Semana redonda | 100 % de adherencia en una semana con ≥ 3 días programados |
| B03 | Racha de 7 | Racha ≥ 7 |
| B04 | Racha de 30 | Racha ≥ 30 |
| B05 | Madrugador | 5 sesiones iniciadas antes de las 7:00 |
| B06 | Nocturno | 5 sesiones iniciadas después de las 20:00 |
| B07 | 10 horas | 600 min activos acumulados |
| B08 | 50 sesiones | 50 sesiones completadas |
| B09 | Creador | 1.ª rutina propia creada |
| B10 | Récord | 1.er récord personal |
| B11 | Constante | 4 semanas seguidas con la meta semanal cumplida |
| B12 | Mil flexiones | 1000 reps acumuladas de ejercicios de la categoría flexión |
| B13 | Regreso triunfal | Completar una sesión tras ≥ 7 días de inactividad |
| B14 | Cardio lover | 300 min de ejercicios cardio |
| B15 | Nivel 10 | Alcanzar el nivel 10 |

Las insignias bloqueadas muestran su progreso ("7/10") para generar anticipación.

## Criterios de aceptación
```gherkin
  Escenario: CA-07.01.1 XP por sesión
    Dado una sesión programada, iniciada 30 min después de la hora, con 45 min activos y 1 récord
    Cuando se completa
    Entonces gano 50 + 45 + 20 + 30 = 145 XP

  Escenario: CA-07.01.2 Subir de nivel
    Dado 270 XP (nivel 1)
    Cuando gano 20 XP
    Entonces alcanzo 290 ≥ 283 = XP(2)
    Y se emite LevelUp(2) con una celebración a pantalla completa

  Escenario: CA-07.02.1 Días de descanso no rompen la racha
    Dado programación lunes, miércoles y viernes, y racha 5
    Y que completé el viernes
    Cuando pasan sábado y domingo sin sesión
    Entonces la racha sigue en 5

  Escenario: CA-07.03.1 Protector de racha
    Dado racha 10 y 1 protector
    Cuando no cumplo un día programado
    Entonces se consume el protector, la racha se mantiene en 10
    Y al abrir la app la mascota me lo informa

  Escenario: CA-07.03.2 Ganar protectores
    Cuando mi racha alcanza un múltiplo de 7
    Entonces gano un protector (máximo 2 acumulados)

  Escenario: CA-07.05.1 Celebración
    Cuando completo una sesión, subo de nivel, desbloqueo una insignia o logro un récord
    Entonces veo una animación de celebración (confeti + mascota) con un sonido corto
    Y con "reducir movimiento" activo se muestra una versión estática

  Escenario: CA-07.06.1 Meta semanal
    Dado una meta de 4 sesiones
    Entonces el inicio muestra un anillo "2/4 esta semana"
    Y al cumplirla, recibo una celebración y +50 XP

  Escenario: CA-07.07.1 Rutina express por inactividad
    Dado un plan activo y 3 días sin sesiones completadas
    Cuando abro la app (o llega la notificación, respetando RN-16)
    Entonces la mascota propone "¿Solo 10 minutos hoy?" con una rutina express acorde a mi equipo
    Y completarla cuenta para la racha si hoy era día programado

  Escenario: CA-07.07.2 Sin sobreentrenamiento
    Dado una sesión iniciada ignorando la advertencia de RN-13
    Entonces no recibe el bono de programación
    Y no suma a insignias de volumen ese día más allá de 2 sesiones
```

## Diseño técnico relevante
- `GamificationService` escucha eventos y actualiza un único agregado `GamificationState`, que tiene un **libro de XP** (`xp_ledger`) de solo agregar, auditable y reconstruible.
- El catálogo de insignias es declarativo (JSON con condiciones evaluables), para agregar insignias nuevas sin tocar código (Art. 9.1).
- En v2 el servidor recalcula XP y racha a partir de las sesiones sincronizadas para los retos (autoridad).
