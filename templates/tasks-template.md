# Tareas · Fxx <Nombre>

Leyenda:

- `[P]` = paralelizable.
- Estado: ☐ pendiente · ◐ en curso · ☑ hecha.
- Cada tarea debe cumplir la DoD de `07-estrategia-pruebas.md`.

| # | Estado | Tarea | Capa | Agente | CA cubiertos | Depende de |
|---|---|---|---|---|---|---|
| T01 | ☐ | Pruebas de dominio para <regla> | domain | qa-pruebas | CA-xx.yy.1 | — |
| T02 | ☐ | Implementar <entidad / servicio> | domain | dev-mobile-rn | CA-xx.yy.1 | T01 |
| T03 | ☐ [P] | Endpoint <…> contract-first | web | dev-backend-java | CA-xx.yy.2 | — |
| T04 | ☐ | Pantalla <…> con estados vacío, error y sin conexión | presentation | dev-mobile-rn + ux-motivacion | CA-xx.yy.3 | T02 |
| T05 | ☐ | Revisión de seguridad | — | seguridad-privacidad | — | T03 |
| T06 | ☐ | Verificación final y matriz de trazabilidad | — | qa-pruebas | todos | T01–T05 |
