# 00 · Constitución del proyecto

Principios no negociables. Cualquier spec, plan, tarea o código que los contradiga debe corregirse. Solo pueden cambiarse mediante un ADR aprobado.

## Art. 1 — Las specs son la fuente de verdad
1.1 No se implementa nada que no esté en una spec aprobada.
1.2 Si el código y la spec difieren, se corrige el código o se actualiza la spec en el mismo PR. Nunca se deja la diferencia.
1.3 Toda funcionalidad tiene criterios de aceptación en Gherkin con ID trazable.

## Art. 2 — Arquitectura limpia
2.1 Regla de dependencia: `presentation → application → domain ← infrastructure`. El dominio no depende de nada externo.
2.2 El dominio es TypeScript o Java puro: sin React, Expo, Spring, ORM ni HTTP.
2.3 Toda E/S (base de datos, red, notificaciones, audio, reloj, almacenamiento) se accede mediante **puertos** (interfaces) definidos en el dominio o la aplicación. Sus implementaciones (**adaptadores**) viven en infraestructura.
2.4 El **reloj** también es un puerto (`Clock`), para que el tiempo sea determinista en las pruebas.
2.5 Organización por funcionalidad (feature-first). Cada módulo expone una API pública (`index.ts` o `package-info`) y ningún módulo importa internos de otro.
2.6 Las reglas de dependencia se verifican automáticamente en CI: `dependency-cruiser`/`eslint-plugin-boundaries` en móvil; ArchUnit y Spring Modulith en backend.

## Art. 3 — Pruebas primero
3.1 TDD. La prueba que falla se escribe antes que el código de producción.
3.2 Cobertura mínima: **dominio ≥ 90 %**, **aplicación ≥ 80 %**, **global ≥ 70 %**. El CI falla si no se cumple.
3.3 No se hace merge con pruebas rotas, omitidas (`skip`) o inestables.

## Art. 4 — Offline-first
4.1 Todo el flujo de entrenamiento funciona sin conexión: perfil, rutinas, programación, sesión, progreso y gamificación.
4.2 El dispositivo es la fuente de verdad de los datos de entrenamiento en el MVP. El servidor respalda y sincroniza.

## Art. 5 — Salud y seguridad del usuario
5.1 La app **no es un dispositivo médico** ni da diagnósticos. Todo cálculo de salud (IMC, TMB, calorías) se presenta como estimación, con aviso.
5.2 El onboarding incluye un cuestionario de aptitud física y recomienda consultar a un profesional cuando aplique.
5.3 Los datos de salud son **datos sensibles** (Ley 1581 de 2012, Colombia). Requieren consentimiento explícito, cifrado en tránsito y en reposo, y minimización.
5.4 El usuario puede exportar y eliminar su cuenta y sus datos desde la app.

## Art. 6 — Motivar sin manipular
6.1 La gamificación premia la constancia y la salud, nunca el sobreentrenamiento. No se premian sesiones que violen RN-13 (descanso mínimo).
6.2 Máximo de notificaciones por día configurable (3 por defecto). Se respetan las horas de silencio.
6.3 Nada de patrones oscuros: sin culpa excesiva, sin rachas que castiguen los días de descanso programados.

## Art. 7 — Accesibilidad e inclusión
7.1 WCAG 2.2 AA como objetivo. Soporte de lectores de pantalla, tamaño de texto dinámico y contraste.
7.2 Toda señal sonora tiene equivalente visual y háptico. Toda animación respeta "reducir movimiento".
7.3 Género: opciones inclusivas, incluida "prefiero no decir".

## Art. 8 — Calidad y convenciones
8.1 TypeScript en modo `strict`, sin `any` implícito. Java 21 con reglas de estilo verificadas (Spotless / Checkstyle).
8.2 Código en inglés. Specs y documentación en español. Textos de UI solo mediante i18n, nunca literales en componentes.
8.3 Commits con Conventional Commits que citen el ID (`feat(F05): RF-05.02 timer engine`).
8.4 Toda decisión técnica relevante queda en un ADR (`docs/adr/ADR-xxx.md`).
8.5 Sin secretos en el repositorio.

## Art. 9 — Escalabilidad por diseño
9.1 Una funcionalidad nueva se agrega como módulo nuevo, sin modificar el dominio de otros módulos (principio abierto/cerrado).
9.2 La comunicación entre módulos se hace por API pública o por **eventos de dominio**.
9.3 La API del backend está versionada (`/api/v1`). Los contratos se definen primero en OpenAPI (contract-first) y el cliente TypeScript se genera a partir de ellos.
9.4 Las funcionalidades futuras se activan con **feature flags**.
