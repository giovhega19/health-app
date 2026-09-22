# 01 · Visión, alcance y roadmap

## 1. Visión
Ayudar a cualquier persona a **convertir el ejercicio en un hábito diario** con rutinas adaptadas a su objetivo, un entrenador virtual que la acompaña y un progreso visible que la motiva a volver cada día.

## 2. Problema
- La mayoría de personas abandona su rutina en las primeras semanas: falta de plan, de recordatorios y de sensación de avance.
- Las apps existentes son rígidas (solo planes predefinidos) o complejas (hojas de cálculo disfrazadas).
- Entrenar en casa exige cronometrar series y descansos, lo que distrae y rompe el flujo.

## 3. Usuarios objetivo (personas)
| Persona | Descripción | Necesidad principal |
|---|---|---|
| **Laura, 29, principiante** | Quiere bajar de peso y entrena en casa sin equipo | Rutinas guiadas, recordatorios y motivación |
| **Andrés, 35, intermedio** | Tiene mancuernas y barra y quiere ganar músculo | Crear sus rutinas, registrar reps y peso, ver progresión |
| **Marta, 52, salud general** | Busca mejorar su resistencia y movilidad | Rutinas suaves, textos grandes y seguridad |
| **Grupo de amigos (v2)** | Quieren competir sanamente | Retos y clasificaciones |

## 4. Objetivos de producto y métricas (KPI)
| Objetivo | Métrica | Meta MVP (90 días) |
|---|---|---|
| Activación | % de usuarios que completan su primera sesión en las primeras 24 h | ≥ 50 % |
| Hábito | Sesiones completadas por usuario activo a la semana | ≥ 3 |
| Retención | Retención D7 / D30 | ≥ 30 % / ≥ 15 % |
| Adherencia | Sesiones completadas / programadas | ≥ 60 % |
| Calidad | Sesiones sin crash | ≥ 99,5 % |
| Satisfacción | Calificación en tiendas | ≥ 4,3 |

## 5. Alcance por versión

### MVP — v1.0 (publicable en tiendas)
| Feature | Incluye |
|---|---|
| F01 Perfil y onboarding | Registro o modo invitado, datos generales (edad, género, peso, estatura), objetivo, nivel, equipo, cuestionario de aptitud, IMC y TMB, historial de peso, eliminación de cuenta |
| F02 Catálogo y propuesta | ~60 ejercicios con imagen o animación (videos en los principales), ≥ 12 rutinas predefinidas por objetivo y nivel, propuesta automática de plan semanal |
| F03 Editor de rutinas | Crear, duplicar y editar; bloques, series, reps o tiempo, peso, descansos; circuitos; importar y exportar en JSON |
| F04 Programación | Calendario semanal, recordatorio previo, aviso de inicio y de fin, tiempo mínimo entre rutinas, posponer, horas de silencio |
| F05 Sesión y cronómetros | Motor de temporizador parametrizable, sonidos y vibración, marcar series, +/- reps y peso, segundo plano, resumen final, sugerencia de progresión |
| F06 Progreso | Dashboard semanal y mensual, adherencia, calendario de calor, gráfica de peso, récords |
| F07 Gamificación | XP, niveles, racha con protector, 15 insignias, celebraciones, rutina express anti-abandono |
| F08 Temas (básico) | Claro, oscuro, sistema y 4 colores de acento |
| F09 Mascota (básica) | 1 mascota con 5 estados animados y frases contextuales |
| Transversal | Sincronización con el backend, i18n (es), accesibilidad, analítica con consentimiento, reporte de errores |

### v1.1 — Profundizar el hábito
Temas personalizables y desbloqueables, voz guía (TTS), inglés, programas de varias semanas, medidas corporales, progreso por ejercicio con 1RM, integración con Apple Health / Health Connect, widgets, login social, exportación de datos, pruebas E2E completas.

### v2.0 — Social
F10 Amigos y retos: agregar amigos por código, enlace o QR; retos por sesiones, minutos, reps o racha; clasificación; notificaciones push; reacciones; bloquear y reportar. Mascota personalizable que evoluciona con el nivel.

### v3.0 — Inteligencia y ecosistema
Plan adaptativo con IA según adherencia y RPE, wearables, nutrición básica, modelo freemium.

## 6. Fuera de alcance (MVP)
Planes de nutrición, chat social, contenido en vivo, entrenadores humanos, pagos, versión web y smartwatch.

## 7. Hitos del MVP (orientativo, 12 semanas)
| Hito | Semanas | Entregable |
|---|---|---|
| H0 Fundaciones | 1–2 | Monorepo, CI, arquitectura base, design system, ADR iniciales, backend de identidad |
| H1 Perfil y catálogo | 3–4 | F01 y F02 |
| H2 Rutinas y programación | 5–6 | F03 y F04 |
| H3 Sesión | 7–8 | F05 (el núcleo del producto) |
| H4 Progreso y motivación | 9–10 | F06, F07, F08 y F09 |
| H5 Endurecimiento y tiendas | 11–12 | Sincronización, pruebas de seguridad, beta cerrada, fichas de tienda y publicación |
