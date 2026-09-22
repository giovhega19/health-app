# 02 · Requerimientos funcionales

Prioridad **MoSCoW**:

- **M** = Must (imprescindible)
- **S** = Should (importante)
- **C** = Could (deseable)
- **W** = Won't now (fuera de esta versión)

Los criterios de aceptación detallados están en `specs/Fxx-*/spec.md`.

## F01 — Cuenta, perfil y onboarding
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-01.01 | Registro e inicio de sesión con email y contraseña, recuperación de contraseña y **modo invitado** (solo local, con opción posterior de crear cuenta sin perder datos) | M | 1.0 |
| RF-01.02 | Onboarding guiado: objetivo principal (bajar de peso, mejorar resistencia, aumentar masa muscular, fuerza, salud general / tonificar), nivel, días por semana, minutos por sesión, equipo disponible y lugar | M | 1.0 |
| RF-01.03 | Datos generales: fecha de nacimiento (la edad se deriva), género (masculino, femenino, otro, prefiero no decir), estatura, peso actual, peso objetivo opcional y sistema de unidades | M | 1.0 |
| RF-01.04 | Cuestionario de aptitud física (tipo PAR-Q). Si alguna respuesta es positiva, se recomienda consultar a un profesional y se registra el reconocimiento | M | 1.0 |
| RF-01.05 | Cálculo y visualización de IMC (con categoría) y TMB estimada, con aviso de que no es consejo médico | M | 1.0 |
| RF-01.06 | Registro del peso en el tiempo (historial) y edición del perfil | M | 1.0 |
| RF-01.07 | Consentimiento explícito para el tratamiento de datos de salud y aceptación de política de privacidad y términos | M | 1.0 |
| RF-01.08 | Eliminación de cuenta y de todos los datos desde la app | M | 1.0 |
| RF-01.09 | Exportación de datos personales (JSON/CSV) | S | 1.1 |
| RF-01.10 | Login con Google y con Apple | S | 1.1 |

## F02 — Catálogo de ejercicios, rutinas predefinidas y propuesta
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-02.01 | Biblioteca de ejercicios: nombre, grupos musculares, equipo, dificultad, tipo (reps o tiempo), instrucciones paso a paso, errores comunes, imagen o animación, video opcional y valor MET | M | 1.0 |
| RF-02.02 | Búsqueda y filtros por grupo muscular, equipo, dificultad y tipo | M | 1.0 |
| RF-02.03 | Al menos 12 rutinas predefinidas, clasificadas por objetivo, nivel, duración y equipo | M | 1.0 |
| RF-02.04 | Propuesta automática de plan semanal según perfil, objetivo, nivel, disponibilidad y equipo (motor de reglas RN-14) | M | 1.0 |
| RF-02.05 | Descarga y caché de medios para uso sin conexión | M | 1.0 |
| RF-02.06 | Actualización del catálogo desde el servidor sin publicar una nueva versión de la app | S | 1.0 |
| RF-02.07 | Programas de varias semanas con progresión | S | 1.1 |

## F03 — Creación, edición e importación de rutinas
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-03.01 | Crear rutina: nombre, objetivo, descripción y bloques (calentamiento, principal, vuelta a la calma) | M | 1.0 |
| RF-03.02 | Configurar cada ejercicio: series, reps objetivo **o** duración, peso, descanso entre series y descanso posterior al ejercicio | M | 1.0 |
| RF-03.03 | Parámetros de tiempo por defecto a nivel de rutina (preparación, trabajo, descansos, rondas) | M | 1.0 |
| RF-03.04 | Agrupar ejercicios en superseries o circuitos con número de rondas | S | 1.0 |
| RF-03.05 | Duplicar una rutina predefinida para personalizarla (las predefinidas no se editan) | M | 1.0 |
| RF-03.06 | Reordenar con arrastrar y soltar, eliminar y deshacer | M | 1.0 |
| RF-03.07 | Crear ejercicio personalizado con nombre, notas y foto propia | S | 1.0 |
| RF-03.08 | Importar y exportar rutinas en archivo JSON con esquema versionado; compartir con la hoja nativa del sistema | M | 1.0 |
| RF-03.09 | Estimación automática de duración total y calorías de la rutina | M | 1.0 |
| RF-03.10 | Compartir rutina por enlace o QR con otros usuarios | C | 2.0 |

## F04 — Programación y recordatorios
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-04.01 | Calendario semanal: asignar rutinas a días y hora, con recurrencia semanal y días de descanso | M | 1.0 |
| RF-04.02 | Recordatorio previo configurable (0, 5, 10, 15, 30 o 60 min antes) | M | 1.0 |
| RF-04.03 | Aviso al inicio programado y aviso de fin estimado de la rutina | M | 1.0 |
| RF-04.04 | Tiempo mínimo entre rutinas (horas) y descanso mínimo por grupo muscular, parametrizables, con advertencia al programar | M | 1.0 |
| RF-04.05 | Acciones desde la notificación: iniciar, posponer (10, 30 o 60 min) y omitir hoy | M | 1.0 |
| RF-04.06 | Horas de silencio y máximo de notificaciones por día | M | 1.0 |
| RF-04.07 | Aviso de sesión perdida con propuesta de reprogramar (una sola vez) | S | 1.0 |
| RF-04.08 | Sincronización con el calendario del dispositivo | C | 1.1 |

## F05 — Sesión de entrenamiento y cronómetros
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-05.01 | Iniciar sesión desde rutina, calendario o notificación, con vista previa | M | 1.0 |
| RF-05.02 | Motor de temporizador con fases: preparación, trabajo, descanso entre series, descanso entre ejercicios, descanso entre rondas y completado. Todas parametrizables (RN-05) | M | 1.0 |
| RF-05.03 | Ejercicios por tiempo (cuenta regresiva) y por repeticiones (cronómetro ascendente + botón "Serie hecha") | M | 1.0 |
| RF-05.04 | Señales sonoras y hápticas: cuenta 3-2-1, cambio de fase y aviso a mitad del intervalo (configurable) | M | 1.0 |
| RF-05.05 | Controles: pausar, reanudar, saltar descanso, ±15 s de descanso, ejercicio anterior o siguiente, terminar | M | 1.0 |
| RF-05.06 | Marcar series y ejercicios completados; ajustar reps realizadas y peso con botones +/−; RPE opcional (1–10) | M | 1.0 |
| RF-05.07 | Funcionamiento con pantalla bloqueada o en segundo plano (notificación al terminar cada intervalo) y pantalla siempre encendida durante la sesión | M | 1.0 |
| RF-05.08 | Mostrar imagen o animación, instrucciones y video del ejercicio actual y adelanto del siguiente | M | 1.0 |
| RF-05.09 | Resumen al terminar: duración, series, volumen, kcal estimadas, XP, récords e insignias | M | 1.0 |
| RF-05.10 | Recuperar una sesión interrumpida (cierre o crash) | M | 1.0 |
| RF-05.11 | Sugerencia de progresión (subir o bajar reps o peso) según desempeño (RN-08) | S | 1.0 |
| RF-05.12 | Voz guía (TTS) con nombre del ejercicio y conteo | S | 1.1 |
| RF-05.13 | Controles en la pantalla de bloqueo (Live Activity / notificación persistente) | C | 1.1 |

## F06 — Registro y progreso
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-06.01 | Historial de sesiones con detalle por serie | M | 1.0 |
| RF-06.02 | Dashboard semanal: sesiones (completadas vs programadas), adherencia %, minutos, volumen, kcal y racha | M | 1.0 |
| RF-06.03 | Vista mensual: calendario de calor, totales y comparación con el mes anterior | M | 1.0 |
| RF-06.04 | Gráfica de peso corporal con tendencia (media móvil de 7 días) y avance hacia el peso objetivo | M | 1.0 |
| RF-06.05 | Récords personales por ejercicio (máx. reps, máx. peso, mejor tiempo) | S | 1.0 |
| RF-06.06 | Resumen semanal notificado | S | 1.0 |
| RF-06.07 | Progreso por ejercicio con 1RM estimado y medidas corporales | S | 1.1 |

## F07 — Motivación y gamificación
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-07.01 | Puntos de experiencia (XP) y niveles (RN-09) | M | 1.0 |
| RF-07.02 | Racha basada en días programados cumplidos, donde los días de descanso no rompen la racha (RN-10) | M | 1.0 |
| RF-07.03 | Protector de racha ganado por constancia | S | 1.0 |
| RF-07.04 | Catálogo inicial de 15 insignias o logros con progreso visible | M | 1.0 |
| RF-07.05 | Celebraciones visuales y sonoras (confeti, mascota y sonido) al completar, subir de nivel o lograr un récord | M | 1.0 |
| RF-07.06 | Meta semanal personal (sesiones o minutos) | S | 1.0 |
| RF-07.07 | Estrategia anti-abandono: tras detectar inactividad, ofrecer rutina express de 10 min y plan de "vuelta suave" (RN-15) | M | 1.0 |
| RF-07.08 | Recompensas desbloqueables (temas, accesorios de mascota) | S | 1.1 |

## F08 — Personalización y temas
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-08.01 | Tema claro, oscuro o sistema | M | 1.0 |
| RF-08.02 | Color de acento (4 opciones en el MVP) | S | 1.0 |
| RF-08.03 | Ajustes de sonido (paquete de sonidos, volumen, vibración) y de mascota | M | 1.0 |
| RF-08.04 | Tamaño de texto dinámico y reducción de movimiento | M | 1.0 |
| RF-08.05 | Temas completos personalizables y desbloqueables | S | 1.1 |
| RF-08.06 | Selección de idioma | S | 1.1 |

## F09 — Mascota / entrenador virtual
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-09.01 | La mascota aparece en onboarding, inicio de sesión, descansos, fin de sesión, recordatorios y logros | M | 1.0 |
| RF-09.02 | Cinco estados animados: saludo, animando, descansando, celebrando y durmiendo (día de descanso) | M | 1.0 |
| RF-09.03 | Frases contextuales desde un catálogo i18n, sin repetir la misma frase dos veces seguidas | M | 1.0 |
| RF-09.04 | Configurar frecuencia de aparición u ocultar la mascota | M | 1.0 |
| RF-09.05 | Varias mascotas, accesorios y evolución con el nivel | S | 2.0 |

## F10 — Amigos y retos (v2)
| ID | Requerimiento | Prio | Versión |
|---|---|---|---|
| RF-10.01 | Alias público y perfil social mínimo, con control de privacidad | M | 2.0 |
| RF-10.02 | Agregar amigos por código, enlace o QR; aceptar o rechazar solicitudes | M | 2.0 |
| RF-10.03 | Crear reto: tipo (sesiones, minutos, reps de un ejercicio, racha), meta, fechas y participantes invitados | M | 2.0 |
| RF-10.04 | Clasificación del reto en tiempo casi real | M | 2.0 |
| RF-10.05 | Notificaciones push de invitaciones, adelantamientos y fin del reto | M | 2.0 |
| RF-10.06 | Reacciones y ánimos predefinidos (sin chat libre) | S | 2.0 |
| RF-10.07 | Bloquear y reportar usuarios | M | 2.0 |
| RF-10.08 | Validación anti-trampa de datos en el servidor (RN-17) | M | 2.0 |
