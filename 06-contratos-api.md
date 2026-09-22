# 06 · Contratos de la API (v1)

La **fuente de verdad** es `packages/api-contract/openapi.yaml` (contract-first). Este documento resume el contrato para las specs y los agentes.

## 1. Convenciones
| Tema | Regla |
|---|---|
| Base | `https://api.<dominio>/api/v1` |
| Formato | JSON, camelCase, fechas ISO-8601 en UTC, IDs UUIDv7 generados por el cliente |
| Autenticación | `Authorization: Bearer <accessJWT>` (15 min); refresh token rotativo (30 días) |
| Errores | RFC 9457 `application/problem+json` con `type`, `title`, `status`, `detail`, `code` (p. ej. `AUTH_INVALID_CREDENTIALS`) y `errors[]` por campo |
| Idempotencia | Los `POST` de escritura aceptan `Idempotency-Key` |
| Paginación | Por cursor: `?cursor=&limit=` → `{ items, nextCursor }` |
| Versionado | Por ruta (`/v1`). Solo se hacen cambios aditivos dentro de una versión |
| Rate limit | `/auth/*`: 10 req/min por IP; resto: 120 req/min por usuario. Respuesta `429` con `Retry-After` |

## 2. Endpoints del MVP

### identity
| Método | Ruta | Descripción | RF |
|---|---|---|---|
| POST | `/auth/register` | `{email, password, acceptedTermsVersion, healthDataConsent:true}` → `201 {accessToken, refreshToken, user}` | RF-01.01, RF-01.07 |
| POST | `/auth/login` | Credenciales → tokens | RF-01.01 |
| POST | `/auth/refresh` | Rota el refresh token (el anterior queda revocado) | RF-01.01 |
| POST | `/auth/logout` | Revoca el refresh token | RF-01.01 |
| POST | `/auth/password/forgot` · `/auth/password/reset` | Recuperación por email con token de un solo uso (30 min) | RF-01.01 |
| POST | `/auth/guest/upgrade` | Convierte los datos del modo invitado en una cuenta (tras el registro, se envía el primer push de sincronización) | RF-01.01 |
| DELETE | `/me` | Elimina la cuenta: borrado lógico inmediato y definitivo en ≤ 30 días; revoca tokens → `202` | RF-01.08 |

### profile
| Método | Ruta | Descripción |
|---|---|---|
| GET / PUT | `/me/profile` | Perfil completo (sin datos de autenticación) |
| GET | `/me/body-metrics?from=&to=` | Historial de peso |
| GET | `/me/export` | (v1.1) Exporta los datos en JSON |

### catalog
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/catalog/manifest` | `{version, exercisesEtag, routinesEtag, mediaBaseUrl}` para saber si hay que actualizar |
| GET | `/catalog/exercises?updatedSince=` | Ejercicios y referencias de medios |
| GET | `/catalog/routines?updatedSince=` | Rutinas predefinidas |
| GET | `/config/flags` | Feature flags y configuración remota |

### sync
```http
POST /sync/push
Idempotency-Key: <uuid>
{
  "deviceId": "…",
  "changes": [
    { "entity": "routine", "op": "upsert", "id": "…", "updatedAt": "…", "data": { … } },
    { "entity": "scheduleSlot", "op": "delete", "id": "…", "updatedAt": "…" },
    { "entity": "workoutSession", "op": "upsert", "id": "…", "data": { …, "setLogs": [ … ] } }
  ]
}
→ 200 { "accepted": ["id…"], "rejected": [{ "id": "…", "code": "VALIDATION_ERROR", "detail": "…" }], "serverTime": "…" }
```
```http
GET /sync/pull?cursor=<opaco>&limit=500
→ 200 { "changes": [ … ], "nextCursor": "…", "hasMore": false }
```
Entidades sincronizadas: `profile`, `bodyMetric`, `routine` (con sus bloques e ítems como documento), `customExercise`, `scheduleSlot`, `workoutSession`, `gamificationState`, `preferences`. Los conflictos se resuelven con RN-18.

## 3. Endpoints de v2 (social)
| Método | Ruta | Descripción |
|---|---|---|
| PUT | `/me/social-profile` | Alias, avatar de mascota y visibilidad |
| POST | `/friends/invite-code` | Genera un código o enlace temporal |
| POST | `/friends/requests` · PUT `/friends/requests/{id}` | Enviar, aceptar o rechazar solicitudes |
| GET / DELETE | `/friends` · `/friends/{id}` | Listar o eliminar amigos |
| POST | `/challenges` | `{type: SESSIONS|MINUTES|EXERCISE_REPS|STREAK, target, exerciseId?, startsAt, endsAt, inviteeIds[]}` |
| GET | `/challenges?status=` · `/challenges/{id}/leaderboard` | Lista y clasificación |
| POST | `/challenges/{id}/join` · `/leave` · `/cheers` | Participación y ánimos |
| POST | `/reports` · `/blocks` | Reportar o bloquear |
| POST | `/devices` | Registrar token de push (APNs / FCM) |

## 4. Esquema de importación y exportación de rutinas (RF-03.08)
Archivo `.fitroutine.json`, validado con JSON Schema en `packages/routine-schema` (y zod en el cliente):
```json
{
  "schema": "fitapp.routine",
  "schemaVersion": 1,
  "exportedAt": "2026-09-21T10:00:00Z",
  "routine": {
    "name": "Pecho y flexiones",
    "goal": "MUSCLE_GAIN",
    "level": "INTERMEDIATE",
    "timerDefaults": { "prepSeconds": 10, "restBetweenSetsSeconds": 60, "restBetweenExercisesSeconds": 90 },
    "blocks": [
      { "type": "MAIN", "grouping": "STRAIGHT", "rounds": 1, "items": [
        { "exercise": { "ref": "catalog:push-up" }, "sets": 4, "targetReps": 12 },
        { "exercise": { "ref": "custom", "name": "Flexión en toalla", "mode": "REPS", "muscleGroups": ["CHEST"] }, "sets": 3, "targetReps": 10 }
      ]}
    ]
  }
}
```

Reglas de importación:

- Un `schemaVersion` desconocido y superior al soportado se rechaza con un mensaje claro.
- Las referencias `catalog:*` inexistentes se convierten en ejercicios personalizados.
- Los valores fuera de los límites de RN-06 se ajustan al límite más cercano y se muestran como advertencia.
- Tamaño máximo del archivo: 256 KB.
