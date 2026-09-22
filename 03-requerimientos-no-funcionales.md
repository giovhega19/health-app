# 03 · Requerimientos no funcionales

| ID | Categoría | Requerimiento | Verificación |
|---|---|---|---|
| RNF-01 | Plataformas | iOS y Android desde **una sola base de código** React Native. Versiones mínimas: las soportadas por el Expo SDK elegido (ADR-001) | Build EAS en ambas plataformas |
| RNF-02 | Rendimiento | Arranque en frío < 2,5 s en un dispositivo de gama media; transiciones y animaciones a 60 fps; listas virtualizadas | Perfilado en dispositivo real y Flashlight / Perf Monitor |
| RNF-03 | Precisión del cronómetro | Desviación ≤ 1 s en una sesión de 60 min, incluso tras segundo plano o bloqueo. El tiempo se calcula con marcas de tiempo absolutas, **nunca** acumulando ticks | Pruebas unitarias con reloj falso y prueba manual de 60 min |
| RNF-04 | Offline | El 100 % del flujo de entrenamiento funciona sin red; la sincronización se reanuda sola al recuperar la conexión | Pruebas en modo avión |
| RNF-05 | Sincronización | Cambios locales en cola (outbox) con reintentos exponenciales; convergencia en < 30 s con red; sin pérdida de datos ante conflictos (RN-18) | Pruebas de integración del SyncEngine |
| RNF-06 | Seguridad móvil | OWASP MASVS nivel L1. Tokens en almacenamiento seguro (Keychain / Keystore) y sin datos sensibles en logs | Revisión del agente de seguridad y checklist MASVS |
| RNF-07 | Seguridad backend | TLS 1.2+; contraseñas con Argon2id o bcrypt; access token JWT de 15 min y refresh token rotativo de 30 días con revocación; rate limiting en autenticación; validación de toda entrada; OWASP ASVS L1 | Pruebas de integración y escaneo DAST |
| RNF-08 | Privacidad | Cumplimiento de la Ley 1581 de 2012 y su decreto reglamentario (Colombia): consentimiento previo, expreso e informado para datos sensibles, finalidad declarada, derechos de acceso, rectificación y supresión. Minimización de datos. Preparado para GDPR si se expande | Revisión legal y del agente de seguridad |
| RNF-09 | Cifrado en reposo | Base de datos del servidor cifrada; en el dispositivo, datos sensibles protegidos por el sandbox del SO y cifrado del dispositivo; tokens en SecureStore | Revisión |
| RNF-10 | Accesibilidad | WCAG 2.2 AA: etiquetas en todos los controles, contraste ≥ 4,5:1, objetivos táctiles ≥ 44×44 pt, tipografía dinámica, "reducir movimiento" y alternativas visuales y hápticas a los sonidos | Auditoría con VoiceOver y TalkBack; pruebas de accesibilidad en RNTL |
| RNF-11 | Internacionalización | Todo texto de UI vía i18next; formatos de fecha, número y unidades según la configuración regional; unidades métricas e imperiales | Lint que prohíbe literales en JSX |
| RNF-12 | Batería | La sesión no usa GPS ni sondeos de red; el timer se actualiza a ≤ 4 Hz en pantalla y se suspende en segundo plano | Perfilado de energía |
| RNF-13 | Tamaño | Instalación inicial < 60 MB; videos y paquetes de medios se descargan bajo demanda | Reporte de EAS |
| RNF-14 | Disponibilidad | Backend ≥ 99,5 % mensual; la app sigue operativa aunque el backend no responda | Monitoreo de uptime |
| RNF-15 | Escalabilidad | Backend sin estado, escalable horizontalmente; medios servidos por CDN; objetivo de 10 000 usuarios activos diarios sin rediseño | Pruebas de carga (k6 / Gatling) |
| RNF-16 | Observabilidad | Crash reporting (Sentry) en móvil y backend; logs estructurados JSON con correlation-id; métricas con Micrometer / Prometheus; analítica de producto solo con consentimiento | Paneles y alertas |
| RNF-17 | Mantenibilidad | Cobertura según la Constitución (Art. 3.2); complejidad ciclomática ≤ 10 por función; reglas de arquitectura en CI | CI |
| RNF-18 | Actualizaciones | Parches de JS vía actualizaciones OTA (EAS Update) cuando las políticas de las tiendas lo permitan; cambios nativos vía nueva versión en tienda | Proceso de release |
| RNF-19 | Usabilidad | Primera sesión completada en ≤ 3 min desde la instalación (modo invitado + rutina propuesta) | Pruebas con usuarios |
| RNF-20 | Legal / salud | Aviso médico visible en onboarding y en la configuración; la app no hace afirmaciones médicas | Revisión |
