# 🔍 ANÁLISIS EXHAUSTIVO - Plugin Cobblemon Los Pitufos

## 📋 RESUMEN EJECUTIVO

Este documento contiene un análisis completo del plugin de Minecraft, el API web y el sistema de sincronización para el servidor Cobblemon Los Pitufos. Se identificaron **MÚLTIPLES FALLAS CRÍTICAS** que impiden el funcionamiento correcto del sistema integrado.

**Estado General:** ⚠️ **REQUIERE CORRECCIONES MAYORES**

---

## 🚨 FALLAS CRÍTICAS IDENTIFICADAS

### 1. VERIFICACIÓN - Código de 5 dígitos vs 6 dígitos

**Severidad:** 🔴 **CRÍTICA** - Bloquea completamente la verificación

**Descripción:**
- El plugin genera códigos de **6 dígitos** (`String.format("%06d", ...)`)
- La página web SOLO acepta códigos de **5 dígitos** (`code.length !== 5`)
- Los códigos NUNCA coincidirán

**Archivos afectados:**
- `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/verification/VerificationManager.java:94`
  ```java
  String code = String.format("%06d", new Random().nextInt(1000000)); // 6 dígitos
  ```
- `src/app/verificar/page.tsx:21`
  ```typescript
  if (code.length !== 5 || !/^\d+$/.test(code)) { // Solo acepta 5 dígitos
  ```

**Solución requerida:**
1. **Opción A (Recomendada):** Cambiar plugin a 5 dígitos:
   ```java
   String code = String.format("%05d", new Random().nextInt(100000));
   ```
2. **Opción B:** Cambiar web a 6 dígitos:
   ```typescript
   if (code.length !== 6 || !/^\d+$/.test(code))
   ```

---

### 2. ENDPOINTS DE VERIFICACIÓN NO EXISTEN EN EL PLUGIN

**Severidad:** 🔴 **CRÍTICA** - Sistema de verificación incompleto

**Descripción:**
El plugin intenta llamar endpoints que NO coinciden con los de la API web:

**Plugin llama:**
- `/api/players/verification-status?uuid=...` ❌ NO EXISTE
- `/api/verification/generate` ❌ NO EXISTE
- `/api/verification/verify` ❌ NO EXISTE

**API web tiene:**
- `/api/verify/register` ✅ EXISTE (pero plugin no lo usa)
- `/api/verify/check` ✅ EXISTE (pero plugin no lo usa)

**Archivos afectados:**
- `VerificationManager.java:70` - Llama a endpoint inexistente
- `VerificationManager.java:103` - Llama a endpoint inexistente
- `VerificationManager.java:140` - Llama a endpoint inexistente

**Solución requerida:**
Crear los endpoints faltantes en la API web:

```typescript
// src/app/api/players/verification-status/route.ts (NUEVO)
export async function GET(request: NextRequest) {
    const uuid = request.nextUrl.searchParams.get('uuid');
    const user = await db.users.findOne({ minecraftUuid: uuid });
    return NextResponse.json({ 
        verified: user?.verified || false 
    });
}

// src/app/api/verification/generate/route.ts (NUEVO)
export async function POST(request: NextRequest) {
    const { minecraftUuid, minecraftUsername, code } = await request.json();
    await db.users.updateOne(
        { minecraftUuid },
        { verificationCode: code, minecraftUsername },
        { upsert: true }
    );
    return NextResponse.json({ success: true });
}

// src/app/api/verification/verify/route.ts (NUEVO)
export async function POST(request: NextRequest) {
    const { minecraftUuid, code } = await request.json();
    const user = await db.users.findOne({ minecraftUuid, verificationCode: code });
    if (user) {
        await db.users.updateOne(
            { minecraftUuid },
            { verified: true, verificationCode: null }
        );
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false }, { status: 400 });
}
```

---

### 3. SINCRONIZACIÓN DE POKÉMON INCOMPLETA

**Severidad:** 🟠 **ALTA** - Pérdida masiva de datos

**Descripción:**
El plugin solo sincroniza datos básicos del party, pero falta información crítica:

**Datos que SÍ sincroniza:**
- ✅ Species
- ✅ Level
- ✅ Shiny
- ✅ Form

**Datos que NO sincroniza (pero son necesarios):**
- ❌ **IV stats** (Individuales)
- ❌ **EV stats** (Esfuerzo)
- ❌ **Moves/Moveset** (Ataques)
- ❌ **Ability** (Habilidad)
- ❌ **Nature** (Naturaleza)
- ❌ **Gender** (Género)
- ❌ **Ball type** (Tipo de Pokéball)
- ❌ **Original Trainer** (Entrenador original)
- ❌ **Pokémon UUID** (Identificador único)
- ❌ **PC Storage** (Almacenamiento en PC)
- ❌ **Pokedex progress** (Progreso del Pokédex)
- ❌ **Friendship/Happiness** (Amistad)
- ❌ **Held items** (Objetos equipados)
- ❌ **Ribbons/Marks** (Medallas/Marcas)
- ❌ **Experience points** (Puntos de experiencia exactos)

**Archivos afectados:**
- `WebSyncManager.java:109-121` - Solo envía 4 campos

**Solución requerida:**
Expandir la sincronización completa:

```java
// En WebSyncManager.java:
JsonObject pokemonData = new JsonObject();
pokemonData.addProperty("uuid", pokemon.getUuid().toString());
pokemonData.addProperty("species", pokemon.getSpecies().getName());
pokemonData.addProperty("speciesId", pokemon.getSpecies().getNationalPokedexNumber());
pokemonData.addProperty("level", pokemon.getLevel());
pokemonData.addProperty("experience", pokemon.getExperienceToNextLevel());
pokemonData.addProperty("shiny", pokemon.getShiny());
pokemonData.addProperty("form", pokemon.getForm().getName());
pokemonData.addProperty("gender", pokemon.getGender().name());
pokemonData.addProperty("nature", pokemon.getNature().getName().getPath());
pokemonData.addProperty("ability", pokemon.getAbility().getName());
pokemonData.addProperty("friendship", pokemon.getFriendship());
pokemonData.addProperty("ball", pokemon.getCaughtBall().getName().getPath());

// IVs
JsonObject ivs = new JsonObject();
ivs.addProperty("hp", pokemon.getIvs().getOrDefault(Stats.HP));
ivs.addProperty("attack", pokemon.getIvs().getOrDefault(Stats.ATTACK));
ivs.addProperty("defense", pokemon.getIvs().getOrDefault(Stats.DEFENCE));
ivs.addProperty("spAttack", pokemon.getIvs().getOrDefault(Stats.SPECIAL_ATTACK));
ivs.addProperty("spDefense", pokemon.getIvs().getOrDefault(Stats.SPECIAL_DEFENCE));
ivs.addProperty("speed", pokemon.getIvs().getOrDefault(Stats.SPEED));
pokemonData.add("ivs", ivs);

// EVs
JsonObject evs = new JsonObject();
evs.addProperty("hp", pokemon.getEvs().getOrDefault(Stats.HP));
evs.addProperty("attack", pokemon.getEvs().getOrDefault(Stats.ATTACK));
evs.addProperty("defense", pokemon.getEvs().getOrDefault(Stats.DEFENCE));
evs.addProperty("spAttack", pokemon.getEvs().getOrDefault(Stats.SPECIAL_ATTACK));
evs.addProperty("spDefense", pokemon.getEvs().getOrDefault(Stats.SPECIAL_DEFENCE));
evs.addProperty("speed", pokemon.getEvs().getOrDefault(Stats.SPEED));
pokemonData.add("evs", evs);

// Moves
JsonArray moves = new JsonArray();
for (MoveSet.MoveSetEntry move : pokemon.getMoveSet()) {
    JsonObject moveObj = new JsonObject();
    moveObj.addProperty("name", move.getMove().getName());
    moveObj.addProperty("pp", move.getCurrentPp());
    moveObj.addProperty("maxPp", move.getMaxPp());
    moves.add(moveObj);
}
pokemonData.add("moves", moves);

// Held item
if (pokemon.heldItem() != null) {
    pokemonData.addProperty("heldItem", pokemon.heldItem().getItem().toString());
}
```

---

### 4. PC STORAGE NO SE SINCRONIZA

**Severidad:** 🟠 **ALTA** - Datos críticos no disponibles en web

**Descripción:**
El plugin NUNCA sincroniza el PC Storage (almacenamiento de PC), solo el party de 6 Pokémon.

**Problema:**
- Los jugadores pueden tener hasta **30 cajas × 30 slots = 900 Pokémon** en el PC
- La web NO tiene acceso a estos datos
- Imposible mostrar la colección completa del jugador

**Solución requerida:**

```java
// En WebSyncManager.java, agregar después del party:
PCStore pc = Cobblemon.INSTANCE.getStorage().getPC(player);
JsonArray pcData = new JsonArray();

for (int boxIndex = 0; boxIndex < pc.getBoxCount(); boxIndex++) {
    PCBox box = pc.getBoxes().get(boxIndex);
    JsonObject boxObj = new JsonObject();
    boxObj.addProperty("boxNumber", boxIndex);
    boxObj.addProperty("boxName", box.getBoxName());
    
    JsonArray pokemonInBox = new JsonArray();
    for (int slot = 0; slot < 30; slot++) {
        Pokemon pokemon = box.get(slot);
        if (pokemon != null) {
            JsonObject pokemonData = buildPokemonData(pokemon);
            pokemonData.addProperty("slot", slot);
            pokemonInBox.add(pokemonData);
        }
    }
    boxObj.add("pokemon", pokemonInBox);
    pcData.add(boxObj);
}
payload.add("pcStorage", pcData);
```

---

### 5. POKEDEX NO SE SINCRONIZA

**Severidad:** 🟡 **MEDIA** - Funcionalidad deseada no implementada

**Descripción:**
El progreso del Pokédex NO se sincroniza con la web.

**Datos del Pokédex en Cobblemon:**
- Pokémon vistos
- Pokémon capturados
- Formas registradas
- Variantes de color (shiny)

**Ubicación de datos:**
- Archivo: `world/pokedex/<uuid>.dat` (NBT format)

**Solución requerida:**
```java
// Agregar a WebSyncManager:
import com.cobblemon.mod.common.api.storage.pokedex.PokedexData;

PokedexData pokedex = Cobblemon.INSTANCE.getStorage().getPokedex(player);
JsonArray pokedexData = new JsonArray();

for (Species species : PokemonSpecies.INSTANCE.getSpecies()) {
    if (pokedex.hasSeenSpecies(species)) {
        JsonObject entry = new JsonObject();
        entry.addProperty("speciesId", species.getNationalPokedexNumber());
        entry.addProperty("seen", true);
        entry.addProperty("caught", pokedex.hasCaughtSpecies(species));
        pokedexData.add(entry);
    }
}
payload.add("pokedex", pokedexData);
```

---

### 6. COBBLEDOLLARS NO ESTÁ INTEGRADO

**Severidad:** 🟠 **ALTA** - Sistema de economía ausente

**Descripción:**
El mod **CobbleDollars** guarda el balance de dinero del jugador, pero el plugin NO lo lee ni sincroniza.

**Ubicación de datos de CobbleDollars:**
- Archivo: `world/cobbledollarsplayerdata/<uuid>.json`
- Formato:
  ```json
  {
    "balance": 1234,
    "transactions": [...]
  }
  ```

**Problema:**
- La web NO muestra el balance de dinero del jugador
- No se puede hacer un ranking de jugadores más ricos
- No se puede implementar una tienda web

**Solución requerida:**

```java
// Crear nuevo manager: CobbleDollarsManager.java
package com.lospitufos.cobblemon.economy;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

public class CobbleDollarsManager {
    
    private static final String COBBLEDOLLARS_PATH = "world/cobbledollarsplayerdata";
    
    public static int getPlayerBalance(UUID playerUuid) {
        try {
            Path playerFile = Paths.get(COBBLEDOLLARS_PATH, playerUuid.toString() + ".json");
            if (Files.exists(playerFile)) {
                String content = Files.readString(playerFile);
                JsonObject data = JsonParser.parseString(content).getAsJsonObject();
                return data.has("balance") ? data.get("balance").getAsInt() : 0;
            }
        } catch (Exception e) {
            // Log error
        }
        return 0;
    }
    
    public static void setPlayerBalance(UUID playerUuid, int balance) {
        try {
            Path playerFile = Paths.get(COBBLEDOLLARS_PATH, playerUuid.toString() + ".json");
            JsonObject data = new JsonObject();
            data.addProperty("balance", balance);
            Files.writeString(playerFile, data.toString());
        } catch (Exception e) {
            // Log error
        }
    }
}

// Agregar a WebSyncManager.java:
int balance = CobbleDollarsManager.getPlayerBalance(uuid);
payload.addProperty("cobbleDollarsBalance", balance);
```

---

### 7. LEVEL CAPS - Falta integración completa

**Severidad:** 🟡 **MEDIA** - Funcionalidad parcial

**Descripción:**
El sistema de level caps funciona, pero tiene limitaciones:

**Problemas encontrados:**

1. **No hay sincronización bidireccional:**
   - El plugin consulta caps de la API ✅
   - Pero NO reporta violaciones de caps a la API ❌

2. **Falta tracking de eventos:**
   - No se registra cuando un Pokémon alcanza el cap
   - No se registra cuando un Pokémon es removido por exceder el cap
   - No hay logs de eventos para admin

3. **Falta configuración por jugador:**
   - La API soporta badges, playtime, grupos
   - Pero el plugin NO envía estos datos ❌

**Solución requerida:**

```java
// En WebSyncManager.java, agregar:
payload.addProperty("playtime", player.getStatHandler().getStat(Stats.CUSTOM.getOrCreateStat(Stats.PLAY_TIME)));
payload.addProperty("badges", getPlayerBadges(player)); // Implementar sistema de badges

// En LevelCapManager.java, agregar:
private void reportCapViolation(ServerPlayerEntity player, Pokemon pokemon, String type) {
    JsonObject report = new JsonObject();
    report.addProperty("uuid", player.getUuid().toString());
    report.addProperty("pokemonSpecies", pokemon.getSpecies().getName());
    report.addProperty("pokemonLevel", pokemon.getLevel());
    report.addProperty("violationType", type); // "capture" o "ownership"
    report.addProperty("timestamp", Instant.now().toString());
    
    httpClient.postAsync("/api/level-caps/violation", report);
}
```

---

### 8. STARTER POKÉMON - Endpoint faltante

**Severidad:** 🟡 **MEDIA** - Funcionalidad parcial

**Descripción:**
El plugin consulta `/api/players/starter?uuid=...` pero este endpoint NO está documentado/implementado correctamente.

**Plugin espera:**
```json
{
  "pending": true,
  "pokemonId": 25,
  "isShiny": false
}
```

**Solución requerida:**
Crear el endpoint:

```typescript
// src/app/api/players/starter/route.ts (NUEVO)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    const uuid = request.nextUrl.searchParams.get('uuid');
    if (!uuid) {
        return NextResponse.json({ pending: false }, { status: 400 });
    }
    
    const user = await db.users.findOne({ minecraftUuid: uuid });
    
    if (!user || !user.starterId) {
        return NextResponse.json({ pending: false });
    }
    
    // Check if starter was already given
    if (user.starterGiven) {
        return NextResponse.json({ pending: false });
    }
    
    return NextResponse.json({
        pending: true,
        pokemonId: user.starterId,
        isShiny: user.starterIsShiny || false
    });
}
```

**También falta:**
Endpoint `/api/players/starter-given` que el plugin llama pero no existe en la web.

```typescript
// src/app/api/players/starter-given/route.ts (NUEVO)
export async function POST(request: NextRequest) {
    const { uuid, pokemonId, given } = await request.json();
    
    await db.users.updateOne(
        { minecraftUuid: uuid },
        { starterGiven: given }
    );
    
    return NextResponse.json({ success: true });
}
```

---

### 9. FREEZE/MOVEMENT BLOCKING NO IMPLEMENTADO

**Severidad:** 🔴 **CRÍTICA** - Feature principal no funciona

**Descripción:**
El config tiene `freezeUnverified: true` pero **NO HAY CÓDIGO** que congele al jugador.

**Archivo:**
- `Config.java:37` - Variable existe pero nunca se usa

**Problema:**
- Los jugadores no verificados pueden moverse libremente
- El sistema de verificación pierde su propósito

**Solución requerida:**

```java
// Crear nuevo archivo: PlayerMovementBlocker.java
package com.lospitufos.cobblemon.verification;

import net.fabricmc.fabric.api.event.player.PlayerBlockBreakEvents;
import net.fabricmc.fabric.api.event.player.UseItemCallback;
import net.fabricmc.fabric.api.event.player.AttackEntityCallback;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.ActionResult;
import net.minecraft.util.TypedActionResult;
import net.minecraft.text.Text;

public class PlayerMovementBlocker {
    
    private final VerificationManager verificationManager;
    private final Config config;
    
    public void initialize() {
        if (!config.isFreezeUnverified()) return;
        
        // Block movement
        ServerTickEvents.END_SERVER_TICK.register(server -> {
            for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
                if (!verificationManager.isVerified(player.getUuid())) {
                    // Cancel velocity
                    player.setVelocity(0, player.getVelocity().y, 0);
                    
                    // Show message every 5 seconds
                    if (player.age % 100 == 0) {
                        player.sendMessage(Text.literal(config.getVerificationMessage()));
                    }
                }
            }
        });
        
        // Block breaking blocks
        PlayerBlockBreakEvents.BEFORE.register((world, player, pos, state, blockEntity) -> {
            if (!verificationManager.isVerified(player.getUuid())) {
                player.sendMessage(Text.literal(config.getVerificationMessage()));
                return false;
            }
            return true;
        });
        
        // Block using items
        UseItemCallback.EVENT.register((player, world, hand) -> {
            if (player instanceof ServerPlayerEntity serverPlayer) {
                if (!verificationManager.isVerified(serverPlayer.getUuid())) {
                    serverPlayer.sendMessage(Text.literal(config.getVerificationMessage()));
                    return TypedActionResult.fail(serverPlayer.getStackInHand(hand));
                }
            }
            return TypedActionResult.pass(player.getStackInHand(hand));
        });
        
        // Block attacking
        AttackEntityCallback.EVENT.register((player, world, hand, entity, hitResult) -> {
            if (player instanceof ServerPlayerEntity serverPlayer) {
                if (!verificationManager.isVerified(serverPlayer.getUuid())) {
                    serverPlayer.sendMessage(Text.literal(config.getVerificationMessage()));
                    return ActionResult.FAIL;
                }
            }
            return ActionResult.PASS;
        });
    }
}
```

---

### 10. MANEJO DE ERRORES INSUFICIENTE

**Severidad:** 🟡 **MEDIA** - Debugging difícil

**Descripción:**
Los errores de HTTP no se reportan adecuadamente al jugador o a los logs.

**Problemas:**
- Si la API web está caída, el plugin falla silenciosamente
- El jugador no sabe por qué no puede verificarse
- Los admins no tienen logs de errores de conexión

**Solución requerida:**

```java
// En HttpClient.java, mejorar el manejo de errores:
public JsonObject get(String endpoint) throws IOException {
    URL url = new URL(baseUrl + endpoint);
    HttpURLConnection conn = null;
    
    try {
        conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(TIMEOUT_MS);
        conn.setReadTimeout(TIMEOUT_MS);
        conn.setRequestProperty("Content-Type", "application/json");
        
        int responseCode = conn.getResponseCode();
        
        if (responseCode == 200) {
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                return JsonParser.parseReader(reader).getAsJsonObject();
            }
        } else {
            // Leer el body del error
            String errorBody = "";
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                errorBody = reader.lines().collect(Collectors.joining("\n"));
            }
            
            logger.error("GET failed: " + endpoint + 
                        " (Status: " + responseCode + ")" +
                        " Body: " + errorBody);
            return null;
        }
    } catch (ConnectException e) {
        logger.error("Failed to connect to API: " + baseUrl + 
                    ". Is the web server running?");
        throw e;
    } catch (SocketTimeoutException e) {
        logger.error("Request timeout: " + endpoint + 
                    ". API is taking too long to respond.");
        throw e;
    } finally {
        if (conn != null) {
            conn.disconnect();
        }
    }
}
```

---

### 11. SINCRONIZACIÓN DE INVENTARIO NO IMPLEMENTADA

**Severidad:** 🟡 **MEDIA** - Datos adicionales no capturados

**Descripción:**
El API acepta `inventory` y `enderChest` pero el plugin nunca los envía.

**Archivo:**
- `api/players/sync/route.ts:8` - Acepta estos campos
- `WebSyncManager.java` - Nunca los envía ❌

**Solución requerida:**

```java
// En WebSyncManager.java:
// Inventario principal
JsonArray inventory = new JsonArray();
for (int i = 0; i < player.getInventory().size(); i++) {
    ItemStack stack = player.getInventory().getStack(i);
    if (!stack.isEmpty()) {
        JsonObject itemObj = new JsonObject();
        itemObj.addProperty("slot", i);
        itemObj.addProperty("item", Registry.ITEM.getId(stack.getItem()).toString());
        itemObj.addProperty("count", stack.getCount());
        itemObj.addProperty("nbt", stack.getNbt() != null ? stack.getNbt().toString() : null);
        inventory.add(itemObj);
    }
}
payload.add("inventory", inventory);

// Ender Chest
JsonArray enderChest = new JsonArray();
for (int i = 0; i < player.getEnderChestInventory().size(); i++) {
    ItemStack stack = player.getEnderChestInventory().getStack(i);
    if (!stack.isEmpty()) {
        JsonObject itemObj = new JsonObject();
        itemObj.addProperty("slot", i);
        itemObj.addProperty("item", Registry.ITEM.getId(stack.getItem()).toString());
        itemObj.addProperty("count", stack.getCount());
        enderChest.add(itemObj);
    }
}
payload.add("enderChest", enderChest);
```

---

### 12. SISTEMA DE BAN NO IMPLEMENTADO EN PLUGIN

**Severidad:** 🟠 **ALTA** - Seguridad comprometida

**Descripción:**
La API puede banear jugadores (`banned: true`) pero el plugin NUNCA verifica este estado.

**Problema:**
- Un jugador baneado puede seguir jugando
- El plugin ignora el campo `banned` en la respuesta de sync

**Solución requerida:**

```java
// En WebSyncManager.java, después de recibir la respuesta:
httpClient.postAsync("/api/players/sync", payload)
    .thenAccept(response -> {
        if (response != null && response.has("banned")) {
            boolean isBanned = response.get("banned").getAsBoolean();
            if (isBanned) {
                // Kickear al jugador
                player.networkHandler.disconnect(
                    Text.literal("§c¡Has sido baneado del servidor!\n" +
                               "§7Contacta a un administrador si crees que es un error.")
                );
                logger.info("Kicked banned player: " + player.getName().getString());
            }
        }
    });
```

También agregar verificación al join:

```java
// En VerificationManager.java:
private void onPlayerJoin(ServerPlayerEntity player) {
    UUID uuid = player.getUuid();
    
    // Check ban status FIRST
    httpClient.getAsync("/api/players/ban-status?uuid=" + uuid.toString())
        .thenAccept(response -> {
            if (response != null && response.has("banned") && response.get("banned").getAsBoolean()) {
                player.networkHandler.disconnect(
                    Text.literal("§c¡Estás baneado del servidor!")
                );
                return;
            }
            
            // Continue with verification check...
        });
}
```

Crear endpoint en web:
```typescript
// src/app/api/players/ban-status/route.ts (NUEVO)
export async function GET(request: NextRequest) {
    const uuid = request.nextUrl.searchParams.get('uuid');
    const user = await db.users.findOne({ minecraftUuid: uuid });
    return NextResponse.json({ 
        banned: user?.banned || false,
        banReason: user?.banReason || null
    });
}
```

---

### 13. FALTA COMANDO /CODIGO PARA VER EL CÓDIGO NUEVAMENTE

**Severidad:** 🟡 **MEDIA** - UX deficiente

**Descripción:**
La página web menciona "Usa `/codigo` para ver tu código de nuevo" pero este comando NO existe.

**Archivo:**
- `src/app/verificar/page.tsx:181` - Menciona el comando
- `VerificationManager.java` - Comando no implementado ❌

**Solución requerida:**

```java
// En VerificationManager.java, agregar al registro de comandos:
dispatcher.register(
    CommandManager.literal("codigo")
        .executes(context -> {
            ServerPlayerEntity player = context.getSource().getPlayer();
            if (player == null) return 0;
            
            UUID uuid = player.getUuid();
            String code = pendingCodes.get(uuid);
            
            if (code != null) {
                player.sendMessage(Text.literal(""));
                player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                player.sendMessage(Text.literal("§aTu código de verificación: §f§l" + code));
                player.sendMessage(Text.literal(""));
                player.sendMessage(Text.literal("§71. Ve a: §b" + LosPitufosPlugin.getInstance().getConfig().getWebApiUrl()));
                player.sendMessage(Text.literal("§72. Ingresa tu código en la página"));
                player.sendMessage(Text.literal("§73. Vuelve al juego y usa: §f/verify " + code));
                player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
            } else if (isVerified(uuid)) {
                player.sendMessage(Text.literal("§a✓ Tu cuenta ya está verificada."));
            } else {
                player.sendMessage(Text.literal("§cNo tienes un código de verificación pendiente."));
                player.sendMessage(Text.literal("§7Reloguea al servidor para generar uno nuevo."));
            }
            
            return 1;
        })
);
```

---

### 14. FALTA SINCRONIZACIÓN DE ONLINE STATUS

**Severidad:** 🟡 **MEDIA** - Datos inconsistentes

**Descripción:**
El plugin nunca actualiza el estado `online` del jugador.

**API espera:**
```typescript
online: boolean,
lastSeen: string
```

**Plugin envía:**
- `online`: Nunca se envía ❌
- `lastSeen`: Nunca se envía ❌

**Solución requerida:**

```java
// En WebSyncManager.java:
payload.addProperty("online", true);
payload.addProperty("lastSeen", Instant.now().toString());

// También registrar evento de disconnect:
ServerPlayConnectionEvents.DISCONNECT.register((handler, server) -> {
    ServerPlayerEntity player = handler.getPlayer();
    JsonObject payload = new JsonObject();
    payload.addProperty("uuid", player.getUuid().toString());
    payload.addProperty("online", false);
    payload.addProperty("lastSeen", Instant.now().toString());
    
    httpClient.postAsync("/api/players/sync", payload);
});
```

---

### 15. DISCORD WEBHOOK NO IMPLEMENTADO

**Severidad:** 🟢 **BAJA** - Feature opcional

**Descripción:**
El config tiene configuración para Discord webhook pero nunca se usa.

**Archivo:**
- `Config.java:41-42` - Variables declaradas pero no usadas

**Solución requerida:**

```java
// Crear DiscordWebhookManager.java
package com.lospitufos.cobblemon.utils;

import com.google.gson.JsonObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class DiscordWebhookManager {
    
    private final String webhookUrl;
    private final ModLogger logger;
    
    public void sendVerificationNotification(String username, String code) {
        if (webhookUrl == null || webhookUrl.isEmpty()) return;
        
        try {
            JsonObject embed = new JsonObject();
            embed.addProperty("title", "🔐 Nueva Verificación");
            embed.addProperty("description", 
                "**Jugador:** " + username + "\n" +
                "**Código:** `" + code + "`");
            embed.addProperty("color", 3447003); // Blue
            
            JsonObject payload = new JsonObject();
            payload.add("embeds", new JsonArray().add(embed));
            
            sendWebhook(payload);
        } catch (Exception e) {
            logger.error("Failed to send Discord webhook", e);
        }
    }
    
    private void sendWebhook(JsonObject payload) throws Exception {
        URL url = new URL(webhookUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }
        
        int responseCode = conn.getResponseCode();
        if (responseCode < 200 || responseCode >= 300) {
            logger.warn("Discord webhook failed: " + responseCode);
        }
        
        conn.disconnect();
    }
}
```

---

## 📊 RESUMEN DE PRIORIDADES

### 🔴 CRÍTICAS (Bloquean funcionalidad principal)
1. ✅ Código 5 vs 6 dígitos
2. ✅ Endpoints de verificación faltantes
3. ✅ Sistema de freeze/movement blocking

### 🟠 ALTAS (Pérdida significativa de funcionalidad)
4. ✅ Sincronización completa de Pokémon (IVs, EVs, moves, etc.)
5. ✅ PC Storage sincronización
6. ✅ CobbleDollars integración
7. ✅ Sistema de ban check

### 🟡 MEDIAS (Funcionalidad deseada)
8. ✅ Pokédex sincronización
9. ✅ Level caps - tracking completo
10. ✅ Starter endpoints faltantes
11. ✅ Comando /codigo
12. ✅ Online status sincronización
13. ✅ Inventario y Ender Chest

### 🟢 BAJAS (Nice to have)
14. ✅ Discord webhook
15. ✅ Mejor manejo de errores

---

## 🔧 PLAN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Correcciones Críticas (1-2 días)
1. Corregir código de verificación (5 dígitos)
2. Crear endpoints de verificación faltantes
3. Implementar sistema de freeze
4. Agregar comando /codigo

### Fase 2: Sincronización Completa (2-3 días)
1. Expandir datos de Pokémon (IVs, EVs, moves, etc.)
2. Agregar PC Storage sync
3. Implementar Pokédex sync
4. Agregar inventario y ender chest

### Fase 3: Integraciones (1-2 días)
1. Integrar CobbleDollars
2. Completar sistema de level caps
3. Implementar ban checking
4. Agregar online status tracking

### Fase 4: Pulido (1 día)
1. Mejorar manejo de errores
2. Agregar Discord webhook
3. Testing completo
4. Documentación

**Tiempo estimado total:** 5-8 días de desarrollo

---

## 📝 NOTAS TÉCNICAS IMPORTANTES

### Cobblemon Data Storage
Según la documentación de Cobblemon:
- **Party data:** `world/pokemon/playerpartystore/<uuid>/*.dat` (NBT)
- **PC data:** `world/pokemon/pcstore/<uuid>/*.dat` (NBT)
- **Pokédex:** `world/pokedex/<uuid>.dat` (NBT)
- **Playerdata:** `world/playerdata/<uuid>.dat` (NBT)

### CobbleDollars Data Storage
- **Balance:** `world/cobbledollarsplayerdata/<uuid>.json`
- Formato: `{ "balance": number, "transactions": [] }`

### API Web
- Base URL: `https://cobblemon-los-pitufos.vercel.app`
- Database: Vercel KV (MongoDB-like)
- Auth: NextAuth con Discord OAuth

---

## 🚀 CONCLUSIÓN

El plugin tiene una **arquitectura sólida** pero está **INCOMPLETO**. Los problemas principales son:

1. **Desconexión entre plugin y API** - Endpoints no coinciden
2. **Sincronización superficial** - Solo datos básicos, faltan datos críticos
3. **Features no implementadas** - Freeze, ban checking, CobbleDollars
4. **Inconsistencias de formato** - Código 5 vs 6 dígitos

**RECOMENDACIÓN:** Implementar las correcciones en el orden de prioridad indicado, comenzando por las críticas que bloquean la funcionalidad básica del sistema de verificación.

---

**Documento generado:** 2024-12-18  
**Versión del plugin analizado:** 2.0.0  
**Versión de Cobblemon:** 1.7.0+
