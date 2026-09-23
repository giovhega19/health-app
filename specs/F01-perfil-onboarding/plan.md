# Plan técnico · F01 Cuenta, perfil y onboarding

> Generado por `arquitecto` a partir de `spec.md` (MVP 1.0, aprobado). Cubre el hito **H1** junto con `specs/F02-catalogo-propuesta/plan.md`. No se inicia la implementación sin aprobación del usuario de este `plan.md` y de `tasks.md` (regla de `CLAUDE.md`).
>
> **Estado: ejecutado y cerrado el 2026-09-23** (ver `tasks.md`, CHANGELOG.md §H1).

## 1. Resumen de la solución

F01 lleva al usuario de la instalación a un perfil local completo (con o sin cuenta) en menos de 3 minutos: un asistente de onboarding recoge objetivo, nivel, disponibilidad, equipo, datos corporales y consentimiento; calcula IMC (RN-02) y TMB (RN-03); y cierra con una pantalla de resumen que muestra el **plan semanal propuesto** (motor de F02) antes de decidir entre crear cuenta o continuar como invitado. El backend añade dos módulos nuevos de Spring Modulith: `identity` (registro, login, refresh, recuperación, eliminación de cuenta) y `profile` (perfil y métricas corporales), más un módulo `sync` mínimo que implementa `POST /sync/push` / `GET /sync/pull` solo para las entidades `profile` y `bodyMetric` (ver §4 y §6).

### Secuencia de implementación H1 (dependencia cruzada F01 ↔ F02)

`spec.md` declara F01 "Depende de F02 (para mostrar la rutina propuesta)". Esa dependencia es real pero **puntual**: solo el último paso del onboarding (pantalla "Resumen" con el plan propuesto) necesita el `RecommendationEngine`/`GenerateProposal` de F02. El resto de F01 (cuenta, perfil, cuestionario de aptitud, IMC/TMB, historial de peso, eliminación de cuenta) es autónomo. Se adopta la secuencia **(a)** descrita en el encargo:

1. **En paralelo** (sin bloqueo mutuo):
   - F01: dominio + aplicación completos (`UserProfile`, `BodyMetric`, RN-01/02/03, casos de uso `CompleteOnboarding`, `CreateAccount`, `ContinueAsGuest`, `LogBodyWeight`, `UpdateProfile`, `DeleteAccount`, `LoginUser`), infraestructura (repositorios SQLite, `features/sync` mínimo, adaptador HTTP de `identity`/`profile`), pantallas del asistente **salvo** la pantalla "Resumen", y todo el backend (`identity`, `profile`, `sync` mínimo).
   - F02: dominio del `RecommendationEngine` (función pura, RN-14) y un **catálogo semilla** mínimo de desarrollo (ver `specs/F02-catalogo-propuesta/plan.md` §"Contenido de datos"), con el caso de uso `GenerateProposal` expuesto en la API pública (`features/catalog/index.ts`).
2. **Punto de integración único y explícito:** la tarea `F01-T13` ("`RoutineProposalPort` + wiring en composition root") depende de que `GenerateProposal` de F02 (tarea `F02-T10` en `specs/F02-catalogo-propuesta/tasks.md`) esté implementado y exportado en `features/catalog/index.ts`. Solo entonces se construye la pantalla "Resumen" (`F01-T14`).
3. El acoplamiento entre módulos se hace **por puerto + composition root**, nunca importando internos: `profile/application` declara la interfaz `RoutineProposalPort` (entrada: una instantánea inmutable del perfil recién creado; salida: `WeeklyPlanSummary`). `src/composition/container.ts` (ya scaffoldeado en H0) construye el contenedor de `catalog` y el de `profile`, y pasa la función `generateProposal` de `catalog` como implementación de `RoutineProposalPort` al construir los casos de uso de `profile`. Ningún archivo de `features/profile/**` importa nada de `features/catalog/**` salvo, indirectamente, a través de ese cableado en `composition/`. Esto cumple Art. 2.5 y Art. 9.2 (comunicación entre módulos por API pública o eventos).

Este orden hace que ambos equipos (o el mismo agente, en distintas tandas) puedan avanzar sin bloquearse salvo en ese único punto, documentado también en el `tasks.md` de ambas features con la dependencia cruzada marcada explícitamente.

### Decisión de diseño: vocabulario compartido en `shared/domain`

`Gender`, `FitnessGoal`, `Level`, `Equipment` y `UnitSystem` (enumeraciones de `05-modelo-dominio-reglas.md` §1) los necesita tanto `profile` (F01, datos del usuario) como, más adelante, `catalog` (F02, filtros de equipo y reglas RN-14) y `routines` (F03). Para evitar que una feature importe los internos de otra (Art. 2.5) o que estos tipos terminen duplicados, se declaran como tipos de unión literal **sin dependencias de framework** en `apps/mobile/src/shared/domain/` (`Gender.ts`, `FitnessGoal.ts`, `Level.ts`, `Equipment.ts`, `UnitSystem.ts`). F01 es quien los introduce (primer consumidor); F02 los reutiliza importándolos de `shared/domain`, nunca de `features/profile`. `Height` (conversión cm ↔ ft/in, CA-01.03.2) sí es un value object exclusivo de `profile/domain`, porque ninguna otra feature planificada lo necesita todavía; `Weight` reutiliza el value object ya scaffoldeado en `shared/domain/Weight.ts` (H0), añadiendo en `profile/domain` la validación de rango propia de F01 (25–350 kg).

## 2. Impacto por capa

| Capa | Móvil (`apps/mobile/src/features/profile/`) | Backend (`backend/src/main/java/com/fitapp/`) |
|---|---|---|
| Domain | `domain/UserProfile.ts` (entidad, RN-01 vía `calculateAge`, RN-02 vía `calculateBmi`, RN-03 vía `calculateBmr`), `domain/BodyMetric.ts`, `domain/Height.ts` (VO con conversión de unidades), `domain/errors.ts` (`AgeBelowMinimumError`, `InvalidHeightError`, `InvalidWeightError`, `ConsentRequiredError`, códigos de `Result<T,E>`), `domain/events.ts` (`ProfileUpdated`, `BodyWeightLogged`, `OnboardingCompleted`); nuevos `shared/domain/{Gender,FitnessGoal,Level,Equipment,UnitSystem}.ts` (ver decisión de diseño) | `identity/domain/`: `User`, `Credentials`, `RefreshToken` (rotación, revocación, expiración 30 d), puertos out `UserRepository`, `PasswordHasher`, `TokenIssuer`. `profile/domain/`: `Profile`, `BodyMetric` (réplica server-side minimalista, sin recalcular IMC/TMB — eso es solo de UI cliente), puertos out `ProfileRepository`, `BodyMetricRepository`. `sync/domain/` (mínimo): `SyncChange`, puerto out `SyncEntityHandler` (SPI que `profile` implementa para los tipos `profile`/`bodyMetric`) |
| Application | `application/CompleteOnboarding.ts` (valida y persiste el perfil + primer `BodyMetric`, calcula IMC/TMB, llama a `RoutineProposalPort`), `application/CreateAccount.ts`, `application/ContinueAsGuest.ts`, `application/LoginUser.ts`, `application/LogBodyWeight.ts` (RN-06 no aplica; usa tabla de validaciones de F01), `application/UpdateProfile.ts`, `application/DeleteAccount.ts`; puertos `ProfileRepository`, `BodyMetricRepository`, `AuthPort`, `TokenStoragePort`, `RoutineProposalPort` (todos declarados aquí, implementados en infraestructura) | `identity/application/`: `RegisterUser`, `LoginUser`, `RefreshAccessToken`, `LogoutUser`, `RequestPasswordReset`, `ResetPassword`, `UpgradeGuestToAccount`, `DeleteAccount` (casos de uso = puertos in, implementados por los controladores). `profile/application/`: `GetProfile`, `UpsertProfile`, `AppendBodyMetric`, y el `SyncEntityHandler` para `profile`/`bodyMetric` que registra `sync` |
| Infrastructure | `infrastructure/db/schema.ts` (Drizzle: tablas `profiles`, `body_metrics`), `infrastructure/SqliteProfileRepository.ts`, `infrastructure/SqliteBodyMetricRepository.ts`, `infrastructure/HttpAuthAdapter.ts` (usa el cliente generado por orval + `shared/infrastructure/http/mutator.ts`, ampliado para inyectar `Authorization` y refrescar el token en 401), `infrastructure/SecureTokenStorage.ts` (sobre `shared/infrastructure/secure-storage`). Además, **`features/sync` mínimo** (compartido, primer consumidor F01): `domain/OutboxEntry.ts`, `application/PushPendingChanges.ts`, `application/PullRemoteChanges.ts`, `infrastructure/db/schema.ts` (tabla `outbox`), `infrastructure/HttpSyncAdapter.ts` | `identity/adapters/in/web/` (controladores `/auth/*`, `DELETE /me`), `identity/adapters/out/persistence/` (JPA: `identity_users`, `identity_refresh_tokens`, Argon2id vía `PasswordHasher`), `profile/adapters/in/web/` (`GET/PUT /me/profile`, `GET /me/body-metrics`), `profile/adapters/out/persistence/` (JPA: `profile_profiles`, `profile_body_metrics`); **`sync/adapters/in/web/`** (`POST /sync/push`, `GET /sync/pull`, delegando por `entity` al `SyncEntityHandler` registrado — solo `profile`/`bodyMetric` en H1) |
| Presentation | `presentation/screens/{Welcome,Goal,Level,Availability,Equipment,BodyData,FitnessQuestionnaire,Consent,Summary,AccountChoice,NotificationsPermission,EditProfile,LogWeight,DeleteAccount}.tsx`; `presentation/stores/useOnboardingStore.ts` (Zustand, borrador multi-paso), `presentation/stores/useAuthStore.ts`; rutas nuevas en `apps/mobile/app/onboarding/*` y `apps/mobile/app/(tabs)/profile/*` que solo delegan (Art. 3.1) | — (sin presentación propia; el backend expone API) |

## 3. Contratos

**Cambios en `openapi.yaml` (contract-first, antes que el código — tarea `F01-T03`):**

| Método | Ruta | Request | Response | RF/CA |
|---|---|---|---|---|
| POST | `/auth/register` | `RegisterRequest {email, password, acceptedTermsVersion, healthDataConsent:true}` | `201 AuthTokens {accessToken, refreshToken, user}` | RF-01.01, RF-01.07, CA-01.07.1 |
| POST | `/auth/login` | `LoginRequest {email, password}` | `200 AuthTokens` | RF-01.01 |
| POST | `/auth/refresh` | `RefreshRequest {refreshToken}` | `200 AuthTokens` (rota el refresh) | RF-01.01 |
| POST | `/auth/logout` | `RefreshRequest {refreshToken}` | `204` | RF-01.01 |
| POST | `/auth/password/forgot` | `{email}` | `202` | RF-01.01 |
| POST | `/auth/password/reset` | `{token, newPassword}` | `200` | RF-01.01 |
| POST | `/auth/guest/upgrade` | `RegisterRequest` (mismo cuerpo) | `201 AuthTokens` | RF-01.01, CA-01.01.1 |
| DELETE | `/me` | — (Bearer) | `202` | RF-01.08, CA-01.08.1 |
| GET / PUT | `/me/profile` | `UserProfileDto` | `200 UserProfileDto` | RF-01.03, RF-01.06 |
| GET | `/me/body-metrics?from=&to=` | — | `200 { items: BodyMetricDto[] }` | RF-01.06 |
| POST | `/sync/push` | `SyncPushRequest {deviceId, changes: SyncChange[]}` (header `Idempotency-Key`) | `200 {accepted[], rejected[], serverTime}` | CA-01.01.1, CA-01.06.1 |
| GET | `/sync/pull?cursor=&limit=` | — | `200 {changes: SyncChange[], nextCursor, hasMore}` | CA-01.01.1 |

Todos los errores usan el esquema `Problem` ya definido en el stub de H0. `SyncChange` sigue el formato de `06-contratos-api.md` §"sync" (`{entity, op, id, updatedAt, data}`); **en H1 el backend solo acepta/emite `entity ∈ {profile, bodyMetric}`** — cualquier otro valor se rechaza con `code: "UNSUPPORTED_ENTITY"` hasta que F03/F05/F06/F07 registren sus propios `SyncEntityHandler` (Art. 9.1: módulo nuevo sin tocar `sync`, `identity` ni `profile`).

**Puertos nuevos (TypeScript, `profile/application/ports.ts`):**
```ts
interface ProfileRepository {
  save(profile: UserProfile): Promise<Result<void, RepositoryError>>;
  findCurrent(): Promise<Result<UserProfile | null, RepositoryError>>;
}
interface BodyMetricRepository {
  append(metric: BodyMetric): Promise<Result<void, RepositoryError>>; // upsert por fecha (CA-01.06.1)
  history(range: DateRange): Promise<Result<BodyMetric[], RepositoryError>>;
}
interface AuthPort {
  register(input: RegisterInput): Promise<Result<AuthSession, AuthError>>;
  login(input: LoginInput): Promise<Result<AuthSession, AuthError>>;
  guestUpgrade(input: RegisterInput): Promise<Result<AuthSession, AuthError>>;
  deleteAccount(): Promise<Result<void, AuthError>>;
}
interface RoutineProposalPort {
  propose(profile: ProfileSnapshot): Promise<Result<WeeklyPlanSummary, ProposalError>>;
}
```
`ProfileSnapshot` y `WeeklyPlanSummary` son DTOs de solo lectura definidos en `profile/application` (el primero) y re-exportados desde `catalog` (el segundo) — ver `specs/F02-catalogo-propuesta/plan.md` §3.

**Puertos backend (Java, `identity`/`profile`):** `UserRepository`, `PasswordHasher` (Argon2id), `TokenIssuer` (JWT, claims mínimos `sub`, `exp`, `iat`), `RefreshTokenRepository`, `ProfileRepository`, `BodyMetricRepository`, y el SPI `SyncEntityHandler { boolean supports(String entity); SyncResult apply(SyncChange change); List<SyncChange> pull(String entity, Cursor cursor); }` que `profile` implementa dos veces (uno por `entity`).

**Eventos de dominio (móvil):**
| Evento | Payload | Emisor | Consumidores previstos |
|---|---|---|---|
| `ProfileUpdated` | `{profileId, updatedAt}` | `UpdateProfile`, `CompleteOnboarding` | `sync` (encola en outbox); F06/F09 en hitos futuros |
| `BodyWeightLogged` | `{profileId, weightKg, date}` | `LogBodyWeight` | `sync`; F06 (progreso, futuro) |
| `OnboardingCompleted` | `{profileId, mode: "GUEST"\|"ACCOUNT"}` | `ContinueAsGuest`, `CreateAccount` | Analítica (RNF-16, sin implementar en H1 más que el `publish`) |

## 4. Datos

**Móvil (Drizzle, primera migración real del monorepo):**
- `profiles`: `id` (uuid pk), `account_id` (nullable — null en modo invitado), `birth_date`, `gender`, `height_cm`, `goal`, `level`, `days_per_week`, `minutes_per_session`, `equipment` (json), `unit_system`, `target_weight_kg` (nullable), `parq_flagged` (bool), `health_consent_at`, `updated_at`, `deleted_at` (nullable).
- `body_metrics`: `id` (uuid pk), `profile_id` (fk), `metric_date`, `weight_kg`, `waist_cm` (nullable), `updated_at`, `deleted_at` (nullable). Índice único `(profile_id, metric_date)` para soportar el "reemplaza si ya existe" de CA-01.06.1 como `UPSERT`.
- `outbox` (tabla de `features/sync`, primera vez que se crea): `id` (uuid pk), `entity` (text), `op` (`upsert`|`delete`), `entity_id`, `payload` (json), `created_at`, `attempts` (int), `last_error` (nullable), `status` (`pending`|`sent`|`failed`).
- Los tokens **no** se guardan en SQLite: van a `expo-secure-store` vía `SecureTokenStorage` (ya coherente con `04-arquitectura.md` §2).

**Backend (Flyway, primeras migraciones reales, un esquema lógico por módulo con prefijo de tabla):**
- `identity`: `db/migration/identity/V1__create_identity_tables.sql` → `identity_users` (`id` uuid pk, `email` unique, `password_hash`, `status`, `accepted_terms_version`, `health_data_consent` bool, `created_at`, `deleted_at` nullable), `identity_refresh_tokens` (`id`, `user_id` fk, `token_hash`, `family_id`, `revoked_at` nullable, `expires_at`, `created_at`).
- `profile`: `db/migration/profile/V1__create_profile_tables.sql` → `profile_profiles` (columnas espejo del dominio + `user_id` fk único + `updated_at`/`deleted_at`), `profile_body_metrics` (`id`, `profile_id` fk, `metric_date`, `weight_kg`, `waist_cm` nullable, `updated_at`, `deleted_at`).
- `sync`: sin tabla propia en H1 — el cursor de `GET /sync/pull` se calcula dinámicamente por `updated_at`+`id` sobre las tablas de `profile` (no hace falta una tabla de outbox server-side porque el servidor no encola: aplica el cambio directamente y lo puede volver a servir por cursor). Si en F03/F05 el volumen de entidades sincronizadas lo justifica, se revisará en un ADR posterior si conviene una tabla `sync_log` unificada.

Compatibilidad con sincronización: ambas tablas móviles (`profiles`, `body_metrics`) llevan `updated_at`/`deleted_at` para LWW por entidad (RN-18, ADR-007); las eliminaciones son lógicas.

## 5. Estrategia de pruebas

| CA | Nivel | Archivo de prueba previsto |
|---|---|---|
| CA-01.03.1 (edad mínima, RN-01) | Dominio | `features/profile/domain/__tests__/UserProfile.age.test.ts` |
| CA-01.03.2 (conversión de unidades) | Dominio | `features/profile/domain/__tests__/Height.test.ts`, `BodyWeight.test.ts` |
| CA-01.04.1 (cuestionario de aptitud → solo BEGINNER/GENERAL_HEALTH) | Aplicación (fake de `RoutineProposalPort`) | `features/profile/application/__tests__/CompleteOnboarding.parq.test.ts` |
| CA-01.05.1 (IMC/TMB de referencia) | Dominio | `features/profile/domain/__tests__/UserProfile.bmiBmr.test.ts` (valores de referencia del enunciado + property-based: IMC/TMB nunca negativos) |
| CA-01.06.1 (registrar peso, reemplazo del mismo día) | Aplicación + Integración (SQLite en memoria) | `features/profile/application/__tests__/LogBodyWeight.test.ts`, `infrastructure/__tests__/SqliteBodyMetricRepository.test.ts` |
| CA-01.01.1 (invitado → cuenta sin perder datos) | Aplicación + Integración (MSW) | `features/profile/application/__tests__/CreateAccount.upgrade.test.ts`, `features/sync/application/__tests__/PushPendingChanges.test.ts` |
| CA-01.02.1 (onboarding invitado completo) | Componente + E2E | `features/profile/presentation/__tests__/OnboardingFlow.test.tsx`, `e2e/onboarding-guest.yaml` (Maestro) |
| CA-01.07.1 (consentimiento obligatorio) | Componente | `features/profile/presentation/screens/__tests__/Consent.test.tsx` |
| CA-01.08.1 (eliminar cuenta) | Aplicación + Integración + Backend | `features/profile/application/__tests__/DeleteAccount.test.ts`; backend `identity/adapters/in/web/DeleteAccountControllerTest.java` (`@WebMvcTest`), `identity/application/DeleteAccountTest.java` |
| Backend: refresh rotativo, token revocado (Art. 3, caso crítico de `07-estrategia-pruebas.md` §3) | Backend | `identity/application/RefreshAccessTokenTest.java`, `identity/adapters/**IntegrationTest.java` (Testcontainers PostgreSQL) |
| Arquitectura | — | `dependency-cruiser` (móvil, ya configurado en H0) verifica que `features/profile` no importe `features/catalog`; `ArchitectureTest`/`ApplicationModulesTest` (backend) verifican que `identity`/`profile`/`sync` solo se comuniquen por API pública/eventos |

Nota: CA-01.01.1 en su redacción literal menciona "3 sesiones registradas" y rutinas — esos datos no existen todavía en H1 (F03/F05 no están planificados en este hito, ver `01-vision-alcance-roadmap.md` §7, H2/H3). En H1 la prueba de esta CA cubre **perfil y `bodyMetric`** end-to-end; queda documentado como trabajo pendiente (no bloqueante) que F03/F05 añadan sus propios `SyncEntityHandler`/pruebas de regresión para que la CA quede 100 % verificada tal como está redactada, sin modificar el código ya construido en F01 (Art. 9.1).

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Acoplar `profile` a `catalog` por error (import directo en vez de vía composition root) | `dependency-cruiser`/`eslint-plugin-boundaries` (ya configurado en H0) se actualiza en `F01-T13` para prohibir explícitamente `features/profile/** → features/catalog/**` (solo se permite desde `src/composition/**`) |
| `mutator.ts` actual (`shared/infrastructure/http`) usa `throw` en vez de `Result`; los puertos de aplicación no deben lanzar excepciones | `HttpAuthAdapter`/`SqliteProfileRepository` capturan la excepción en el borde de infraestructura y la traducen a `Result.err(...)` con el `code` del `Problem` RFC 9457 antes de devolver al caso de uso |
| El módulo `sync` mínimo (solo `profile`/`bodyMetric`) podría diseñarse de forma que F03/F05 tengan que reescribirlo | El outbox y el SPI `SyncEntityHandler` se diseñan genéricos por `entity` desde el inicio (§3, §4); F03/F05 solo añaden nuevos handlers, no tocan `identity`/`profile`/`sync` existente |
| RN-01 (edad) y RN-03 (TMB) requieren la fecha "hoy"; riesgo de que se use `Date.now()`/`new Date()` en el dominio (prohibido por Art. 2.4) | Todas las funciones de dominio (`calculateAge`, `calculateBmi`, `calculateBmr`) reciben `today: Date`/`Clock` como parámetro explícito; se prueba con `FakeClock` |
| Datos de salud sensibles (Art. 5.3, Ley 1581/2012) manejados por primera vez con código real | `seguridad-privacidad` es revisor obligatorio antes de mergear cualquier PR de F01 que toque `identity`, `profile`, consentimiento o eliminación de cuenta (tareas `F01-T04`, `F01-T05`, `F01-T10`, `F01-T16`); no se invoca en esta ronda de planificación, solo se deja declarado aquí y en `tasks.md` |
| Seed de vocabulario compartido (`shared/domain/Equipment.ts`, etc.) introducido por F01 podría no cubrir todos los valores que F02 necesita | El plan de F02 (`specs/F02-catalogo-propuesta/plan.md` §1) reutiliza exactamente los mismos archivos; cualquier valor faltante se agrega en `shared/domain` (abierto/cerrado), nunca duplicado en `features/catalog` |

## 7. ADR requeridos

No se identifica ningún ADR nuevo más allá de los 7 ya existentes. F01 aplica directamente:
- **ADR-002** (offline-first + outbox): el `outbox`/`SyncEngine` mínimo de esta ronda es la primera implementación real de esa decisión, acotada a `profile`/`bodyMetric` como se documenta en ADR-002 mismo ("el diseño detallado... se especifica en el plan técnico de F03/F05" — aquí se hace la primera instancia mínima, coherente con esa decisión, sin contradecirla).
- **ADR-004** (contract-first): los endpoints de §3 se agregan primero a `openapi.yaml`.
- **ADR-007** (LWW por entidad): `profiles`/`body_metrics` usan `updated_at` como criterio de conflicto, sin fusión por campo.

Si durante la implementación surge una desviación real (p. ej. cambiar de Argon2id a otro hasher, o de JWT a sesiones opacas), se redacta un ADR nuevo antes de mergear, según Art. 8.4.

## 8. Feature flags

Ninguno en F01. Todas las capacidades descritas (registro, invitado, IMC/TMB, eliminación de cuenta) son MVP sin flag, según `01-vision-alcance-roadmap.md` §5.
