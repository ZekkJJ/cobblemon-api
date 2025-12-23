# Plugin Endpoint Fixes - Rutas Correctas del Backend

## Problema
El plugin está llamando a endpoints con rutas incorrectas, resultando en errores 404.

## Endpoints Correctos

### 1. Starter Status
**❌ Ruta Incorrecta:** `/api/players/starter?uuid={uuid}`
**✅ Ruta Correcta:** `/api/gacha/delivery/status?uuid={uuid}`

**Método:** GET
**Respuesta:**
```json
{
  "hasStarter": boolean,
  "starterGiven": boolean,
  "deliveryInProgress": boolean,
  "deliveryAttempts": number,
  "starterId": number,
  "isShiny": boolean
}
```

### 2. Ban Status
**❌ Ruta Incorrecta:** `/api/players/ban-status?uuid={uuid}`
**✅ Ruta Correcta:** `/api/admin/ban-status?uuid={uuid}`

**Método:** GET
**Respuesta:**
```json
{
  "banned": boolean,
  "banReason": string
}
```

### 3. Verification Status
**❌ Ruta Incorrecta:** `/api/players/verification-status?uuid={uuid}`
**✅ Ruta Correcta:** `/api/players/sync` (incluye verificación en la respuesta)

**Método:** POST
**Body:**
```json
{
  "uuid": "string",
  "username": "string",
  "online": boolean
}
```

**Respuesta incluye:**
```json
{
  "verified": boolean,
  "verifiedAt": "string",
  ...
}
```

### 4. Generate Verification Code
**❌ Ruta Incorrecta:** `/api/verification/generate`
**✅ Ruta Correcta:** `/api/verification/generate`

**Método:** POST
**Body:**
```json
{
  "minecraftUuid": "string",
  "minecraftUsername": "string"
}
```

**Respuesta:**
```json
{
  "success": boolean,
  "code": "string"
}
```

**Nota:** Este endpoint SÍ existe. Verifica que el plugin esté enviando el body correctamente.

### 5. Level Caps Effective
**❌ Ruta Incorrecta:** `/api/level-caps/effective?uuid={uuid}`
**✅ Ruta Correcta:** `/api/level-caps/effective?uuid={uuid}`

**Método:** GET
**Respuesta:**
```json
{
  "success": boolean,
  "captureCap": number,
  "ownershipCap": number,
  "appliedRules": string[],
  "calculatedAt": "date"
}
```

**Nota:** Este endpoint SÍ existe. Verifica que:
1. El plugin esté usando la IP correcta del servidor
2. La IP del plugin esté en la whitelist del backend
3. El UUID sea válido (formato UUID v4)

## Endpoints Adicionales Disponibles

### Starter Delivery Start
**Ruta:** `/api/gacha/delivery/start`
**Método:** POST
**Body:**
```json
{
  "uuid": "string"
}
```

### Starter Delivery Success
**Ruta:** `/api/gacha/delivery/success`
**Método:** POST
**Body:**
```json
{
  "uuid": "string"
}
```

### Starter Delivery Failed
**Ruta:** `/api/gacha/delivery/failed`
**Método:** POST
**Body:**
```json
{
  "uuid": "string",
  "reason": "string"
}
```

### Shop Refund
**Ruta:** `/api/shop/refund`
**Método:** POST
**Body:**
```json
{
  "uuid": "string",
  "purchaseId": "string",
  "reason": "string"
}
```

### Level Caps Version
**Ruta:** `/api/level-caps/version`
**Método:** GET
**Respuesta:**
```json
{
  "version": number,
  "lastUpdated": "date"
}
```

## Verificación de IP Whitelist

Los siguientes endpoints requieren que la IP del plugin esté en la whitelist:

1. `/api/verification/generate`
2. `/api/verification/verify`
3. `/api/level-caps/effective`
4. `/api/shop/purchases`
5. `/api/shop/claim`
6. `/api/shop/refund`

**Configurar en backend/.env:**
```env
ALLOWED_IPS=127.0.0.1,::1,IP_DEL_SERVIDOR_MINECRAFT
```

## Cambios Necesarios en el Plugin

### Archivo: ApiClient.java o similar

```java
// Cambiar estas constantes:
private static final String STARTER_STATUS_ENDPOINT = "/api/gacha/delivery/status";
private static final String BAN_STATUS_ENDPOINT = "/api/admin/ban-status";
private static final String VERIFICATION_GENERATE_ENDPOINT = "/api/verification/generate";
private static final String LEVEL_CAPS_ENDPOINT = "/api/level-caps/effective";

// Para verificación, usar el endpoint de sync:
private static final String PLAYER_SYNC_ENDPOINT = "/api/players/sync";
```

### Ejemplo de llamada correcta:

```java
// Obtener starter status
public CompletableFuture<StarterStatus> getStarterStatus(UUID playerUuid) {
    String url = baseUrl + "/api/gacha/delivery/status?uuid=" + playerUuid.toString();
    return makeGetRequest(url, StarterStatus.class);
}

// Obtener ban status
public CompletableFuture<BanStatus> getBanStatus(UUID playerUuid) {
    String url = baseUrl + "/api/admin/ban-status?uuid=" + playerUuid.toString();
    return makeGetRequest(url, BanStatus.class);
}

// Generar código de verificación
public CompletableFuture<VerificationCode> generateVerificationCode(UUID playerUuid, String username) {
    String url = baseUrl + "/api/verification/generate";
    JsonObject body = new JsonObject();
    body.addProperty("minecraftUuid", playerUuid.toString());
    body.addProperty("minecraftUsername", username);
    return makePostRequest(url, body, VerificationCode.class);
}

// Obtener level caps
public CompletableFuture<LevelCaps> getLevelCaps(UUID playerUuid) {
    String url = baseUrl + "/api/level-caps/effective?uuid=" + playerUuid.toString();
    return makeGetRequest(url, LevelCaps.class);
}
```

## Testing

Para verificar que los endpoints funcionan:

```bash
# Test starter status
curl "http://localhost:25617/api/gacha/delivery/status?uuid=4fa07a77-3772-3168-a557-a863734f1744"

# Test ban status
curl "http://localhost:25617/api/admin/ban-status?uuid=4fa07a77-3772-3168-a557-a863734f1744"

# Test level caps
curl "http://localhost:25617/api/level-caps/effective?uuid=4fa07a77-3772-3168-a557-a863734f1744"

# Test verification generate
curl -X POST "http://localhost:25617/api/verification/generate" \
  -H "Content-Type: application/json" \
  -d '{"minecraftUuid":"4fa07a77-3772-3168-a557-a863734f1744","minecraftUsername":"ZekkJJ"}'
```

## Resumen de Cambios

| Endpoint Viejo | Endpoint Nuevo | Método |
|----------------|----------------|--------|
| `/api/players/starter` | `/api/gacha/delivery/status` | GET |
| `/api/players/ban-status` | `/api/admin/ban-status` | GET |
| `/api/players/verification-status` | `/api/players/sync` | POST |
| `/api/verification/generate` | `/api/verification/generate` ✅ | POST |
| `/api/level-caps/effective` | `/api/level-caps/effective` ✅ | GET |

✅ = Endpoint correcto, verificar configuración de IP whitelist
