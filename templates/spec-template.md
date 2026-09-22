# Fxx · <Nombre de la funcionalidad>

| Campo | Valor |
|---|---|
| Versión | MVP 1.0 / v1.1 / v2.0 |
| Estado | Borrador / En revisión / Aprobado / Implementado |
| RF | RF-xx.01 … |
| Reglas | RN-xx |
| RNF críticos | RNF-xx |
| Depende de | Fyy |
| Módulos | `features/<modulo>`, backend `<modulo>` |

## Objetivo
<1–3 frases: qué problema del usuario resuelve y cómo se mide el éxito.>

## Historias de usuario
- **HU-xx.1** Como <persona>, quiero <acción>, para <beneficio>.

## Criterios de aceptación
```gherkin
  Escenario: CA-xx.yy.1 <nombre>
    Dado <contexto con datos concretos>
    Cuando <acción>
    Entonces <resultado observable y verificable>
```
Incluye: camino feliz, errores, límites, sin conexión, accesibilidad y estado vacío.

## Reglas de dominio aplicables
<Referencias a RN-xx; propuestas de reglas nuevas si hacen falta.>

## UI / estados
<Pantallas, estados vacío, cargando, error y sin conexión; comportamiento con texto grande y "reducir movimiento".>

## Eventos de dominio
Emite: … · Consume: …

## Diseño técnico relevante (guía, no obligatorio)

## Fuera de alcance

## Preguntas abiertas
