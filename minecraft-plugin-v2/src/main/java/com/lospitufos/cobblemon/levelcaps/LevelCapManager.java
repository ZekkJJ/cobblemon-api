package com.lospitufos.cobblemon.levelcaps;

import com.cobblemon.mod.common.Cobblemon;
import com.cobblemon.mod.common.api.events.CobblemonEvents;
import com.cobblemon.mod.common.api.Priority;
import com.cobblemon.mod.common.api.storage.party.PlayerPartyStore;
import com.cobblemon.mod.common.api.storage.pc.PCStore;
import com.cobblemon.mod.common.pokemon.Pokemon;
import com.lospitufos.cobblemon.core.Config;
import com.lospitufos.cobblemon.data.LegendaryPokemonData;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentModificationException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Manages level cap enforcement - STRICT MODE
 * - Pokémon caught over level cap = DELETED IMMEDIATELY (no warning)
 * - Existing Pokémon gaining XP over cap = Warning + level regularized
 * - PC scan for illegal Pokémon (legendaries, blocked species) = DELETED + warning
 * - All HTTP calls are 100% async (never blocks server thread)
 */
public class LevelCapManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final Config config;
    private MinecraftServer server;
    
    // Cache of player caps - thread-safe
    private final Map<UUID, PlayerCaps> capsCache = new ConcurrentHashMap<>();
    
    // Global Pokemon restrictions cache
    private volatile PokemonRestrictions globalRestrictions = new PokemonRestrictions();
    
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
    
    /**
     * Pokemon restrictions configuration
     */
    private static class PokemonRestrictions {
        boolean blockLegendaries = false;
        boolean blockMythicals = false;
        boolean blockUltraBeasts = false;
        boolean blockParadox = false;
        boolean blockMegas = false;
        boolean blockRestricted = false;
        Set<String> blockedSpecies = new HashSet<>();
        Set<String> allowedSpecies = new HashSet<>();
        
        boolean isBlocked(String species) {
            String normalized = species.toLowerCase().replace(" ", "").replace("-", "");
            
            // Check if explicitly allowed
            if (allowedSpecies.contains(normalized)) {
                return false;
            }
            
            // Check if explicitly blocked
            if (blockedSpecies.contains(normalized)) {
                return true;
            }
            
            // Check category blocks
            if (blockLegendaries && LegendaryPokemonData.isLegendary(species)) return true;
            if (blockMythicals && LegendaryPokemonData.isMythical(species)) return true;
            if (blockUltraBeasts && LegendaryPokemonData.isUltraBeast(species)) return true;
            if (blockParadox && LegendaryPokemonData.isParadox(species)) return true;
            if (blockMegas && LegendaryPokemonData.isMega(species)) return true;
            if (blockRestricted && LegendaryPokemonData.isRestricted(species)) return true;
            
            return false;
        }
        
        String getBlockReason(String species) {
            if (blockRestricted && LegendaryPokemonData.isRestricted(species)) return "Pokémon Restringido";
            if (blockMythicals && LegendaryPokemonData.isMythical(species)) return "Pokémon Mítico";
            if (blockLegendaries && LegendaryPokemonData.isLegendary(species)) return "Pokémon Legendario";
            if (blockUltraBeasts && LegendaryPokemonData.isUltraBeast(species)) return "Ultra Bestia";
            if (blockParadox && LegendaryPokemonData.isParadox(species)) return "Pokémon Paradox";
            if (blockMegas && LegendaryPokemonData.isMega(species)) return "Mega Evolución";
            if (blockedSpecies.contains(species.toLowerCase())) return "Especie Bloqueada";
            return "Bloqueado";
        }
    }

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
        logger.info("Level caps initializing (STRICT MODE)...");
        
        // Register capture event - STRICT: DELETE immediately if over cap or blocked
        CobblemonEvents.POKEMON_CAPTURED.subscribe(Priority.NORMAL, event -> {
            ServerPlayerEntity player = event.getPlayer();
            Pokemon pokemon = event.getPokemon();
            
            if (player != null && pokemon != null) {
                String species = pokemon.getSpecies().getName();
                int level = pokemon.getLevel();
                
                // Check Pokemon restrictions FIRST - DELETE immediately
                if (globalRestrictions.isBlocked(species)) {
                    PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
                    party.remove(pokemon);
                    
                    String reason = globalRestrictions.getBlockReason(species);
                    player.sendMessage(Text.literal(""));
                    player.sendMessage(Text.literal("§c§l⚠ POKÉMON ILEGAL - ELIMINADO ⚠"));
                    player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                    player.sendMessage(Text.literal("§e" + species + " §7es un §c" + reason));
                    player.sendMessage(Text.literal("§cEste Pokémon NO está permitido."));
                    player.sendMessage(Text.literal("§cHa sido ELIMINADO permanentemente."));
                    player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                    player.sendMessage(Text.literal(""));
                    
                    logger.warn("DELETED illegal Pokemon: " + player.getName().getString() + " tried to capture " + species + " (" + reason + ")");
                    return kotlin.Unit.INSTANCE;
                }

                // Check level cap - STRICT: DELETE immediately if over cap (no warning!)
                PlayerCaps caps = getCapsInstant(player.getUuid());
                if (caps != null && level > caps.captureCap) {
                    PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
                    party.remove(pokemon);
                    
                    player.sendMessage(Text.literal(""));
                    player.sendMessage(Text.literal("§c§l⚠ POKÉMON SOBRE NIVEL - ELIMINADO ⚠"));
                    player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                    player.sendMessage(Text.literal("§e" + species + " §7nivel §c" + level));
                    player.sendMessage(Text.literal("§7Tu límite de captura es nivel §a" + caps.captureCap));
                    player.sendMessage(Text.literal("§cEl Pokémon ha sido ELIMINADO."));
                    player.sendMessage(Text.literal("§7No puedes capturar Pokémon sobre el límite."));
                    player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                    player.sendMessage(Text.literal(""));
                    
                    logger.warn("DELETED over-level Pokemon: " + player.getName().getString() + " tried to capture " + species + " (Lv" + level + ", cap=" + caps.captureCap + ")");
                }
            }
            return kotlin.Unit.INSTANCE;
        });
        
        // Register experience pre-event - Block XP at cap
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

        // Register experience post-event - Warning + regularize for EXISTING Pokemon
        CobblemonEvents.EXPERIENCE_GAINED_EVENT_POST.subscribe(Priority.HIGHEST, event -> {
            Pokemon pokemon = event.getPokemon();
            if (pokemon != null) {
                UUID ownerUuid = pokemon.getOwnerUUID();
                if (ownerUuid != null) {
                    PlayerCaps caps = getCapsInstant(ownerUuid);
                    if (caps != null && pokemon.getLevel() > caps.ownershipCap) {
                        // Existing Pokemon gained XP over cap - regularize + warn
                        int oldLevel = pokemon.getLevel();
                        pokemon.setLevel(caps.ownershipCap);
                        
                        if (server != null) {
                            ServerPlayerEntity owner = server.getPlayerManager().getPlayer(ownerUuid);
                            if (owner != null) {
                                String pokemonName = pokemon.getSpecies().getName();
                                owner.sendMessage(Text.literal(""));
                                owner.sendMessage(Text.literal("§6§l⚠ NIVEL REGULARIZADO ⚠"));
                                owner.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                                owner.sendMessage(Text.literal("§e" + pokemonName + " §7subió a nivel §c" + oldLevel));
                                owner.sendMessage(Text.literal("§7Límite actual: §a" + caps.ownershipCap));
                                owner.sendMessage(Text.literal("§7Nivel ajustado a §a" + caps.ownershipCap));
                                owner.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                                owner.sendMessage(Text.literal(""));
                            }
                        }
                    }
                }
            }
            return kotlin.Unit.INSTANCE;
        });
        
        // Initial version fetch (async)
        checkConfigVersionAsync();
        
        // Start periodic enforcement (party + PC scan)
        scheduler.scheduleAtFixedRate(
            this::enforceAllPlayerLevelsAndPC,
            10,
            ENFORCEMENT_INTERVAL_SECONDS,
            TimeUnit.SECONDS
        );
        
        logger.info("✓ Level caps initialized (STRICT MODE, PC scan every " + ENFORCEMENT_INTERVAL_SECONDS + "s)");
    }

    /**
     * Periodically check all online players' Party AND PC for illegal Pokémon
     * - Illegal species (legendaries, blocked, etc.) = DELETE immediately
     * - Over level cap = Warn + regularize (for existing Pokemon only)
     * 
     * THREAD SAFETY: Makes defensive copies of all collections before iteration
     * to prevent ConcurrentModificationException
     */
    private void enforceAllPlayerLevelsAndPC() {
        if (server == null) return;
        
        server.execute(() -> {
            // DEFENSIVE COPY: Copy player list to avoid ConcurrentModificationException
            List<ServerPlayerEntity> playersCopy;
            try {
                playersCopy = new ArrayList<>(server.getPlayerManager().getPlayerList());
            } catch (Exception e) {
                logger.debug("Could not copy player list: " + e.getMessage());
                return;
            }
            
            for (ServerPlayerEntity player : playersCopy) {
                if (player == null || player.isDisconnected()) continue;
                
                PlayerCaps caps = getCapsInstant(player.getUuid());
                if (caps == null) continue;
                
                try {
                    // Check PARTY
                    PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
                    if (party != null) {
                        scanAndEnforceStorage(player, party, caps, "Party");
                    }
                    
                    // Check PC - FULL SCAN
                    PCStore pc = Cobblemon.INSTANCE.getStorage().getPC(player);
                    if (pc != null) {
                        scanAndEnforcePC(player, pc, caps);
                    }
                } catch (ConcurrentModificationException cme) {
                    // Expected during heavy activity - skip this player this cycle
                    logger.debug("Skipping " + player.getName().getString() + " due to concurrent modification");
                } catch (Exception e) {
                    logger.debug("Error checking storage for " + player.getName().getString() + ": " + e.getMessage());
                }
            }
        });
    }
    
    /**
     * Scan party storage and enforce rules
     * THREAD SAFETY: Makes defensive copy of party before iteration
     */
    private void scanAndEnforceStorage(ServerPlayerEntity player, PlayerPartyStore party, PlayerCaps caps, String storageName) {
        List<Pokemon> toRemove = new ArrayList<>();
        List<Pokemon> toRegularize = new ArrayList<>();
        
        // DEFENSIVE COPY: Copy party pokemon to list to avoid ConcurrentModificationException
        List<Pokemon> partyCopy = new ArrayList<>();
        try {
            for (int i = 0; i < 6; i++) {
                Pokemon pokemon = party.get(i);
                if (pokemon != null) {
                    partyCopy.add(pokemon);
                }
            }
        } catch (Exception e) {
            logger.debug("Could not copy party for " + player.getName().getString() + ": " + e.getMessage());
            return;
        }
        
        for (Pokemon pokemon : partyCopy) {
            String species = pokemon.getSpecies().getName();
            int level = pokemon.getLevel();
            
            // Check if blocked species - DELETE
            if (globalRestrictions.isBlocked(species)) {
                toRemove.add(pokemon);
                String reason = globalRestrictions.getBlockReason(species);
                
                player.sendMessage(Text.literal(""));
                player.sendMessage(Text.literal("§c§l⚠ POKÉMON ILEGAL DETECTADO ⚠"));
                player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                player.sendMessage(Text.literal("§e" + species + " §7(" + storageName + ")"));
                player.sendMessage(Text.literal("§7Razón: §c" + reason));
                player.sendMessage(Text.literal("§cELIMINADO permanentemente."));
                player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                player.sendMessage(Text.literal(""));
                
                logger.warn("DELETED illegal: " + player.getName().getString() + "'s " + species + " from " + storageName + " (" + reason + ")");
            }
            // Check if over level cap - REGULARIZE (existing Pokemon)
            else if (level > caps.ownershipCap) {
                toRegularize.add(pokemon);
            }
        }

        // Remove illegal Pokemon (safe - we're not iterating anymore)
        for (Pokemon pokemon : toRemove) {
            try {
                party.remove(pokemon);
            } catch (Exception e) {
                logger.debug("Could not remove pokemon: " + e.getMessage());
            }
        }
        
        // Regularize over-level Pokemon (warn only)
        for (Pokemon pokemon : toRegularize) {
            try {
                String species = pokemon.getSpecies().getName();
                int oldLevel = pokemon.getLevel();
                pokemon.setLevel(caps.ownershipCap);
                
                player.sendMessage(Text.literal("§6⚠ §e" + species + " §7(" + storageName + ") nivel §c" + oldLevel + " §7→ §a" + caps.ownershipCap));
                logger.info("Regularized: " + player.getName().getString() + "'s " + species + " from " + oldLevel + " to " + caps.ownershipCap);
            } catch (Exception e) {
                logger.debug("Could not regularize pokemon: " + e.getMessage());
            }
        }
    }
    
    /**
     * Scan PC storage (all boxes) and enforce rules
     * THREAD SAFETY: Makes defensive copy of PC pokemon before iteration
     */
    private void scanAndEnforcePC(ServerPlayerEntity player, PCStore pc, PlayerCaps caps) {
        List<Pokemon> toRemove = new ArrayList<>();
        List<Pokemon> toRegularize = new ArrayList<>();
        
        // DEFENSIVE COPY: Copy all PC pokemon to list to avoid ConcurrentModificationException
        List<Pokemon> pcCopy = new ArrayList<>();
        try {
            for (Pokemon pokemon : pc) {
                if (pokemon != null) {
                    pcCopy.add(pokemon);
                }
            }
        } catch (Exception e) {
            logger.debug("Could not copy PC for " + player.getName().getString() + ": " + e.getMessage());
            return;
        }
        
        // Now iterate over the safe copy
        for (Pokemon pokemon : pcCopy) {
            String species = pokemon.getSpecies().getName();
            int level = pokemon.getLevel();
            
            // Check if blocked species - DELETE
            if (globalRestrictions.isBlocked(species)) {
                if (!toRemove.contains(pokemon)) {
                    toRemove.add(pokemon);
                    String reason = globalRestrictions.getBlockReason(species);
                    
                    player.sendMessage(Text.literal(""));
                    player.sendMessage(Text.literal("§c§l⚠ POKÉMON ILEGAL EN PC ⚠"));
                    player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                    player.sendMessage(Text.literal("§e" + species + " §7(PC)"));
                    player.sendMessage(Text.literal("§7Razón: §c" + reason));
                    player.sendMessage(Text.literal("§cELIMINADO permanentemente."));
                    player.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                    player.sendMessage(Text.literal(""));
                    
                    logger.warn("DELETED illegal from PC: " + player.getName().getString() + "'s " + species + " (" + reason + ")");
                }
            }
            // Check if over level cap - REGULARIZE
            else if (level > caps.ownershipCap && !toRegularize.contains(pokemon)) {
                toRegularize.add(pokemon);
            }
        }
        
        // Remove illegal Pokemon from PC (safe - we're not iterating anymore)
        for (Pokemon pokemon : toRemove) {
            try {
                pc.remove(pokemon);
            } catch (Exception e) {
                logger.debug("Could not remove pokemon from PC: " + e.getMessage());
            }
        }
        
        // Regularize over-level Pokemon in PC
        for (Pokemon pokemon : toRegularize) {
            try {
                String species = pokemon.getSpecies().getName();
                int oldLevel = pokemon.getLevel();
                pokemon.setLevel(caps.ownershipCap);
                
                player.sendMessage(Text.literal("§6⚠ §e" + species + " §7(PC) nivel §c" + oldLevel + " §7→ §a" + caps.ownershipCap));
                logger.info("Regularized PC: " + player.getName().getString() + "'s " + species + " from " + oldLevel + " to " + caps.ownershipCap);
            } catch (Exception e) {
                logger.debug("Could not regularize pokemon in PC: " + e.getMessage());
            }
        }
    }

    /**
     * Gets caps INSTANTLY from cache - NEVER blocks
     */
    private PlayerCaps getCapsInstant(UUID playerUuid) {
        maybeCheckVersion();
        
        PlayerCaps cached = capsCache.get(playerUuid);
        
        if (cached == null) {
            PlayerCaps defaults = new PlayerCaps(50, 100);
            capsCache.put(playerUuid, defaults);
            fetchCapsAsync(playerUuid);
            return defaults;
        }
        
        if (cached.isExpired()) {
            fetchCapsAsync(playerUuid);
        }
        
        return cached;
    }
    
    private void maybeCheckVersion() {
        long now = System.currentTimeMillis();
        if (now - lastVersionCheck > VERSION_CHECK_INTERVAL_MS) {
            checkConfigVersionAsync();
        }
    }
    
    private void checkConfigVersionAsync() {
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

    private void fetchAndAnnounceNewCaps() {
        httpClient.getAsync("/api/level-caps/effective?uuid=global")
            .thenAccept(response -> {
                if (response != null && response.has("captureCap") && response.has("ownershipCap")) {
                    int newCaptureCap = response.get("captureCap").getAsInt();
                    int newOwnershipCap = response.get("ownershipCap").getAsInt();
                    
                    logger.info("New level caps: Capture=" + newCaptureCap + ", Ownership=" + newOwnershipCap);
                    
                    if (server != null) {
                        server.execute(() -> {
                            for (ServerPlayerEntity p : server.getPlayerManager().getPlayerList()) {
                                p.sendMessage(Text.literal(""));
                                p.sendMessage(Text.literal("§6§l⚠ LÍMITES DE NIVEL ACTUALIZADOS ⚠"));
                                p.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                                p.sendMessage(Text.literal("§e⚔ Captura máxima: §f" + newCaptureCap));
                                p.sendMessage(Text.literal("§a✦ Nivel máximo: §f" + newOwnershipCap));
                                p.sendMessage(Text.literal("§c⚠ Pokémon sobre el límite serán ELIMINADOS al capturar"));
                                p.sendMessage(Text.literal("§7━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                                p.sendMessage(Text.literal(""));
                                
                                capsCache.put(p.getUuid(), new PlayerCaps(newCaptureCap, newOwnershipCap));
                            }
                        });
                    }
                }
            })
            .exceptionally(ex -> {
                logger.error("Failed to fetch new caps: " + ex.getMessage());
                return null;
            });
    }
    
    private void fetchCapsAsync(UUID playerUuid) {
        httpClient.getAsync("/api/level-caps/effective?uuid=" + playerUuid.toString())
            .thenAccept(response -> {
                if (response != null && response.has("captureCap") && response.has("ownershipCap")) {
                    int captureCap = response.get("captureCap").getAsInt();
                    int ownershipCap = response.get("ownershipCap").getAsInt();
                    capsCache.put(playerUuid, new PlayerCaps(captureCap, ownershipCap));
                    
                    if (response.has("pokemonRestrictions")) {
                        updateRestrictionsFromResponse(response.getAsJsonObject("pokemonRestrictions"));
                    }
                }
            })
            .exceptionally(ex -> null);
    }

    private void updateRestrictionsFromResponse(com.google.gson.JsonObject restrictions) {
        try {
            PokemonRestrictions newRestrictions = new PokemonRestrictions();
            
            if (restrictions.has("blockLegendaries")) {
                newRestrictions.blockLegendaries = restrictions.get("blockLegendaries").getAsBoolean();
            }
            if (restrictions.has("blockMythicals")) {
                newRestrictions.blockMythicals = restrictions.get("blockMythicals").getAsBoolean();
            }
            if (restrictions.has("blockUltraBeasts")) {
                newRestrictions.blockUltraBeasts = restrictions.get("blockUltraBeasts").getAsBoolean();
            }
            if (restrictions.has("blockParadox")) {
                newRestrictions.blockParadox = restrictions.get("blockParadox").getAsBoolean();
            }
            if (restrictions.has("blockMegas")) {
                newRestrictions.blockMegas = restrictions.get("blockMegas").getAsBoolean();
            }
            if (restrictions.has("blockRestricted")) {
                newRestrictions.blockRestricted = restrictions.get("blockRestricted").getAsBoolean();
            }
            
            if (restrictions.has("blockedSpecies") && restrictions.get("blockedSpecies").isJsonArray()) {
                JsonArray blocked = restrictions.getAsJsonArray("blockedSpecies");
                for (JsonElement elem : blocked) {
                    newRestrictions.blockedSpecies.add(elem.getAsString().toLowerCase());
                }
            }
            
            if (restrictions.has("allowedSpecies") && restrictions.get("allowedSpecies").isJsonArray()) {
                JsonArray allowed = restrictions.getAsJsonArray("allowedSpecies");
                for (JsonElement elem : allowed) {
                    newRestrictions.allowedSpecies.add(elem.getAsString().toLowerCase());
                }
            }
            
            globalRestrictions = newRestrictions;
            
            logger.debug("Pokemon restrictions updated: legendaries=" + newRestrictions.blockLegendaries +
                ", mythicals=" + newRestrictions.blockMythicals +
                ", ultraBeasts=" + newRestrictions.blockUltraBeasts +
                ", paradox=" + newRestrictions.blockParadox +
                ", megas=" + newRestrictions.blockMegas +
                ", restricted=" + newRestrictions.blockRestricted);
                
        } catch (Exception e) {
            logger.error("Error parsing restrictions: " + e.getMessage());
        }
    }
    
    public void shutdown() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
        logger.info("Level caps manager shutdown");
    }
}
