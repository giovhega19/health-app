# F06 · Registro y progreso

| Campo | Valor |
|---|---|
| Versión | MVP 1.0 |
| RF | RF-06.01 … RF-06.06 |
| Reglas | RN-04, RN-10, RN-12 |
| Módulos | `features/progress` (proyecciones de lectura calculadas a partir de las sesiones) |

## Objetivo
Que el usuario **vea su avance** semanal y mensual: la evidencia de progreso es el principal motor de la retención.

## Métricas
| Métrica | Definición |
|---|---|
| Sesiones | Número de sesiones COMPLETED en el periodo |
| Adherencia | RN-12 |
| Minutos activos | Suma del tiempo en fases WORK |
| Minutos totales | endedAt − startedAt − pausas |
| Volumen | Σ(actualReps × weightKg) en series completadas |
| Kcal estimadas | RN-04 |
| Racha actual y mejor racha | RN-10 |
| Peso corporal | Último registro, variación en el periodo y media móvil de 7 días |

## Criterios de aceptación
```gherkin
  Escenario: CA-06.02.1 Dashboard semanal
    Dado que esta semana (lunes a domingo, según la configuración regional) tenía 5 días programados y completé 4
    Entonces veo "4/5 sesiones · 80 % de adherencia"
    Y los minutos, volumen y kcal de la semana
    Y un gráfico de barras por día con los días programados marcados

  Escenario: CA-06.02.2 Comparación
    Entonces cada métrica muestra la variación frente a la semana anterior (▲ / ▼ y %)

  Escenario: CA-06.03.1 Vista mensual
    Cuando cambio a "Mes"
    Entonces veo un calendario de calor con la intensidad según los minutos activos
    Y los totales del mes y la comparación con el mes anterior
    Y puedo navegar a meses anteriores

  Escenario: CA-06.04.1 Peso
    Dado 10 registros de peso en 30 días y un peso objetivo
    Entonces veo la línea de registros, la media móvil de 7 días y la línea del objetivo
    Y el texto "Te faltan X kg" o "¡Objetivo alcanzado!"

  Escenario: CA-06.05.1 Récord personal
    Cuando en una sesión supero el máximo histórico de reps o de peso de un ejercicio
    Entonces se registra un récord personal
    Y se emite PersonalRecordAchieved

  Escenario: CA-06.01.1 Historial
    Cuando abro una sesión pasada
    Entonces veo cada ejercicio con lo planificado frente a lo realizado por serie

  Escenario: CA-06.00.1 Estado vacío
    Dado que no tengo sesiones
    Entonces veo a la mascota con el texto "Tu progreso aparecerá aquí" y el botón "Empezar mi primera rutina"

  Escenario: CA-06.06.1 Resumen semanal
    Dado que es domingo a las 19:00 (configurable) y no es hora de silencio
    Entonces recibo una notificación con sesiones, minutos y racha de la semana
```

## Diseño técnico relevante
- `ProgressQueries` se calcula con SQL agregado sobre SQLite, con índices por `startedAt`.
- Se usa una tabla de resúmenes diarios (`daily_stats`) que se actualiza con el evento `WorkoutSessionCompleted`, para que el dashboard cargue en < 200 ms con años de datos.
- Las gráficas deben tener descripción accesible (texto alternativo con los valores clave).
