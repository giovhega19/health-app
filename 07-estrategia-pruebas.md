# 07 · Estrategia de pruebas y Definition of Done

## 1. Pirámide de pruebas
| Nivel | % aprox. | Móvil (TS) | Backend (Java) | Qué cubre |
|---|---|---|---|---|
| Unitarias de dominio | 55 % | Jest (+ fast-check para propiedades) | JUnit 5 + AssertJ | Reglas RN, TimerEngine, cálculos, validaciones |
| Unitarias de aplicación | 20 % | Jest con fakes de puertos | JUnit 5 + Mockito | Casos de uso y orquestación |
| Integración | 15 % | Repositorios con SQLite en memoria; cliente API con MSW | Testcontainers (PostgreSQL), `@WebMvcTest`, validación contra OpenAPI | Adaptadores y contratos |
| Componentes / UI | 7 % | React Native Testing Library (incluye accesibilidad: roles y labels) | — | Pantallas y estados |
| E2E | 3 % | Maestro: flujos críticos | Smoke tests en staging | Onboarding → primera sesión, programar → notificación → sesión |

**Pruebas de arquitectura:** dependency-cruiser en móvil; ArchUnit y `ApplicationModules.verify()` en backend. Corren en cada PR.

## 2. Reglas
1. **TDD desde Gherkin.** Cada `CA-xx.yy.z` produce al menos una prueba que cita su ID en el nombre.
2. **Tiempo determinista.** Nadie usa `Date.now()` ni `new Date()` en el dominio: se inyecta `Clock`. En pruebas se usan `FakeClock` y los fake timers de Jest.
3. **Sin red real** en pruebas unitarias ni de componentes: se usa MSW.
4. **Fakes antes que mocks** para los puertos de repositorio (implementaciones en memoria reutilizables en `test/fakes`).
5. **Pruebas basadas en propiedades** para las reglas numéricas. Por ejemplo, RN-07: la duración nunca es negativa y crece monótonamente con las series.
6. **Datos de prueba** con builders (`aRoutine().withItems(3).build()`).
7. **Cobertura mínima** (bloquea el merge): dominio ≥ 90 %, aplicación ≥ 80 %, global ≥ 70 %.

## 3. Casos críticos obligatorios (MVP)
| Área | Casos |
|---|---|
| TimerEngine | Todas las transiciones de la máquina de estados; pausa y reanudación; saltar descanso; ±15 s; recalcular tras 10 min en segundo plano; circuitos con rondas; precedencia RN-05 |
| Cálculos | RN-02, RN-03, RN-04 y RN-07 con valores de referencia y casos límite |
| Gamificación | XP (RN-09), racha con días de descanso y protectores (RN-10), umbral de completado (RN-11) |
| Notificaciones | Recordatorio previo, horas de silencio, límite diario (RN-16), cancelación al eliminar la programación |
| Importación | JSON válido, versión futura, referencia inexistente, valores fuera de rango, archivo demasiado grande |
| Sync | Reintento tras fallo, idempotencia, conflicto LWW, propagación de eliminaciones |
| Seguridad | Refresh token rotativo; token revocado; eliminación de cuenta (datos inaccesibles después) |

## 4. Ejemplo de prueba trazable
```ts
// features/workout-session/domain/__tests__/TimerEngine.test.ts
describe('RF-05.02 Motor de temporizador', () => {
  it('CA-05.02.3 respeta la precedencia ejercicio > rutina > global (RN-05)', () => {
    const clock = new FakeClock('2026-01-01T10:00:00Z');
    const routine = aRoutine()
      .withTimerDefaults({ restBetweenSetsSeconds: 60 })
      .withItem(anItem().sets(2).overrides({ restBetweenSetsSeconds: 30 }))
      .build();
    const engine = TimerEngine.start(routine, globalDefaults, clock.now());
    const afterSet = engine.completeSet(clock.advance(40));
    expect(afterSet.phase).toEqual({ kind: 'REST_BETWEEN_SETS', durationMs: 30_000 });
  });
});
```

## 5. Definition of Done (por tarea / PR)
- [ ] Los criterios de aceptación de la spec tienen pruebas que los citan y pasan.
- [ ] Lint, typecheck, pruebas, arquitectura y cobertura pasan en CI.
- [ ] Sin textos literales en la UI (i18n); accesibilidad verificada (labels, contraste, reducir movimiento).
- [ ] Funciona en modo avión cuando la spec lo exige.
- [ ] Probado en un simulador o dispositivo iOS **y** en un emulador o dispositivo Android.
- [ ] Spec, plan y ADR actualizados si hubo cambios; CHANGELOG actualizado.
- [ ] Revisión aprobada: el agente QA más una persona para cambios de seguridad o datos de salud.
