package com.lospitufos.cobblemon.levelcaps;

import com.cobblemon.mod.common.Cobblemon;
import com.cobblemon.mod.common.api.events.CobblemonEvents;
import com.cobblemon.mod.common.api.Priority;
import com.cobblemon.mod.common.api.storage.party.PlayerPartyStore;
import com.cobblemon.mod.common.pokemon.Pokemon;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.core.Config;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages level cap enforcement
 * - Capture cap (removes captured Pokemon if > cap)
 * - Ownership cap (max level for owned Pokemon)
 * - Uses Cobblemon events for enforcement
 */
public class LevelCapManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final Config config;
    private MinecraftServer server;
    
    // Cache of player caps
    private final Map<UUID, PlayerCaps> capsCache = new ConcurrentHashMap<>();
    
    private static class PlayerCaps {
        int captureCap;
        int ownershipCap;
        long cacheTime;
        
        PlayerCaps(int captureCap, int ownershipCap) {
            this.captureCap = captureCap;
            this.ownershipCap = ownershipCap;
            this.cacheTime = System.currentTimeMillis();
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() - cacheTime > 300000; // 5 min
        }
    }
    
    public LevelCapManager(HttpClient httpClient, ModLogger logger, Config config) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.config = config;
    }
    
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Level caps initializing...");
        
        // Register capture event (check after capture)
        CobblemonEvents.POKEMON_CAPTURED.subscribe(Priority.NORMAL, event -> {
            ServerPlayerEntity player = event.getPlayer();
            Pokemon pokemon = event.getPokemon();
            
            if (player != null && pokemon != null) {
                UUID uuid = player.getUuid();
                int pokemonLevel = pokemon.getLevel();
                
                PlayerCaps caps = getCaps(uuid);
                if (caps != null && pokemonLevel > caps.captureCap) {
                    // Remove from party since capture can't be cancelled
                    PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
                    party.remove(pokemon);
                    
                    player.sendMessage(Text.literal(
                        "§c¡El Pokémon es demasiado poderoso! Tu límite de captura es nivel §e" + caps.captureCap
                    ));
                    logger.info("Removed captured Pokemon for " + player.getName().getString() + 
                               " - Pokemon level " + pokemonLevel + " > cap " + caps.captureCap);
                }
            }
            
            return kotlin.Unit.INSTANCE;
        });
        
        // Register experience pre-event
        CobblemonEvents.EXPERIENCE_GAINED_EVENT_PRE.subscribe(Priority.HIGHEST, event -> {
            Pokemon pokemon = event.getPokemon();
            
            if (pokemon != null) {
                UUID ownerUuid = pokemon.getOwnerUUID();
                if (ownerUuid != null) {
                    PlayerCaps caps = getCaps(ownerUuid);
                    if (caps != null && pokemon.getLevel() >= caps.ownershipCap) {
                        event.setExperience(0);
                        logger.debug("Blocked exp for " + pokemon.getSpecies().getName() + 
                                   " at ownership cap " + caps.ownershipCap);
                    }
                }
            }
            
            return kotlin.Unit.INSTANCE;
        });
        
        // Register experience post-event (adjust if exceeded)
        CobblemonEvents.EXPERIENCE_GAINED_EVENT_POST.subscribe(Priority.HIGHEST, event -> {
            Pokemon pokemon = event.getPokemon();
            
            if (pokemon != null) {
                UUID ownerUuid = pokemon.getOwnerUUID();
                if (ownerUuid != null) {
                    PlayerCaps caps = getCaps(ownerUuid);
                    if (caps != null && pokemon.getLevel() > caps.ownershipCap) {
                        pokemon.setLevel(caps.ownershipCap);
                        
                        ServerPlayerEntity owner = server.getPlayerManager().getPlayer(ownerUuid);
                        if (owner != null) {
                            owner.sendMessage(Text.literal(
                                "§e" + pokemon.getSpecies().getName() + 
                                " ha alcanzado el nivel máximo permitido (§6" + caps.ownershipCap + "§e)"
                            ));
                        }
                        
                        logger.info("Reset " + pokemon.getSpecies().getName() + 
                                  " to cap " + caps.ownershipCap);
                    }
                }
            }
            
            return kotlin.Unit.INSTANCE;
        });
        
        logger.info("✓ Level caps initialized");
    }
    
    private PlayerCaps getCaps(UUID playerUuid) {
        // Check cache first
        PlayerCaps cached = capsCache.get(playerUuid);
        if (cached != null && !cached.isExpired()) {
            return cached;
        }
        
        // If cache expired or missing, trigger async refresh but return cached/default immediately
        // NEVER block the server thread waiting for HTTP response
        if (cached != null) {
            // Return expired cache while refreshing in background
            fetchCapsAsync(playerUuid);
            return cached;
        }
        
        // No cache at all - return defaults and fetch async
        PlayerCaps defaults = new PlayerCaps(50, 100);
        capsCache.put(playerUuid, defaults);
        fetchCapsAsync(playerUuid);
        
        return defaults;
    }
    
    private void fetchCapsAsync(UUID playerUuid) {
        httpClient.getAsync("/api/level-caps/effective?uuid=" + playerUuid.toString())
            .thenAccept(response -> {
                try {
                    if (response != null && response.has("captureCap") && response.has("ownershipCap")) {
                        int captureCap = response.get("captureCap").getAsInt();
                        int ownershipCap = response.get("ownershipCap").getAsInt();
                        
                        PlayerCaps caps = new PlayerCaps(captureCap, ownershipCap);
                        capsCache.put(playerUuid, caps);
                        
                        logger.debug("Updated caps for " + playerUuid + ": capture=" + captureCap + ", ownership=" + ownershipCap);
                    }
                } catch (Exception e) {
                    logger.error("Error parsing caps response for " + playerUuid + ": " + e.getMessage());
                }
            })
            .exceptionally(ex -> {
                logger.debug("Failed to fetch caps for " + playerUuid + " (using cached/default)");
                return null;
            });
    }
    
    public void refreshCaps(UUID playerUuid) {
        capsCache.remove(playerUuid);
    }
    
    public void shutdown() {
        logger.info("Level caps shutting down...");
        capsCache.clear();
    }
}
