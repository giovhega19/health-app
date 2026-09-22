# F03 · Creación, edición e importación de rutinas

| Campo | Valor |
|---|---|
| Versión | MVP 1.0 |
| RF | RF-03.01 … RF-03.09 |
| Reglas | RN-05, RN-06, RN-07 |
| Módulos | `features/routines`, `packages/routine-schema` |

## Objetivo
Permitir que el usuario construya **exactamente la rutina que quiere** (por objetivo: bajar de peso, resistencia, músculo…) o traiga una existente, con todos los tiempos parametrizables.

## Historias de usuario
- **HU-03.1** Como usuario avanzado, quiero crear mi rutina con series, reps, peso y descansos, para seguir mi propio plan.
- **HU-03.2** Como usuario, quiero partir de una rutina predefinida y ajustarla.
- **HU-03.3** Como usuario, quiero importar una rutina que me compartió mi entrenador en un archivo.
- **HU-03.4** Como usuario, quiero saber cuánto durará mi rutina antes de programarla.

## Estructura editable
```
Rutina (nombre, objetivo, nivel, descripción, timerDefaults)
 └── Bloque (CALENTAMIENTO | PRINCIPAL | VUELTA A LA CALMA; agrupación NORMAL | SUPERSERIE | CIRCUITO; rondas)
      └── Ítem (ejercicio, series, reps objetivo o segundos, peso, overrides de tiempo)
```

## Criterios de aceptación
```gherkin
  Escenario: CA-03.01.1 Crear rutina mínima
    Cuando creo la rutina "Pierna casa" con 1 bloque PRINCIPAL y 1 ejercicio de 3×12
    Y guardo
    Entonces aparece en "Mis rutinas" con source = USER
    Y muestra la duración estimada según RN-07

  Escenario: CA-03.01.2 Validación
    Dado una rutina sin nombre o sin ejercicios
    Entonces el botón "Guardar" está deshabilitado
    Y se indica qué falta

  Escenario: CA-03.02.1 Ejercicio por tiempo o por reps
    Cuando agrego "Plancha" (modo TIME)
    Entonces el editor pide segundos en lugar de repeticiones

  Escenario: CA-03.03.1 Tiempos por defecto y overrides
    Dado timerDefaults.restBetweenSetsSeconds = 60 en la rutina
    Cuando pongo un override de 30 s en "Flexiones"
    Entonces "Flexiones" muestra 30 s y los demás ejercicios 60 s
    Y el ítem con override tiene un indicador visual

  Escenario: CA-03.04.1 Circuito
    Cuando agrupo 4 ejercicios como CIRCUITO de 3 rondas
    Entonces la duración estimada incluye 2 descansos entre rondas
    Y no incluye descansos entre los ejercicios del circuito

  Escenario: CA-03.05.1 Predefinidas protegidas
    Cuando intento editar una rutina PREDEFINED
    Entonces se me ofrece "Duplicar y editar"
    Y la copia se llama "<nombre> (mi versión)"

  Escenario: CA-03.06.1 Reordenar y deshacer
    Cuando arrastro el ejercicio 3 a la posición 1
    Entonces el orden se actualiza
    Y al eliminar un ejercicio aparece "Deshacer" durante 5 s

  Escenario: CA-03.08.1 Exportar
    Cuando elijo "Exportar" en una rutina
    Entonces se genera un archivo .fitroutine.json válido contra el esquema v1
    Y se abre la hoja nativa de compartir

  Escenario: CA-03.08.2 Importar válido
    Dado un archivo .fitroutine.json válido
    Cuando lo abro con la app o lo selecciono desde "Importar"
    Entonces veo una vista previa (ejercicios, duración)
    Y al confirmar se guarda con source = IMPORTED

  Escenario: CA-03.08.3 Importar con problemas
    Dado un archivo con un ejercicio "catalog:no-existe" y reps = 500
    Cuando lo importo
    Entonces "no-existe" se convierte en ejercicio personalizado
    Y reps se ajusta a 100
    Y veo la lista de advertencias antes de confirmar

  Escenario: CA-03.08.4 Versión no soportada
    Dado un archivo con schemaVersion mayor que la soportada
    Entonces veo "Esta rutina se creó con una versión más nueva de la app. Actualiza para importarla."
```

## Diseño técnico relevante
- `Routine` es un agregado. Las invariantes de RN-06 se validan en su constructor y en sus métodos (`addItem`, `setOverrides`).
- `RoutineDurationEstimator` es un servicio de dominio puro (RN-07). Se prueba con propiedades.
- `RoutineImporter` / `RoutineExporter` viven en `application` y usan el puerto `FileGateway`; la validación del esquema se hace con zod generado desde el JSON Schema.

## Fuera de alcance
Compartir por enlace o QR (v2) y editor en web.
