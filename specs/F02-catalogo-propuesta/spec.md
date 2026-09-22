# F02 · Catálogo de ejercicios, rutinas predefinidas y propuesta

| Campo | Valor |
|---|---|
| Versión | MVP 1.0 |
| RF | RF-02.01 … RF-02.06 |
| Reglas | RN-04, RN-07, RN-14 |
| Módulos | `features/catalog`, backend `catalog` |

## Objetivo
Ofrecer un catálogo confiable y visual de ejercicios y rutinas que funcione sin conexión, y proponer automáticamente un plan adecuado al perfil.

## Contenido mínimo del MVP
- **~60 ejercicios**, cada uno con:
  - imagen o animación en loop;
  - al menos 3 pasos de instrucciones y 2 errores comunes;
  - MET, grupos musculares y equipo.
- **Video** en los 20 ejercicios principales.
- **≥ 12 rutinas predefinidas**: al menos 2 por objetivo, y en cada objetivo al menos 1 BEGINNER y 1 que no requiera equipo.
- El contenido lo valida un profesional del deporte (tarea de contenido, no de código).

## Historias de usuario
- **HU-02.1** Como usuario, quiero ver cómo se hace un ejercicio, para hacerlo con buena técnica.
- **HU-02.2** Como usuario, quiero filtrar ejercicios por músculo y equipo, para encontrar alternativas.
- **HU-02.3** Como usuario, quiero que la app me proponga un plan según mi objetivo, para no tener que diseñarlo yo.

## Criterios de aceptación
```gherkin
  Escenario: CA-02.01.1 Detalle de ejercicio
    Cuando abro el ejercicio "Flexión de pecho"
    Entonces veo su animación, grupos musculares, equipo, dificultad, pasos y errores comunes
    Y si tiene video, veo un botón "Ver video"

  Escenario: CA-02.02.1 Filtros combinados
    Dado el filtro grupo muscular = PECHO y equipo = NONE
    Entonces solo veo ejercicios que trabajan pecho y no requieren equipo
    Y el número de resultados se anuncia al lector de pantalla

  Escenario: CA-02.04.1 Propuesta según perfil
    Dado un perfil MUSCLE_GAIN, INTERMEDIATE, 4 días, 60 min, equipo [DUMBBELLS, PULL_UP_BAR]
    Cuando se genera la propuesta
    Entonces obtengo un plan torso/pierna de 4 días
    Y cada rutina dura entre 54 y 66 minutos según RN-07
    Y todos los ejercicios requieren solo NONE, DUMBBELLS o PULL_UP_BAR
    Y las series están entre 3 y 4, con 8–12 reps y 60–90 s de descanso

  Escenario: CA-02.04.2 Siempre al menos un día de descanso
    Dado un perfil con 7 días por semana
    Entonces la propuesta programa como máximo 6 días de entrenamiento

  Escenario: CA-02.04.3 Aceptar o ajustar la propuesta
    Cuando acepto la propuesta
    Entonces las rutinas se copian a "Mis rutinas" y se crean los ScheduleSlot con la hora preferida
    Y puedo cambiar días y horas antes de confirmar

  Escenario: CA-02.05.1 Sin conexión
    Dado que el catálogo y los medios de mis rutinas ya se descargaron
    Y estoy en modo avión
    Entonces puedo ver todos los ejercicios de mis rutinas con su animación

  Escenario: CA-02.06.1 Actualización del catálogo
    Dado que el manifest del servidor tiene una versión mayor que la local
    Cuando la app se abre con conexión
    Entonces descarga solo los cambios (updatedSince) en segundo plano
    Y las rutinas del usuario que referencian ejercicios no se modifican
```

## Diseño técnico relevante
- `RecommendationEngine` es una función pura del dominio: `(profile, catalog) → WeeklyPlan`. Se prueba con tablas de casos.
- Medios: en el MVP se descargan la imagen o animación de todos los ejercicios. Los videos se descargan bajo demanda y quedan en caché (límite de 300 MB, política LRU).

## Fuera de alcance
Programas de varias semanas (v1.1).
