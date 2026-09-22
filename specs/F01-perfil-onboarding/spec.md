# F01 · Cuenta, perfil y onboarding

| Campo | Valor |
|---|---|
| Versión | MVP 1.0 |
| Estado | Borrador → Aprobado |
| RF | RF-01.01 … RF-01.08 |
| Reglas | RN-01, RN-02, RN-03, RN-14 |
| Depende de | F02 (para mostrar la rutina propuesta) |
| Módulos | `features/profile`, backend `identity` y `profile` |

## Objetivo
Llevar al usuario de la instalación a su **primera rutina propuesta en menos de 3 minutos**, recogiendo solo los datos necesarios y con consentimiento explícito sobre sus datos de salud.

## Historias de usuario
- **HU-01.1** Como usuario nuevo, quiero probar la app sin registrarme, para decidir si me sirve.
- **HU-01.2** Como usuario, quiero indicar mi objetivo, nivel, tiempo y equipo, para recibir rutinas adecuadas.
- **HU-01.3** Como usuario, quiero registrar mi edad, género, estatura y peso, para controlar mi peso y recibir cálculos personalizados.
- **HU-01.4** Como usuario, quiero eliminar mi cuenta y mis datos cuando lo decida.

## Flujo de onboarding
Bienvenida (mascota saluda) → Objetivo → Nivel → Disponibilidad (días y minutos) → Equipo → Datos corporales → Cuestionario de aptitud → Consentimiento y aviso médico → Resumen (IMC y TMB) + plan propuesto → [Crear cuenta | Continuar como invitado] → Permiso de notificaciones (en contexto) → Inicio.

- Barra de progreso visible.
- Cada paso se puede retroceder.
- Máximo una pregunta por pantalla.

## Criterios de aceptación
```gherkin
Característica: Onboarding y perfil

  Escenario: CA-01.02.1 Onboarding completo en modo invitado
    Dado que abro la app por primera vez
    Cuando completo todos los pasos y elijo "Continuar como invitado"
    Entonces se crea un perfil local sin cuenta en el servidor
    Y veo mi plan semanal propuesto en la pantalla de inicio

  Escenario: CA-01.03.1 Edad derivada y mínima
    Dado que ingreso una fecha de nacimiento que da una edad menor a 16 años (mínimo definido en D2)
    Cuando intento continuar
    Entonces veo un mensaje que indica que la app requiere la edad mínima
    Y no puedo avanzar

  Escenario: CA-01.03.2 Unidades
    Dado que elijo el sistema imperial
    Cuando ingreso 5 ft 9 in y 165 lb
    Entonces se almacenan 175,3 cm y 74,8 kg
    Y se muestran siempre en unidades imperiales

  Escenario: CA-01.04.1 Cuestionario de aptitud positivo
    Dado que respondo "sí" a alguna pregunta del cuestionario de aptitud
    Cuando termino el cuestionario
    Entonces veo la recomendación de consultar a un profesional de la salud
    Y debo marcar "Entiendo" para continuar
    Y el motor de propuesta solo sugiere rutinas BEGINNER o GENERAL_HEALTH (RN-14)

  Escenario: CA-01.05.1 IMC y TMB
    Dado un perfil de 30 años, género FEMALE, 165 cm y 60 kg
    Entonces el IMC mostrado es 22,0 con categoría "Normal"
    Y la TMB mostrada es 1320 kcal/día
    Y ambos valores aparecen con el aviso "Estimación, no es consejo médico"

  Escenario: CA-01.06.1 Registrar peso
    Dado que estoy en mi perfil
    Cuando registro 59,5 kg con fecha de hoy
    Entonces se agrega al historial
    Y se emite el evento BodyWeightLogged
    Y si ya existía un registro de hoy, se reemplaza

  Escenario: CA-01.01.1 Pasar de invitado a cuenta sin perder datos
    Dado que uso la app como invitado y tengo 3 sesiones registradas
    Cuando creo una cuenta con email y contraseña
    Entonces mis 3 sesiones, rutinas y perfil se sincronizan con la cuenta nueva

  Escenario: CA-01.07.1 Consentimiento obligatorio
    Dado que no marco el consentimiento de tratamiento de datos de salud
    Entonces el botón "Continuar" está deshabilitado
    Y un texto explica por qué es necesario

  Escenario: CA-01.08.1 Eliminar cuenta
    Dado que tengo una cuenta iniciada
    Cuando elijo "Eliminar cuenta" y confirmo escribiendo "ELIMINAR"
    Entonces se llama a DELETE /me
    Y se borran los datos locales
    Y vuelvo a la pantalla de bienvenida
    Y al intentar iniciar sesión con esas credenciales recibo "credenciales inválidas"
```

TMB de referencia: 10·60 + 6,25·165 − 5·30 − 161 = 1320,25 → 1320.

## Validaciones
| Campo | Regla |
|---|---|
| Edad | ≥ 16 años (D2) |
| Estatura | 100–250 cm |
| Peso | 25–350 kg |
| Contraseña | ≥ 8 caracteres; no puede estar en una lista de contraseñas comunes |
| Email | RFC 5322 básico y verificación por enlace (no bloquea el uso) |

## Estados de UI
- Cargando (al crear la cuenta).
- Error de red: se permite seguir como invitado.
- Email ya registrado: se ofrece iniciar sesión.

## Eventos
- `ProfileUpdated`
- `BodyWeightLogged`
- `OnboardingCompleted` (analítica)

## Fuera de alcance
Login social (v1.1) y exportación de datos (v1.1).

## Preguntas abiertas
- ¿Se pide el peso objetivo en el onboarding o después?
