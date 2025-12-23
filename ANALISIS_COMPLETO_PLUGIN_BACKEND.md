# Análisis Exhaustivo: Plugin Minecraft v2 & Backend Integration

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **LEVEL CAPS - Problemas de Sincronización y Performance**

#### Problema 1.1: Cache Expirado Causa Lag Spikes
**Ubicación**: `LevelCapManager.java` línea 95-115
```java
private PlayerCaps getCaps(UUID playerUuid) {
    PlayerCaps cached = capsCache.get(playerUuid);
    if (cached != null && !cached.isExpired()) {
        return cached;
    }
    
    // Si cache expired, trigger async refresh pero return cached/default
    if (cached != null) {
        fetchCapsAsync(playerUuid);
        return cached; // ⚠️ PROBLEMA: Retorna caps expirados
    }
    
    // No cache - return defaults y fetch async
    PlayerCaps defaults = new PlayerCaps(50, 100);
    capsCache.put(playerUuid, defaults);
    fetchCapsAsync(playerUuid);
    return defaults; // ⚠️ PROBLEMA: Defaults incorrectos
}
```

**Impacto**:
- Jugadores pueden capturar Pokémon fuera de su cap real durante 5 minutos
- Defaults (50/100) no coinciden con la lógica del backend
- No hay invalidación de cache cuando admin cambia caps

**Solución Requerida**:
- Implementar WebSocket o polling más frecuente para cambios de admin
- Agregar endpoint `/api/level-caps/version` para detectar cambios
- Pre-cargar caps de todos los jugadores online al inicio

---

#### Problema 1.2: Race Condition en Capture Event
**Ubicación**: `LevelCapManager.java` línea 48-65
```java
CobblemonEvents.POKEMON_CAPTURED.subscribe(Priority.NORMAL, event -> {
    ServerPlayerEntity player = event.getPlayer();
    Pokemon pokemon = event.getPokemon();
    
    if (player != null && pokemon != null) {
        UUID uuid = player.getUuid();
        int pokemonLevel = pokemon.getLevel();
        
        PlayerCaps caps = getCaps(uuid); // ⚠️ Puede ser cache expirado
        if (caps != null && pokemonLevel > caps.captureCap) {
            // Remove from party
            PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
            party.remove(pokemon); // ⚠️ PROBLEMA: Ya fue capturado, solo lo removemos
            
            player.sendMessage(Text.literal(
                "§c¡El Pokémon es demasiado poderoso! Tu límite de captura es nivel §e" + caps.captureCap
            ));
        }
    }
    return kotlin.Unit.INSTANCE;
});
```

**Impacto**:
- El Pokémon YA fue capturado cuando se ejecuta este código
- Se consume la Pokéball aunque se remueva después
- Experiencia de usuario confusa (captura exitosa → mensaje de error)

**Solución Requerida**:
- Usar `POKEMON_CAPTURED_PRE` event si existe
- Si no existe, implementar listener en `UseItemOnEntityEvent` para prevenir antes

---

#### Problema 1.3: Backend Formula Evaluation Inseguro
**Ubicación**: `level-caps.service.ts` línea 60-75
```typescript
private evaluateFormula(formula: string, player: User): number {
  try {
    const badges = (player as any).badges || 0;
    const playtime = (player as any).playtime || 0;
    const level = (player as any).level || 1;

    let evaluated = formula
      .replace(/badges/g, String(badges))
      .replace(/playtime/g, String(playtime))
      .replace(/level/g, String(level));

    const result = eval(evaluated); // ⚠️ PELIGRO: eval() sin sanitización
    return typeof result === 'number' && !isNaN(result) ? Math.floor(result) : Infinity;
  } catch {
    return Infinity;
  }
}
```

**Impacto**:
- **VULNERABILIDAD DE SEGURIDAD CRÍTICA**: Admin malicioso puede ejecutar código arbitrario
- Ejemplo: `formula = "require('fs').unlinkSync('/etc/passwd')"`
- No hay validación de sintaxis antes de guardar

**Solución Requerida**:
- Usar librería segura como `mathjs` o `expr-eval`
- Validar fórmula antes de guardar
- Whitelist de operadores permitidos

---

### 2. **SHOP - Problemas de Concurrencia y Data Loss**

#### Problema 2.1: Race Condition en Compras Simultáneas
**Ubicación**: `shop.service.ts` línea 95-145
```typescript
async purchase(uuid: string, ballId: string, quantity: number): Promise<any> {
  // 1. Leer stock
  const stockData = await this.shopStockCollection.findOne({ id: 'current' });
  const ballStock = stockData.stocks[ballId];
  
  // 2. Verificar stock
  if (ballStock.stock < quantity) {
    throw Errors.insufficientStock();
  }
  
  // 3. Leer balance
  const user = await this.usersCollection.findOne({ minecraftUuid: uuid });
  const currentBalance = user.cobbleDollarsBalance || 0;
  
  // 4. Verificar balance
  if (currentBalance < totalCost) {
    throw Errors.insufficientBalance();
  }
  
  // ⚠️ PROBLEMA: Entre paso 2 y 5, otro usuario puede comprar
  
  // 5. Actualizar stock
  ballStock.stock -= quantity;
  await this.shopStockCollection.updateOne(
    { id: 'current' },
    { $set: { [`stocks.${ballId}.stock`]: ballStock.stock } }
  );
  
  // 6. Actualizar balance
  await this.usersCollection.updateOne(
    { minecraftUuid: uuid },
    { $set: { cobbleDollarsBalance: newBalance } }
  );
}
```

**Impacto**:
- Dos usuarios pueden comprar el último item simultáneamente
- Stock puede volverse negativo
- Balance puede volverse negativo si hay lag

**Solución Requerida**:
- Usar MongoDB transactions
- Usar operadores atómicos `$inc` en lugar de read-modify-write
- Agregar índice único en compras pendientes

---

#### Problema 2.2: Plugin No Valida Items Antes de Dar
**Ubicación**: `ShopManager.java` línea 60-90
```java
private ItemStack createPokeball(String ballId, int quantity) {
    try {
        String itemId = "cobblemon:" + ballId;
        Identifier identifier = Identifier.tryParse(itemId);
        
        if (identifier == null) {
            logger.error("Invalid pokeball ID: " + ballId);
            return null; // ⚠️ PROBLEMA: Retorna null pero no notifica al backend
        }
        
        Item item = Registries.ITEM.get(identifier);
        if (item == null) {
            logger.error("Pokeball item not found: " + ballId);
            return null; // ⚠️ PROBLEMA: Item no existe pero compra ya fue pagada
        }
        
        return new ItemStack(item, quantity);
    } catch (Exception e) {
        logger.error("Error creating pokeball " + ballId + ": " + e.getMessage());
        return null;
    }
}
```

**Impacto**:
- Si el item no existe en Cobblemon, el jugador pierde su dinero
- No hay refund automático
- No hay notificación al backend del error

**Solución Requerida**:
- Validar items contra lista hardcodeada de Pokéballs válidas
- Implementar endpoint `/api/shop/refund` para casos de error
- Agregar retry logic con exponential backoff

---

#### Problema 2.3: Inventario Lleno Causa Pérdida de Items
**Ubicación**: `ShopManager.java` línea 75-80
```java
boolean given = player.getInventory().insertStack(ballStack);

if (given) {
    totalItems += quantity;
    markAsClaimed(uuid, purchaseId);
} else {
    player.sendMessage(Text.literal("§c¡Inventario lleno! No se pudo entregar " + quantity + "x " + ballId));
    // ⚠️ PROBLEMA: No marca como claimed, pero tampoco reintenta
}
```

**Impacto**:
- Items quedan en limbo si inventario está lleno
- Jugador debe hacer `/claimshop` de nuevo
- No hay sistema de "mailbox" para items pendientes

**Solución Requerida**:
- Implementar sistema de mailbox temporal
- Dropear items al suelo si inventario lleno
- Agregar comando `/claimshop force` para admin

---

### 3. **WEB SYNC - Problemas de Performance y Data Corruption**

#### Problema 3.1: Sync de PC Storage Causa Lag Masivo
**Ubicación**: `WebSyncManager.java` línea 180-210
```java
// Add PC Storage data - OPTIMIZED: Only sync first 2 boxes
try {
    PCStore pc = Cobblemon.INSTANCE.getStorage().getPC(player);
    JsonArray pcData = new JsonArray();

    // Only sync first 2 boxes (60 Pokemon max)
    int maxBoxes = Math.min(2, pc.getBoxes().size());
    int boxIndex = 0;
    for (Object boxObj : pc.getBoxes()) {
        if (boxIndex >= maxBoxes) break;

        com.cobblemon.mod.common.api.storage.pc.PCBox box = (com.cobblemon.mod.common.api.storage.pc.PCBox) boxObj;
        JsonObject boxData = new JsonObject();
        boxData.addProperty("boxNumber", boxIndex);

        JsonArray pokemonInBox = new JsonArray();
        for (int slot = 0; slot < 30; slot++) {
            Pokemon pokemon = box.get(slot);
            if (pokemon != null) {
                JsonObject pokemonData = buildPokemonData(pokemon); // ⚠️ PROBLEMA: Serializa TODO
                pokemonData.addProperty("slot", slot);
                pokemonInBox.add(pokemonData);
            }
        }
        boxData.add("pokemon", pokemonInBox);
        pcData.add(boxData);
        boxIndex++;
    }
    payload.add("pcStorage", pcData);
} catch (Exception e) {
    logger.error("Failed to sync PC Storage: " + e.getMessage());
    payload.add("pcStorage", new JsonArray());
}
```

**Impacto**:
- Cada sync envía hasta 60 Pokémon completos (IVs, EVs, moves, etc.)
- Payload puede ser 50-100KB por jugador
- Con 20 jugadores online = 1-2MB cada 10 minutos
- Causa lag spikes cuando se ejecuta

**Solución Requerida**:
- Solo sincronizar party (6 Pokémon) por defecto
- PC Storage solo on-demand con comando `/syncpc`
- Implementar delta sync (solo cambios desde último sync)
- Comprimir payload con gzip

---

#### Problema 3.2: Periodic Sync Puede Crashear con Muchos Jugadores
**Ubicación**: `WebSyncManager.java` línea 125-150
```java
private void performPeriodicSync() {
    if (server == null) return;

    var playerList = server.getPlayerManager().getPlayerList();
    if (playerList.isEmpty()) return;

    // Only sync ONE player per interval
    if (syncPlayerIndex >= playerList.size()) {
        syncPlayerIndex = 0;
    }

    // DEFENSIVE CHECK: Validate index before accessing
    if (syncPlayerIndex < playerList.size()) {
        ServerPlayerEntity player = playerList.get(syncPlayerIndex);
        // Verify player is still online
        if (player != null && player.networkHandler != null && !player.isDisconnected()) {
            logger.debug("Syncing player " + (syncPlayerIndex + 1) + "/" + playerList.size() + ": " + player.getName().getString());
            syncPlayerData(player); // ⚠️ PROBLEMA: Bloquea thread si HTTP tarda
        }
    }

    syncPlayerIndex++;
}
```

**Impacto**:
- Con 100 jugadores, tarda 100 * 10min = 16.6 horas para sync completo
- Si un jugador se desconecta antes de su turno, nunca se sincroniza
- HTTP timeout puede bloquear el scheduler thread

**Solución Requerida**:
- Sync múltiples jugadores en paralelo (batch de 5-10)
- Priorizar jugadores con cambios recientes
- Usar CompletableFuture para no bloquear

---

#### Problema 3.3: Disconnect Handler Puede Fallar Silenciosamente
**Ubicación**: `WebSyncManager.java` línea 100-120
```java
ServerPlayConnectionEvents.DISCONNECT.register((handler, server1) -> {
    try {
        ServerPlayerEntity player = handler.getPlayer();
        if (player == null) return;

        UUID uuid = player.getUuid();

        JsonObject payload = new JsonObject();
        payload.addProperty("uuid", uuid.toString());
        payload.addProperty("username", player.getName().getString());
        payload.addProperty("online", false);
        payload.addProperty("lastSeen", java.time.Instant.now().toString());

        // CRITICAL FIX: Include empty arrays
        payload.add("party", new JsonArray());
        payload.add("pcStorage", new JsonArray());

        httpClient.postAsync("/api/players/sync", payload)
            .thenAccept(response -> {
                // ⚠️ PROBLEMA: Si falla, jugador queda "online" forever
                if (response != null) {
                    logger.debug("Updated offline status for " + player.getName().getString());
                }
            })
            .exceptionally(throwable -> {
                logger.debug("Failed to update offline status: " + throwable.getMessage());
                return null; // ⚠️ PROBLEMA: Falla silenciosamente
            });
    } catch (Exception e) {
        logger.debug("Error in disconnect handler: " + e.getMessage());
    }
});
```

**Impacto**:
- Si backend está caído, jugadores quedan marcados como "online" forever
- Frontend muestra jugadores fantasma
- No hay cleanup job en backend

**Solución Requerida**:
- Backend debe tener job que marca offline a jugadores sin heartbeat por 5min
- Plugin debe reintentar disconnect notification
- Agregar endpoint `/api/players/cleanup-stale`

---

### 4. **STARTER SYSTEM - Problemas de Duplicación**

#### Problema 4.1: Puede Dar Starter Duplicado
**Ubicación**: `StarterManager.java` línea 60-85
```java
private void giveStarterPokemon(ServerPlayerEntity player, int pokemonId, boolean isShiny) {
    try {
        PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
        
        // Check if player already has Pokemon
        if (!party.isEmpty()) {
            logger.info("Player " + player.getName().getString() + " already has Pokemon - skipping");
            player.sendMessage(Text.literal("§e⚠ Ya tienes Pokémon en tu equipo"));
            
            // Notify API that starter was already given
            notifyStarterGiven(player.getUuid(), pokemonId);
            return;
        }
        
        // ⚠️ PROBLEMA: Race condition si jugador recibe Pokémon de otra fuente
        
        Species species = PokemonSpecies.INSTANCE.getByPokedexNumber(pokemonId, "");
        if (species == null) {
            logger.error("Species not found for Pokedex ID: " + pokemonId);
            return;
        }
        
        Pokemon pokemon = species.create(5);
        if (isShiny) {
            pokemon.setShiny(true);
        }
        
        party.add(pokemon); // ⚠️ PROBLEMA: No verifica si add() fue exitoso
        
        player.sendMessage(Text.literal("§a✓ ¡Has recibido tu Pokémon inicial!"));
        notifyStarterGiven(player.getUuid(), pokemonId);
        
    } catch (Exception e) {
        logger.error("Error giving starter: " + e.getMessage(), e);
        // ⚠️ PROBLEMA: No notifica al backend del error
    }
}
```

**Impacto**:
- Si jugador recibe Pokémon de trade justo antes, puede tener 2 starters
- Si `party.add()` falla, backend marca como entregado pero jugador no lo tiene
- No hay rollback en caso de error

**Solución Requerida**:
- Usar flag en backend `starterDeliveryInProgress`
- Verificar que `party.add()` retorne true
- Implementar rollback si falla

---

### 5. **VERIFICATION SYSTEM - Problemas de Seguridad**

#### Problema 5.1: Códigos de Verificación Predecibles
**Ubicación**: `VerificationManager.java` línea 95-100
```java
private void generateAndSendCode(ServerPlayerEntity player) {
    UUID uuid = player.getUuid();
    
    // Generate 5-digit code
    String code = String.format("%05d", new Random().nextInt(100000)); // ⚠️ PROBLEMA: Random no es criptográfico
    pendingCodes.put(uuid, code);
    
    // ...
}
```

**Impacto**:
- `java.util.Random` es predecible si se conoce el seed
- Códigos de 5 dígitos = solo 100,000 combinaciones
- Attacker puede bruteforce en minutos

**Solución Requerida**:
- Usar `SecureRandom` en lugar de `Random`
- Aumentar a 8 dígitos o usar alfanumérico
- Agregar rate limiting en backend

---

#### Problema 5.2: Códigos No Expiran
**Ubicación**: `VerificationManager.java` línea 95-110
```java
private void generateAndSendCode(ServerPlayerEntity player) {
    UUID uuid = player.getUuid();
    String code = String.format("%05d", new Random().nextInt(100000));
    pendingCodes.put(uuid, code); // ⚠️ PROBLEMA: No hay timestamp ni expiración
    
    // ...
}
```

**Impacto**:
- Códigos válidos forever hasta que jugador se desconecte
- Si jugador nunca se desconecta, código válido por días
- Memory leak si muchos jugadores generan códigos

**Solución Requerida**:
- Agregar timestamp a códigos
- Expirar después de 15 minutos
- Cleanup job para remover códigos expirados

---

### 6. **COBBLEDOLLARS INTEGRATION - Problemas de Sincronización**

#### Problema 6.1: Balance Puede Desincronizarse
**Ubicación**: `CobbleDollarsManager.java` + `shop.service.ts`

**Flujo Actual**:
1. Plugin lee balance de archivo JSON local
2. Backend mantiene balance en MongoDB
3. Compra en web actualiza MongoDB
4. Plugin lee archivo viejo hasta próximo sync

**Impacto**:
- Jugador puede gastar dinero que no tiene si sync no ocurrió
- Jugador puede ver balance incorrecto en `/balance`
- No hay source of truth único

**Solución Requerida**:
- Backend debe ser source of truth
- Plugin debe consultar backend para balance en tiempo real
- Implementar cache con TTL de 30 segundos
- CobbleDollars mod debe notificar cambios via webhook

---

### 7. **GENERAL - Problemas de Arquitectura**

#### Problema 7.1: No Hay Health Checks
**Ubicación**: Todo el sistema

**Impacto**:
- Si backend cae, plugin sigue funcionando con datos obsoletos
- No hay forma de saber si sistema está funcionando correctamente
- Admins no reciben alertas de problemas

**Solución Requerida**:
- Agregar endpoint `/api/health` en backend
- Plugin debe hacer health check cada minuto
- Si backend está caído por 5min, deshabilitar features que dependen de él
- Enviar notificación a Discord

---

#### Problema 7.2: No Hay Logging Centralizado
**Ubicación**: Todo el sistema

**Impacto**:
- Logs del plugin solo en consola de servidor
- Logs del backend solo en Vercel
- Difícil debuggear problemas que involucran ambos

**Solución Requerida**:
- Plugin debe enviar logs críticos a backend
- Backend debe guardar logs en MongoDB
- Agregar dashboard de admin para ver logs en tiempo real

---

#### Problema 7.3: No Hay Rate Limiting en Plugin
**Ubicación**: `HttpClient.java`

**Impacto**:
- Jugador puede spammear `/claimshop` y causar DDoS al backend
- No hay protección contra abuse
- Backend puede caerse por demasiadas requests

**Solución Requerida**:
- Agregar rate limiting local en plugin (1 request/segundo por jugador)
- Backend debe tener rate limiting global
- Agregar cooldowns a comandos

---

## 📊 RESUMEN DE PRIORIDADES

### 🔴 CRÍTICO (Arreglar AHORA)
1. Shop race condition (pérdida de dinero)
2. Level caps cache expirado (bypass de límites)
3. Backend formula evaluation (vulnerabilidad de seguridad)
4. Starter duplicación (corrupción de datos)

### 🟡 ALTO (Arreglar esta semana)
5. PC Storage sync lag
6. Disconnect handler failures
7. CobbleDollars desync
8. Verification codes inseguros

### 🟢 MEDIO (Arreglar este mes)
9. Health checks
10. Logging centralizado
11. Rate limiting
12. Inventario lleno en shop

---

## 🎯 RECOMENDACIONES DE ARQUITECTURA

### 1. Implementar Event Sourcing para Transacciones Críticas
- Todas las compras, capturas, y cambios de balance deben ser eventos inmutables
- Permite auditoría completa
- Facilita rollback en caso de errores

### 2. Usar Redis para Cache Distribuido
- Reemplazar cache local en plugin con Redis
- Permite invalidación instantánea cuando admin cambia configs
- Reduce latencia de consultas

### 3. Implementar Circuit Breaker Pattern
- Si backend falla 3 veces seguidas, plugin entra en "modo degradado"
- Deshabilita features no críticas
- Reintenta con exponential backoff

### 4. Agregar Monitoring y Alertas
- Prometheus + Grafana para métricas
- Alertas en Discord cuando:
  - Backend response time > 1s
  - Error rate > 5%
  - Jugadores con balance negativo
  - Sync failures > 10 en 1 hora

---

## 📝 PRÓXIMOS PASOS

1. Crear spec detallado para cada problema crítico
2. Implementar tests de integración entre plugin y backend
3. Crear ambiente de staging para testing
4. Documentar todos los endpoints y contratos de API
5. Crear runbook para troubleshooting común

---

**Fecha de Análisis**: 22 de Diciembre, 2024
**Analizado por**: Kiro AI
**Versión Plugin**: 2.0.0
**Versión Backend**: 1.0.0
