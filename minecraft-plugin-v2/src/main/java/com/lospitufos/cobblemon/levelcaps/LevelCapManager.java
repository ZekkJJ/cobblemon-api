package com.lospitufos.cobblemon.levelcaps;

import com.cobblemon.mod.common.Cobblemon;
import com.cobblemon.mod.common.api.events.CobblemonEvents;
import com.cobblemon.mod.common.api.Priority;
import com.cobblemon.mod.common.api.storage.party.PlayerPartyStore;
import com.cobblemon.mod.common.pokemon.Pokemon;
import com.lospitufos.cobblemon.core.Config;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Manages level cap enforcement - ZERO LAG VERSION
 * - All HTTP calls are 100% async (never blocks server thread)
 * - Uses cached values immediately, updates in background
 * - Version polling uses existing HTTP thread pool
 */
public class LevelCapManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final Config config;
    private MinecraftServer server;
    
    // Cache of player caps - thread-safe
    private final Map<UUID, PlayerCaps> capsCache = new ConcurrentHashMap<>();
    
    // Version tracking - atomic for thread safety
    private final AtomicInteger currentConfigVersion = new AtomicInteger(0);
    private final AtomicBoolean versionCheckInProgress = new AtomicBoolean(false);
    private volatile long lastVersionCheck = 0;
    
    // Scheduler for periodic enforcement
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    // Constants
    private static final long CACHE_DURATION_MS = 300000; // 5 min cache
    private static final long VERSION_CHECK_INTERVAL_MS = 60000; // Check version every 60s
    private static final int ENFORCEMENT_INTERVAL_SECONDS = 30; // Check levels every 30s
    
    private static class PlayerCaps {
        final int captureCap;
        final int ownershipCap;
        final long cacheTime;
        
        PlayerCaps(int captureCap, int ownershipCap) {
            this.captureCap = captureCap;
            this.ownershipCap = ownershipCap;
            this.cacheTime = System.currentTimeMillis();
        }
        
        boolean isExpired() {
            return System.currentTimeMillis() - cacheTime > CACHE_DURATION_MS;
        }
    }
    
    public LevelCapManager(HttpClient httpClient, ModLogger logger, Config config) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.config = config;
    }
    
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Level caps initializing (zero-lag mode)...");
        
        // Register capture event - INSTANT, uses cached values only
        CobblemonEvents.POKEMON_CAPTURED.subscribe(Priority.NORMAL, event -> {
            ServerPlayerEntity player = event.getPlayer();
            Pokemon pokemon = event.getPokemon();
            
            if (player != null && pokemon != null) {
                PlayerCaps caps = getCapsInstant(player.getUuid());
                if (caps != null && pokemon.getLevel() > caps.captureCap) {
                    PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
                    party.remove(pokemon);
                    
                    player.sendMessage(Text.literal(
                        "§c¡El Pokémon es demasiado poderoso! Tu límite de captura es nivel §e" + caps.captureCap
                    ));
                }
            }
            return kotlin.Unit.INSTANCE;
        });
        
        // Register experience pre-event - INSTANT
        CobblemonEvents.EXPERIENCE_GAINED_EVENT_PRE.subscribe(Priority.HIGHEST, event -> {
            Pokemon pokemon = event.getPokemon();
            if (pokemon != null) {
                UUID ownerUuid = pokemon.getOwnerUUID();
                if (ownerUuid != null) {
                    PlayerCaps caps = getCapsInstant(ownerUuid);
                    if (caps != null && pokemon.getLevel() >= caps.ownershipCap) {
                        event.setExperience(0);
                    }
                }
            }
            return kotlin.Unit.INSTANCE;
        });
        
        // Register experience post-event - INSTANT
        // If a Pokémon somehow levels above cap, REMOVE it
        CobblemonEvents.EXPERIENCE_GAINED_EVENT_POST.subscribe(Priority.HIGHEST, event -> {
            Pokemon pokemon = event.getPokemon();
            if (pokemon != null) {
                UUID ownerUuid = pokemon.getOwnerUUID();
                if (ownerUuid != null) {
                    PlayerCaps caps = getCapsInstant(ownerUuid);
                    if (caps != null && pokemon.getLevel() > caps.ownershipCap) {
                        // Remove the illegal Pokémon
                        if (server != null) {
                            ServerPlayerEntity owner = server.getPlayerManager().getPlayer(ownerUuid);
                            if (owner != null) {
                                PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(owner);
                                if (party != null) {
                                    String pokemonName = pokemon.getSpecies().getName();
                                    int level = pokemon.getLevel();
                                    party.remove(pokemon);
                                    
                                    owner.sendMessage(Text.literal(
                                        "§c⚠ §e" + pokemonName + " §7(Nivel §c" + level + 
                                        "§7) superó el límite y fue §cLIBERADO"
                                    ));
                                }
                            }
                        }
                    }
                }
            }
            return kotlin.Unit.INSTANCE;
        });
        
        // Initial version fetch (async)
        checkConfigVersionAsync();
        
        // Start periodic level enforcement (catches command-based level changes)
        scheduler.scheduleAtFixedRate(
            this::enforceAllPlayerLevels,
            10, // Initial delay
            ENFORCEMENT_INTERVAL_SECONDS,
            TimeUnit.SECONDS
        );
        
        logger.info("✓ Level caps initialized (zero-lag, enforcement every " + ENFORCEMENT_INTERVAL_SECONDS + "s)");
    }
    
    /**
     * Periodically check all online players' Pokémon levels
     * This catches level changes from commands, hacks, or other mods
     * ILLEGAL Pokémon (above cap) are REMOVED, not level-reduced
     */
    private void enforceAllPlayerLevels() {
        if (server == null) return;
        
        // Run on main thread to safely access Pokémon data
        server.execute(() -> {
            for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
                if (player == null || player.isDisconnected()) continue;
                
                PlayerCaps caps = getCapsInstant(player.getUuid());
                if (caps == null) continue;
                
                try {
                    PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
                    if (party == null) continue;
                    
                    // Collect illegal Pokémon first (can't modify while iterating)
                    java.util.List<Pokemon> illegalPokemon = new java.util.ArrayList<>();
                    for (Pokemon pokemon : party) {
                        if (pokemon != null && pokemon.getLevel() > caps.ownershipCap) {
                            illegalPokemon.add(pokemon);
                        }
                    }
                    
                    // Remove illegal Pokémon
                    for (Pokemon pokemon : illegalPokemon) {
                        String pokemonName = pokemon.getSpecies().getName();
                        int level = pokemon.getLevel();
                        
                        party.remove(pokemon);
                        
                        player.sendMessage(Text.literal(""));
                        player.sendMessage(Text.literal("§c§l⚠ POKÉMON ILEGAL DETECTADO ⚠"));
                        player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                        player.sendMessage(Text.literal("§e" + pokemonName + " §7(Nivel §c" + level + "§7)"));
                        player.sendMessage(Text.literal("§7Límite máximo: §a" + caps.ownershipCap));
                        player.sendMessage(Text.literal("§c¡El Pokémon ha sido LIBERADO!"));
                        player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                        player.sendMessage(Text.literal(""));
                        
                        logger.warn("REMOVED illegal Pokémon from " + player.getName().getString() + 
                            ": " + pokemonName + " (Level " + level + " > cap " + caps.ownershipCap + ")");
                    }
                } catch (Exception e) {
                    logger.debug("Error checking party for " + player.getName().getString() + ": " + e.getMessage());
                }
            }
        });
    }
    
    /**
     * Gets caps INSTANTLY from cache - NEVER blocks
     * Returns default caps if not cached yet
     */
    private PlayerCaps getCapsInstant(UUID playerUuid) {
        // Trigger version check if needed (async, non-blocking)
        maybeCheckVersion();
        
        PlayerCaps cached = capsCache.get(playerUuid);
        
        if (cached == null) {
            // No cache - use defaults and fetch async
            PlayerCaps defaults = new PlayerCaps(50, 100);
            capsCache.put(playerUuid, defaults);
            fetchCapsAsync(playerUuid);
            return defaults;
        }
        
        if (cached.isExpired()) {
            // Expired - return stale data but refresh async
            fetchCapsAsync(playerUuid);
        }
        
        return cached;
    }
    
    /**
     * Checks version if enough time has passed - completely async
     */
    private void maybeCheckVersion() {
        long now = System.currentTimeMillis();
        if (now - lastVersionCheck > VERSION_CHECK_INTERVAL_MS) {
            checkConfigVersionAsync();
        }
    }
    
    /**
     * Async version check - uses CompletableFuture, never blocks
     */
    private void checkConfigVersionAsync() {
        // Prevent concurrent checks
        if (!versionCheckInProgress.compareAndSet(false, true)) {
            return;
        }
        
        lastVersionCheck = System.currentTimeMillis();
        
        httpClient.getAsync("/api/level-caps/version")
            .thenAccept(response -> {
                try {
                    if (response != null && response.has("version")) {
                        int backendVersion = response.get("version").getAsInt();
                        int current = currentConfigVersion.get();
                        
                        if (current == 0) {
                            currentConfigVersion.set(backendVersion);
                            logger.info("Level caps version: " + backendVersion);
                        } else if (backendVersion > current) {
                            logger.info("🔔 Level caps updated! v" + current + " → v" + backendVersion);
                            capsCache.clear();
                            currentConfigVersion.set(backendVersion);
                            
                            // Fetch new caps and notify players with specific values
                            fetchAndAnnounceNewCaps();
                        }
                    }
                } finally {
                    versionCheckInProgress.set(false);
                }
            })
            .exceptionally(ex -> {
                versionCheckInProgress.set(false);
                return null;
            });
    }
    
    /**
     * Fetch new caps from backend and announce to all players
     */
    private void fetchAndAnnounceNewCaps() {
        httpClient.getAsync("/api/level-caps/effective?uuid=global")
            .thenAccept(response -> {
                if (response != null && response.has("captureCap") && response.has("ownershipCap")) {
                    int newCaptureCap = response.get("captureCap").getAsInt();
                    int newOwnershipCap = response.get("ownershipCap").getAsInt();
                    
                    logger.info("New level caps: Capture=" + newCaptureCap + ", Ownership=" + newOwnershipCap);
                    
                    // Notify all players on main thread
                    if (server != null) {
                        server.execute(() -> {
                            for (ServerPlayerEntity p : server.getPlayerManager().getPlayerList()) {
                                p.sendMessage(Text.literal(""));
                                p.sendMessage(Text.literal("§6§l⚠ LÍMITES DE NIVEL ACTUALIZADOS ⚠"));
                                p.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                                p.sendMessage(Text.literal("§e⚔ Captura máxima: §f" + newCaptureCap));
                                p.sendMessage(Text.literal("§a✦ Nivel máximo: §f" + newOwnershipCap));
                                p.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                                p.sendMessage(Text.literal(""));
                                
                                // Update their cache immediately
                                capsCache.put(p.getUuid(), new PlayerCaps(newCaptureCap, newOwnershipCap));
                            }
                        });
                    }
                }
            })
            .exceptionally(ex -> {
                logger.error("Failed to fetch new caps: " + ex.getMessage());
                // Still notify players that caps changed
                if (server != null) {
                    server.execute(() -> {
                        for (ServerPlayerEntity p : server.getPlayerManager().getPlayerList()) {
                            p.sendMessage(Text.literal("§e⚠ Límites de nivel actualizados"));
                        }
                    });
                }
                return null;
            });
    }
    
    /**
     * Fetches caps async - never blocks server thread
     */
    private void fetchCapsAsync(UUID playerUuid) {
        httpClient.getAsync("/api/level-caps/effective?uuid=" + playerUuid.toString())
            .thenAccept(response -> {
                if (response != null && response.has("captureCap") && response.has("ownershipCap")) {
                    int captureCap = response.get("captureCap").getAsInt();
                    int ownershipCap = response.get("ownershipCap").getAsInt();
                    capsCache.put(playerUuid, new PlayerCaps(captureCap, ownershipCap));
                }
            })
            .exceptionally(ex -> null); // Silent fail, use cached
    }
    
    public void refreshCaps(UUID playerUuid) {
        capsCache.remove(playerUuid);
    }
    
    public void shutdown() {
        capsCache.clear();
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
        logger.info("✓ Level caps shutdown");
    }
}
