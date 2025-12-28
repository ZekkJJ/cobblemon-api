package com.lospitufos.cobblemon.economy;

import com.cobblemon.mod.common.Cobblemon;
import com.cobblemon.mod.common.api.events.CobblemonEvents;
import com.cobblemon.mod.common.api.pokemon.PokemonSpecies;
import com.cobblemon.mod.common.api.pokemon.stats.Stats;
import com.cobblemon.mod.common.api.storage.party.PlayerPartyStore;
import com.cobblemon.mod.common.pokemon.Pokemon;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

/**
 * Economy Manager - Handles all CobbleDollars rewards
 * 
 * Features:
 * 1. Capture rewards (bonus for shiny/legendary)
 * 2. Battle victory rewards (PvE)
 * 3. Playtime rewards (every 30 min)
 * 4. Evolution rewards
 * 5. Pokédex milestone rewards
 * 6. Daily login rewards with streak
 * 7. Daily quests
 * 9. Bounties (common Pokémon targets)
 */
public class EconomyManager {
    
    private final ModLogger logger;
    private final HttpClient httpClient;
    private MinecraftServer server;
    private final ScheduledExecutorService scheduler;
    
    // Player data tracking
    private final Map<UUID, PlayerEconomyData> playerData = new ConcurrentHashMap<>();
    private final Map<UUID, Long> lastPlaytimeReward = new ConcurrentHashMap<>();
    
    // Active bounties (species name -> reward)
    private final Map<String, Integer> activeBounties = new ConcurrentHashMap<>();
    private long lastBountyRotation = 0;
    
    // ============================================
    // REWARD CONFIGURATION (balanced for 15k+ economy)
    // ============================================
    
    // Capture rewards
    private static final int CAPTURE_BASE = 500;           // Base reward per capture
    private static final int CAPTURE_SHINY_BONUS = 5000;   // Bonus for shiny
    private static final int CAPTURE_LEGENDARY_BONUS = 15000; // Bonus for legendary
    private static final int CAPTURE_FIRST_CATCH_BONUS = 1000; // First time catching species
    
    // Battle rewards (PvE only)
    private static final int BATTLE_WIN_BASE = 300;        // Base for winning battle
    private static final int BATTLE_WIN_PER_LEVEL = 20;    // Per enemy level
    
    // Playtime rewards
    private static final int PLAYTIME_REWARD = 1000;       // Every 30 minutes
    private static final int PLAYTIME_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
    
    // Evolution rewards
    private static final int EVOLUTION_REWARD = 750;       // Per evolution
    
    // Pokédex milestones
    private static final Map<Integer, Integer> POKEDEX_MILESTONES = Map.of(
        10, 5000,      // 10 species caught
        25, 10000,     // 25 species
        50, 25000,     // 50 species
        100, 50000,    // 100 species
        150, 100000,   // 150 species
        200, 150000,   // 200 species
        300, 250000,   // 300 species
        400, 400000,   // 400 species
        500, 600000    // 500 species
    );
    
    // Daily login rewards (day streak -> reward)
    private static final int[] DAILY_REWARDS = {1000, 1500, 2000, 3000, 4000, 5000, 10000}; // Day 1-7
    
    // Bounty configuration
    private static final int BOUNTY_COUNT = 3;            // Active bounties at once
    private static final int BOUNTY_MIN_REWARD = 2000;
    private static final int BOUNTY_MAX_REWARD = 5000;
    private static final long BOUNTY_ROTATION_MS = 6 * 60 * 60 * 1000; // 6 hours
    
    // Team Synergy Rewards (every 2 hours - ACCUMULATES while offline)
    // ONLY counts PARTY (max 6), NOT PC - prevents exploit
    // AFK penalty: reduces reward, penalty goes to XP for lowest pokemon + distributed to online players
    private static final long SYNERGY_REWARD_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours
    private static final int SYNERGY_MIN_PARTY_SIZE = 3;  // Minimum Pokémon to qualify
    private static final int SYNERGY_BASE_REWARD = 2000;  // Base reward
    private static final int SYNERGY_PER_AVG_PP = 2;      // CD per average Pitufipuntos (capped)
    private static final int SYNERGY_MAX_PP_BONUS = 3000; // Max bonus from Pitufipuntos
    private static final int SYNERGY_FULL_TEAM_BONUS = 1500; // Bonus for 6 Pokémon
    private static final int SYNERGY_TYPE_DIVERSITY_BONUS = 500; // Per unique type (max 5k)
    private static final int SYNERGY_SHINY_BONUS = 1000;  // Per shiny in party
    private static final int SYNERGY_LEGENDARY_BONUS = 2000; // Per legendary in party
    
    // AFK Penalty System
    private static final double AFK_PENALTY_PERCENT = 0.40; // 40% penalty if AFK
    private static final double XP_CONVERSION_PERCENT = 0.40; // 40% of penalty goes to XP
    private static final double DISTRIBUTION_PERCENT = 0.60; // 60% of penalty distributed to online players
    private static final int XP_PER_CD = 10; // 10 XP per CobbleDollar converted
    
    // Track player activity (last action timestamp)
    private final Map<UUID, Long> lastPlayerActivity = new ConcurrentHashMap<>();
    private static final long AFK_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes without activity = AFK
    
    // Accumulated synergy pool for distribution
    private int synergyDistributionPool = 0;
    
    // Common Pokémon for bounties (no legendaries/mythicals)
    private static final List<String> BOUNTY_POKEMON = Arrays.asList(
        "rattata", "pidgey", "caterpie", "weedle", "zubat", "geodude",
        "magikarp", "tentacool", "psyduck", "poliwag", "bellsprout",
        "oddish", "paras", "venonat", "diglett", "meowth", "mankey",
        "growlithe", "ponyta", "slowpoke", "magnemite", "doduo",
        "seel", "grimer", "shellder", "gastly", "drowzee", "krabby",
        "voltorb", "exeggcute", "cubone", "koffing", "rhyhorn",
        "horsea", "goldeen", "staryu", "hoothoot", "ledyba", "spinarak",
        "mareep", "marill", "hoppip", "sunkern", "wooper", "murkrow",
        "misdreavus", "girafarig", "pineco", "snubbull", "teddiursa",
        "slugma", "swinub", "remoraid", "houndour", "phanpy", "stantler",
        "zigzagoon", "wurmple", "lotad", "seedot", "taillow", "wingull",
        "ralts", "surskit", "shroomish", "slakoth", "nincada", "whismur",
        "makuhita", "skitty", "meditite", "electrike", "plusle", "minun",
        "volbeat", "illumise", "gulpin", "carvanha", "wailmer", "numel",
        "spoink", "spinda", "trapinch", "cacnea", "swablu", "barboach"
    );
    
    // Legendary and Mythical Pokémon list
    private static final Set<String> LEGENDARY_POKEMON = Set.of(
        // Gen 1
        "articuno", "zapdos", "moltres", "mewtwo", "mew",
        // Gen 2
        "raikou", "entei", "suicune", "lugia", "ho-oh", "celebi",
        // Gen 3
        "regirock", "regice", "registeel", "latias", "latios",
        "kyogre", "groudon", "rayquaza", "jirachi", "deoxys",
        // Gen 4
        "uxie", "mesprit", "azelf", "dialga", "palkia", "heatran",
        "regigigas", "giratina", "cresselia", "phione", "manaphy",
        "darkrai", "shaymin", "arceus",
        // Gen 5
        "victini", "cobalion", "terrakion", "virizion", "tornadus",
        "thundurus", "reshiram", "zekrom", "landorus", "kyurem",
        "keldeo", "meloetta", "genesect",
        // Gen 6
        "xerneas", "yveltal", "zygarde", "diancie", "hoopa", "volcanion",
        // Gen 7
        "type:null", "silvally", "tapukoko", "tapulele", "tapubulu", "tapufini",
        "cosmog", "cosmoem", "solgaleo", "lunala", "nihilego", "buzzwole",
        "pheromosa", "xurkitree", "celesteela", "kartana", "guzzlord",
        "necrozma", "magearna", "marshadow", "poipole", "naganadel",
        "stakataka", "blacephalon", "zeraora",
        // Gen 8
        "zacian", "zamazenta", "eternatus", "kubfu", "urshifu",
        "zarude", "regieleki", "regidrago", "glastrier", "spectrier",
        "calyrex",
        // Gen 9
        "koraidon", "miraidon", "tinglu", "chienpao", "wochien", "chiyu",
        "roaringmoon", "ironvaliant", "walkingwake", "ironleaves"
    );
    
    /**
     * Check if a species is legendary or mythical
     */
    private boolean isLegendary(String species) {
        return LEGENDARY_POKEMON.contains(species.toLowerCase());
    }
    
    public EconomyManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "Economy-Manager");
            t.setDaemon(true);
            return t;
        });
    }
    
    /**
     * Initialize the economy system
     */
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Economy system initializing...");
        
        // Register Cobblemon event listeners
        registerEventListeners();
        
        // Start playtime reward checker
        scheduler.scheduleAtFixedRate(
            this::checkPlaytimeRewards,
            60, // Initial delay 1 min
            60, // Check every minute
            TimeUnit.SECONDS
        );
        
        // Start synergy reward checker (every 5 minutes, checks if 2h passed)
        scheduler.scheduleAtFixedRate(
            this::checkSynergyRewards,
            2 * 60, // Initial delay 2 min
            5 * 60, // Check every 5 minutes
            TimeUnit.SECONDS
        );
        
        // Start activity tracker (updates last activity for non-AFK players)
        scheduler.scheduleAtFixedRate(
            this::trackPlayerActivity,
            30, // Initial delay 30s
            60, // Check every minute
            TimeUnit.SECONDS
        );
        
        // Distribute synergy pool to online players every 30 minutes
        scheduler.scheduleAtFixedRate(
            this::distributeSynergyPool,
            15 * 60, // Initial delay 15 min
            30 * 60, // Every 30 minutes
            TimeUnit.SECONDS
        );
        
        // Poll for pending economy syncs (web gacha purchases) every 5 seconds
        scheduler.scheduleAtFixedRate(
            this::pollPendingEconomySyncs,
            10, // Initial delay 10s
            5,  // Every 5 seconds
            TimeUnit.SECONDS
        );
        
        // Initialize bounties
        rotateBounties();
        
        logger.info("✓ Economy system initialized");
        logger.info("  - Capture rewards: " + CAPTURE_BASE + " CD base (+5k shiny, +15k legendary)");
        logger.info("  - Battle rewards: " + BATTLE_WIN_BASE + " CD base + " + BATTLE_WIN_PER_LEVEL + " per level");
        logger.info("  - Playtime rewards: " + PLAYTIME_REWARD + " CD every 30 min");
        logger.info("  - Daily rewards: " + DAILY_REWARDS[0] + "-" + DAILY_REWARDS[6] + " CD (7-day streak)");
        logger.info("  - Bounties: " + BOUNTY_COUNT + " active (" + BOUNTY_MIN_REWARD + "-" + BOUNTY_MAX_REWARD + " CD)");
        logger.info("  - Synergy rewards: Every 2h (accumulates offline, AFK penalty)");
        logger.info("  - Web sync polling: Every 5 seconds");
    }
    
    /**
     * Register Cobblemon event listeners for rewards
     */
    private void registerEventListeners() {
        // Player join event for daily rewards
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server1) -> {
            // Delay slightly to ensure player is fully loaded
            scheduler.schedule(() -> {
                server.execute(() -> onPlayerLogin(handler.getPlayer()));
            }, 2, TimeUnit.SECONDS);
        });
        
        // Capture event
        CobblemonEvents.POKEMON_CAPTURED.subscribe(com.cobblemon.mod.common.api.Priority.NORMAL, event -> {
            ServerPlayerEntity player = event.getPlayer();
            Pokemon pokemon = event.getPokemon();
            onPokemonCaptured(player, pokemon);
        });
        
        // Evolution event
        CobblemonEvents.EVOLUTION_COMPLETE.subscribe(com.cobblemon.mod.common.api.Priority.NORMAL, event -> {
            Pokemon pokemon = event.getPokemon();
            // Get owner if it's a player's pokemon
            UUID ownerUuid = pokemon.getOwnerUUID();
            if (ownerUuid != null) {
                ServerPlayerEntity player = server.getPlayerManager().getPlayer(ownerUuid);
                if (player != null) {
                    onPokemonEvolved(player, pokemon);
                }
            }
        });
        
        logger.info("  - Event listeners registered");
    }

    
    // ============================================
    // REWARD HANDLERS
    // ============================================
    
    /**
     * Handle Pokémon capture reward
     */
    private void onPokemonCaptured(ServerPlayerEntity player, Pokemon pokemon) {
        if (player == null || pokemon == null) return;
        
        UUID uuid = player.getUuid();
        String species = pokemon.getSpecies().getName().toLowerCase();
        int reward = CAPTURE_BASE;
        StringBuilder message = new StringBuilder("§a+").append(CAPTURE_BASE).append(" CD §7(captura)");
        
        // Shiny bonus
        if (pokemon.getShiny()) {
            reward += CAPTURE_SHINY_BONUS;
            message.append(" §e+").append(CAPTURE_SHINY_BONUS).append(" §7(shiny!)");
        }
        
        // Legendary bonus - check against known legendaries list
        if (isLegendary(species)) {
            reward += CAPTURE_LEGENDARY_BONUS;
            message.append(" §d+").append(CAPTURE_LEGENDARY_BONUS).append(" §7(legendario!)");
        }
        
        // First catch bonus (new species for player)
        PlayerEconomyData data = getPlayerData(uuid);
        if (!data.caughtSpecies.contains(species)) {
            data.caughtSpecies.add(species);
            reward += CAPTURE_FIRST_CATCH_BONUS;
            message.append(" §b+").append(CAPTURE_FIRST_CATCH_BONUS).append(" §7(nueva especie!)");
            
            // Register to backend for persistence
            registerCaughtSpeciesToBackend(uuid, species);
            
            // Check Pokédex milestones
            checkPokedexMilestones(player, data.caughtSpecies.size());
        }
        
        // Bounty check
        if (activeBounties.containsKey(species)) {
            int bountyReward = activeBounties.get(species);
            reward += bountyReward;
            message.append(" §6+").append(bountyReward).append(" §7(¡BOUNTY!)");
        }
        
        // Give reward
        giveReward(player, reward);
        player.sendMessage(Text.literal(message.toString()));
        
        logger.debug("Capture reward: " + player.getName().getString() + " got " + reward + " CD for " + species);
    }
    
    /**
     * Handle Pokémon evolution reward
     */
    private void onPokemonEvolved(ServerPlayerEntity player, Pokemon pokemon) {
        if (player == null || pokemon == null) return;
        
        giveReward(player, EVOLUTION_REWARD);
        player.sendMessage(Text.literal("§a+" + EVOLUTION_REWARD + " CD §7(evolución de " + pokemon.getSpecies().getName() + ")"));
        
        logger.debug("Evolution reward: " + player.getName().getString() + " got " + EVOLUTION_REWARD + " CD");
    }
    
    /**
     * Handle battle victory reward (called from BattleListener)
     */
    public void onBattleVictory(ServerPlayerEntity player, int enemyLevel, boolean isPvE) {
        if (player == null || !isPvE) return; // Only PvE rewards
        
        int reward = BATTLE_WIN_BASE + (enemyLevel * BATTLE_WIN_PER_LEVEL);
        giveReward(player, reward);
        player.sendMessage(Text.literal("§a+" + reward + " CD §7(victoria en batalla)"));
        
        logger.debug("Battle reward: " + player.getName().getString() + " got " + reward + " CD");
    }
    
    /**
     * Check and give Pokédex milestone rewards
     */
    private void checkPokedexMilestones(ServerPlayerEntity player, int speciesCount) {
        Integer reward = POKEDEX_MILESTONES.get(speciesCount);
        if (reward != null) {
            giveReward(player, reward);
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§6§l★ ¡MILESTONE POKÉDEX! ★"));
            player.sendMessage(Text.literal("§e" + speciesCount + " especies capturadas"));
            player.sendMessage(Text.literal("§a+" + reward + " CobbleDollars"));
            player.sendMessage(Text.literal(""));
            
            logger.info("Pokédex milestone: " + player.getName().getString() + " reached " + speciesCount + " species, got " + reward + " CD");
        }
    }
    
    /**
     * Check playtime rewards for all online players
     */
    private void checkPlaytimeRewards() {
        if (server == null) return;
        
        long now = System.currentTimeMillis();
        
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player == null || player.isDisconnected()) continue;
            
            UUID uuid = player.getUuid();
            Long lastReward = lastPlaytimeReward.get(uuid);
            
            if (lastReward == null) {
                // First time tracking this player
                lastPlaytimeReward.put(uuid, now);
                continue;
            }
            
            if (now - lastReward >= PLAYTIME_INTERVAL_MS) {
                // Give playtime reward
                giveReward(player, PLAYTIME_REWARD);
                player.sendMessage(Text.literal("§a+" + PLAYTIME_REWARD + " CD §7(30 min jugando)"));
                lastPlaytimeReward.put(uuid, now);
                
                logger.debug("Playtime reward: " + player.getName().getString() + " got " + PLAYTIME_REWARD + " CD");
            }
        }
    }
    
    /**
     * Handle daily login reward
     */
    public void onPlayerLogin(ServerPlayerEntity player) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        
        // Load economy data from backend (async)
        loadEconomyDataFromBackend(uuid);
        
        // SYNC BALANCE FROM BACKEND (for web gacha purchases)
        syncBalanceFromBackend(player);
        
        PlayerEconomyData data = getPlayerData(uuid);
        
        long now = System.currentTimeMillis();
        long dayMs = 24 * 60 * 60 * 1000;
        long lastLogin = data.lastDailyReward;
        
        // Check if it's a new day (reset at midnight-ish)
        long daysSinceLastReward = (now - lastLogin) / dayMs;
        
        if (daysSinceLastReward >= 1) {
            // Check streak
            if (daysSinceLastReward == 1) {
                // Consecutive day - increase streak
                data.dailyStreak = Math.min(data.dailyStreak + 1, 7);
            } else {
                // Streak broken - reset to day 1
                data.dailyStreak = 1;
            }
            
            // Give daily reward
            int rewardIndex = Math.min(data.dailyStreak - 1, DAILY_REWARDS.length - 1);
            int reward = DAILY_REWARDS[rewardIndex];
            
            data.lastDailyReward = now;
            
            // Save to backend
            saveDailyRewardToBackend(uuid, now, data.dailyStreak);
            
            // Delay the message slightly so player sees it after login
            scheduler.schedule(() -> {
                server.execute(() -> {
                    giveReward(player, reward);
                    player.sendMessage(Text.literal(""));
                    player.sendMessage(Text.literal("§6§l✦ RECOMPENSA DIARIA ✦"));
                    player.sendMessage(Text.literal("§eDía " + data.dailyStreak + " de racha"));
                    player.sendMessage(Text.literal("§a+" + reward + " CobbleDollars"));
                    if (data.dailyStreak < 7) {
                        int nextReward = DAILY_REWARDS[data.dailyStreak];
                        player.sendMessage(Text.literal("§7Mañana: " + nextReward + " CD"));
                    } else {
                        player.sendMessage(Text.literal("§d¡Racha máxima alcanzada!"));
                    }
                    player.sendMessage(Text.literal(""));
                });
            }, 3, TimeUnit.SECONDS);
            
            logger.info("Daily reward: " + player.getName().getString() + " day " + data.dailyStreak + ", got " + reward + " CD");
        }
        
        // Reset playtime tracking
        lastPlaytimeReward.put(uuid, now);
    }
    
    // ============================================
    // BACKEND PERSISTENCE
    // ============================================
    
    /**
     * Load economy data from backend (async)
     */
    private void loadEconomyDataFromBackend(UUID uuid) {
        httpClient.getAsync("/api/players/economy/" + uuid.toString())
            .thenAccept(response -> {
                if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                    PlayerEconomyData data = getPlayerData(uuid);
                    
                    // Load synergy timestamp
                    if (response.has("lastSynergyReward") && !response.get("lastSynergyReward").isJsonNull()) {
                        String timestamp = response.get("lastSynergyReward").getAsString();
                        data.lastSynergyReward = Instant.parse(timestamp).toEpochMilli();
                    }
                    
                    // Load daily reward data
                    if (response.has("lastDailyReward") && !response.get("lastDailyReward").isJsonNull()) {
                        String timestamp = response.get("lastDailyReward").getAsString();
                        data.lastDailyReward = Instant.parse(timestamp).toEpochMilli();
                    }
                    
                    if (response.has("dailyStreak")) {
                        data.dailyStreak = response.get("dailyStreak").getAsInt();
                    }
                    
                    // Load caught species
                    if (response.has("caughtSpecies") && response.get("caughtSpecies").isJsonArray()) {
                        data.caughtSpecies.clear();
                        response.get("caughtSpecies").getAsJsonArray().forEach(element -> {
                            data.caughtSpecies.add(element.getAsString());
                        });
                    }
                    
                    logger.debug("Loaded economy data for " + uuid + " from backend");
                }
            })
            .exceptionally(ex -> {
                logger.debug("Could not load economy data from backend: " + ex.getMessage());
                return null;
            });
    }
    
    /**
     * Sync player balance from backend (for web purchases like gacha)
     * This ensures the in-game balance matches the backend after web transactions
     */
    private void syncBalanceFromBackend(ServerPlayerEntity player) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        String playerName = player.getName().getString();
        
        httpClient.getAsync("/api/economy/balance/" + uuid.toString())
            .thenAccept(response -> {
                if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                    int backendBalance = response.has("balance") ? response.get("balance").getAsInt() : 0;
                    
                    // Use cobbledollars set command to sync the balance
                    server.execute(() -> {
                        String command = "cobbledollars set " + playerName + " " + backendBalance;
                        server.getCommandManager().executeWithPrefix(
                            server.getCommandSource().withSilent(),
                            command
                        );
                        logger.info("Synced balance for " + playerName + " from backend: " + backendBalance + " CD");
                    });
                }
            })
            .exceptionally(ex -> {
                logger.debug("Could not sync balance from backend: " + ex.getMessage());
                return null;
            });
    }
    
    /**
     * Poll for pending economy syncs from web (gacha purchases)
     * This runs every 5 seconds to check if any player made a web purchase
     */
    private void pollPendingEconomySyncs() {
        if (server == null) return;
        
        // Check for each online player
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player == null || player.isDisconnected()) continue;
            
            UUID uuid = player.getUuid();
            String playerName = player.getName().getString();
            
            httpClient.getAsync("/api/economy/pending-sync/" + uuid.toString())
                .thenAccept(response -> {
                    if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                        if (response.has("pending") && response.get("pending").isJsonArray()) {
                            var pendingArray = response.get("pending").getAsJsonArray();
                            
                            for (var element : pendingArray) {
                                var pending = element.getAsJsonObject();
                                
                                // Parse _id - can be string or object with $oid
                                String id;
                                var idElement = pending.get("_id");
                                if (idElement.isJsonObject()) {
                                    // MongoDB extended JSON format: { "$oid": "..." }
                                    id = idElement.getAsJsonObject().get("$oid").getAsString();
                                } else {
                                    // Direct string format
                                    id = idElement.getAsString();
                                }
                                
                                String type = pending.get("type").getAsString();
                                int amount = pending.get("amount").getAsInt();
                                String reason = pending.has("reason") ? pending.get("reason").getAsString() : "Web transaction";
                                
                                // Execute the transaction in-game
                                server.execute(() -> {
                                    String command;
                                    if ("remove".equals(type)) {
                                        command = "cobbledollars remove " + playerName + " " + amount;
                                        player.sendMessage(Text.literal("§c-" + amount + " CD §7(" + reason + ")"));
                                    } else if ("add".equals(type)) {
                                        command = "cobbledollars give " + playerName + " " + amount;
                                        player.sendMessage(Text.literal("§a+" + amount + " CD §7(" + reason + ")"));
                                    } else {
                                        return;
                                    }
                                    
                                    server.getCommandManager().executeWithPrefix(
                                        server.getCommandSource().withSilent(),
                                        command
                                    );
                                    
                                    logger.info("[ECONOMY SYNC] " + type + " " + amount + " CD for " + playerName + " (" + reason + ")");
                                    
                                    // Confirm the sync
                                    confirmPendingSync(id);
                                });
                            }
                        }
                    }
                })
                .exceptionally(ex -> {
                    // Silent fail - don't spam logs
                    return null;
                });
        }
    }
    
    /**
     * Confirm that a pending sync has been processed
     */
    private void confirmPendingSync(String syncId) {
        httpClient.postAsync("/api/economy/confirm-sync/" + syncId, new JsonObject())
            .exceptionally(ex -> {
                logger.error("Failed to confirm sync " + syncId + ": " + ex.getMessage());
                return null;
            });
    }
    
    /**
     * Save synergy reward timestamp to backend
     */
    private void saveSynergyRewardToBackend(UUID uuid, long timestamp) {
        JsonObject body = new JsonObject();
        body.addProperty("uuid", uuid.toString());
        body.addProperty("timestamp", Instant.ofEpochMilli(timestamp).toString());
        
        httpClient.postAsync("/api/players/economy/synergy", body)
            .thenAccept(response -> {
                logger.debug("Saved synergy reward for " + uuid + " to backend");
            })
            .exceptionally(ex -> {
                logger.error("Failed to save synergy reward to backend: " + ex.getMessage());
                return null;
            });
    }
    
    /**
     * Save daily reward data to backend
     */
    private void saveDailyRewardToBackend(UUID uuid, long timestamp, int streak) {
        JsonObject body = new JsonObject();
        body.addProperty("uuid", uuid.toString());
        body.addProperty("timestamp", Instant.ofEpochMilli(timestamp).toString());
        body.addProperty("streak", streak);
        
        httpClient.postAsync("/api/players/economy/daily", body)
            .thenAccept(response -> {
                logger.debug("Saved daily reward for " + uuid + " to backend");
            })
            .exceptionally(ex -> {
                logger.error("Failed to save daily reward to backend: " + ex.getMessage());
                return null;
            });
    }
    
    /**
     * Register caught species to backend
     */
    private void registerCaughtSpeciesToBackend(UUID uuid, String species) {
        JsonObject body = new JsonObject();
        body.addProperty("uuid", uuid.toString());
        body.addProperty("species", species);
        
        httpClient.postAsync("/api/players/economy/species", body)
            .exceptionally(ex -> {
                logger.debug("Failed to register species to backend: " + ex.getMessage());
                return null;
            });
    }
    
    // ============================================
    // BOUNTY SYSTEM
    // ============================================
    
    /**
     * Rotate bounties every 6 hours
     */
    private void rotateBounties() {
        long now = System.currentTimeMillis();
        
        if (now - lastBountyRotation < BOUNTY_ROTATION_MS && !activeBounties.isEmpty()) {
            return; // Not time to rotate yet
        }
        
        activeBounties.clear();
        Random random = new Random();
        List<String> available = new ArrayList<>(BOUNTY_POKEMON);
        Collections.shuffle(available);
        
        for (int i = 0; i < BOUNTY_COUNT && i < available.size(); i++) {
            String species = available.get(i);
            int reward = BOUNTY_MIN_REWARD + random.nextInt(BOUNTY_MAX_REWARD - BOUNTY_MIN_REWARD + 1);
            // Round to nearest 50
            reward = (reward / 50) * 50;
            activeBounties.put(species, reward);
        }
        
        lastBountyRotation = now;
        logger.info("Bounties rotated: " + activeBounties);
    }
    
    /**
     * Get active bounties for display
     */
    public Map<String, Integer> getActiveBounties() {
        rotateBounties(); // Check if rotation needed
        return new HashMap<>(activeBounties);
    }
    
    /**
     * Handle /bounties command
     */
    public void showBounties(ServerPlayerEntity player) {
        if (player == null) return;
        
        rotateBounties();
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§6§l🎯 BOUNTIES ACTIVOS"));
        player.sendMessage(Text.literal("§7Captura estos Pokémon para bonus:"));
        player.sendMessage(Text.literal(""));
        
        for (Map.Entry<String, Integer> entry : activeBounties.entrySet()) {
            String species = entry.getKey();
            int reward = entry.getValue();
            String displayName = species.substring(0, 1).toUpperCase() + species.substring(1);
            player.sendMessage(Text.literal("§e• " + displayName + " §7- §a+" + reward + " CD"));
        }
        
        player.sendMessage(Text.literal(""));
        long timeLeft = BOUNTY_ROTATION_MS - (System.currentTimeMillis() - lastBountyRotation);
        int hoursLeft = (int) (timeLeft / (60 * 60 * 1000));
        int minsLeft = (int) ((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        player.sendMessage(Text.literal("§7Rotan en: " + hoursLeft + "h " + minsLeft + "m"));
        player.sendMessage(Text.literal(""));
    }
    
    // ============================================
    // TEAM SYNERGY REWARD SYSTEM
    // ============================================
    
    /**
     * Track player activity to detect AFK
     * Called every minute to update activity timestamps
     */
    private void trackPlayerActivity() {
        if (server == null) return;
        
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player == null || player.isDisconnected()) continue;
            
            // Check if player has moved or done something recently
            // We track this by checking if they're not standing still
            // For simplicity, we update activity on any online player who isn't sneaking/still
            UUID uuid = player.getUuid();
            
            // Update activity if player is moving or has velocity
            if (player.getVelocity().lengthSquared() > 0.001 || !player.isSneaking()) {
                lastPlayerActivity.put(uuid, System.currentTimeMillis());
            }
        }
    }
    
    /**
     * Check if player is AFK (no activity in last 10 minutes)
     */
    private boolean isPlayerAFK(UUID uuid) {
        Long lastActivity = lastPlayerActivity.get(uuid);
        if (lastActivity == null) return true; // No activity recorded = AFK
        return System.currentTimeMillis() - lastActivity > AFK_THRESHOLD_MS;
    }
    
    /**
     * Distribute accumulated synergy pool to online active players
     */
    private void distributeSynergyPool() {
        if (server == null || synergyDistributionPool <= 0) return;
        
        // Get active (non-AFK) online players
        List<ServerPlayerEntity> activePlayers = new ArrayList<>();
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player != null && !player.isDisconnected() && !isPlayerAFK(player.getUuid())) {
                activePlayers.add(player);
            }
        }
        
        if (activePlayers.isEmpty()) {
            logger.debug("No active players to distribute synergy pool of " + synergyDistributionPool + " CD");
            return;
        }
        
        // Distribute evenly
        int perPlayer = synergyDistributionPool / activePlayers.size();
        if (perPlayer < 10) return; // Don't bother with tiny amounts
        
        int distributed = 0;
        for (ServerPlayerEntity player : activePlayers) {
            giveReward(player, perPlayer);
            player.sendMessage(Text.literal("§d+§f" + perPlayer + " CD §7(impuesto de sinergia redistribuido)"));
            distributed += perPlayer;
        }
        
        logger.info("Distributed " + distributed + " CD from synergy pool to " + activePlayers.size() + " active players");
        synergyDistributionPool = 0; // Reset pool
    }
    
    /**
     * Check synergy rewards for all online players (every 2 hours - ACCUMULATES)
     * ONLY counts PARTY Pokémon - prevents PC exploit
     * 
     * ACCUMULATES while offline! If player was offline for 6 hours, they get 3 rewards.
     * AFK penalty: If player was AFK, they get reduced reward:
     * - 40% of penalty goes as XP to lowest level Pokémon (respecting level cap)
     * - 60% of penalty goes to distribution pool for active players
     */
    private void checkSynergyRewards() {
        if (server == null) return;
        
        long now = System.currentTimeMillis();
        
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player == null || player.isDisconnected()) continue;
            
            UUID uuid = player.getUuid();
            PlayerEconomyData data = getPlayerData(uuid);
            
            // Initialize timestamp if first time
            if (data.lastSynergyReward == 0) {
                data.lastSynergyReward = now;
                logger.debug("Synergy timer started for " + player.getName().getString());
                continue;
            }
            
            // Calculate how many 2-hour periods have passed (ACCUMULATES!)
            long timeSinceLastReward = now - data.lastSynergyReward;
            int periodsAccumulated = (int) (timeSinceLastReward / SYNERGY_REWARD_INTERVAL_MS);
            
            if (periodsAccumulated < 1) continue;
            
            // Calculate synergy reward
            try {
                SynergyRewardResult result = calculateSynergyReward(player);
                
                if (result.reward <= 0) {
                    // Not enough Pokémon in party
                    data.lastSynergyReward = now;
                    continue;
                }
                
                // Total accumulated reward
                int totalBaseReward = result.reward * periodsAccumulated;
                
                // Check if player is AFK - apply penalty
                boolean isAFK = isPlayerAFK(uuid);
                int finalReward = totalBaseReward;
                int penaltyAmount = 0;
                int xpGiven = 0;
                int distributedAmount = 0;
                
                if (isAFK) {
                    // Apply 40% penalty
                    penaltyAmount = (int) (totalBaseReward * AFK_PENALTY_PERCENT);
                    finalReward = totalBaseReward - penaltyAmount;
                    
                    // Split penalty: 40% to XP, 60% to distribution pool
                    int xpPortion = (int) (penaltyAmount * XP_CONVERSION_PERCENT);
                    distributedAmount = penaltyAmount - xpPortion;
                    
                    // Give XP to lowest level Pokémon (respecting level cap)
                    xpGiven = giveXPToLowestPokemon(player, xpPortion);
                    
                    // Add rest to distribution pool
                    synergyDistributionPool += distributedAmount;
                }
                
                // Give the reward
                giveReward(player, finalReward);
                data.lastSynergyReward = now;
                
                // Save to backend for persistence
                saveSynergyRewardToBackend(uuid, now);
                
                // Send detailed message
                player.sendMessage(Text.literal(""));
                player.sendMessage(Text.literal("§d§l⚡ RECOMPENSA DE SINERGIA ⚡"));
                
                if (periodsAccumulated > 1) {
                    player.sendMessage(Text.literal("§7Acumulado: §e" + periodsAccumulated + " periodos §7(cada 2h)"));
                }
                
                player.sendMessage(Text.literal(""));
                player.sendMessage(Text.literal("§e📊 Desglose por periodo:"));
                player.sendMessage(Text.literal("§7  Base: §a+" + SYNERGY_BASE_REWARD + " CD"));
                if (result.ppBonus > 0) {
                    player.sendMessage(Text.literal("§7  Pitufipuntos (prom " + result.avgPitufipuntos + "): §a+" + result.ppBonus + " CD"));
                }
                if (result.fullTeamBonus > 0) {
                    player.sendMessage(Text.literal("§7  Equipo completo (6/6): §a+" + result.fullTeamBonus + " CD"));
                }
                if (result.typeDiversityBonus > 0) {
                    player.sendMessage(Text.literal("§7  Diversidad de tipos (" + result.uniqueTypes + "): §a+" + result.typeDiversityBonus + " CD"));
                }
                if (result.shinyBonus > 0) {
                    player.sendMessage(Text.literal("§e  Shinies (" + result.shinyCount + "): §a+" + result.shinyBonus + " CD"));
                }
                if (result.legendaryBonus > 0) {
                    player.sendMessage(Text.literal("§d  Legendarios (" + result.legendaryCount + "): §a+" + result.legendaryBonus + " CD"));
                }
                
                if (isAFK) {
                    player.sendMessage(Text.literal(""));
                    player.sendMessage(Text.literal("§c⚠ Penalización AFK (-" + (int)(AFK_PENALTY_PERCENT * 100) + "%):"));
                    player.sendMessage(Text.literal("§7  Penalizado: §c-" + penaltyAmount + " CD"));
                    if (xpGiven > 0) {
                        player.sendMessage(Text.literal("§7  → §b" + xpGiven + " XP §7a tu Pokémon más débil"));
                    }
                    player.sendMessage(Text.literal("§7  → §e" + distributedAmount + " CD §7redistribuido a jugadores activos"));
                }
                
                player.sendMessage(Text.literal(""));
                player.sendMessage(Text.literal("§a§l  TOTAL RECIBIDO: +" + finalReward + " CobbleDollars"));
                player.sendMessage(Text.literal("§7  Próxima recompensa en 2 horas"));
                player.sendMessage(Text.literal(""));
                
                logger.info("Synergy reward: " + player.getName().getString() + " got " + finalReward + " CD" +
                    (isAFK ? " (AFK penalty: -" + penaltyAmount + ", XP: " + xpGiven + ")" : "") +
                    " (periods: " + periodsAccumulated + ", party: " + result.partySize + ")");
                
            } catch (Exception e) {
                logger.error("Error calculating synergy reward for " + player.getName().getString() + ": " + e.getMessage());
            }
        }
    }
    
    /**
     * Give XP to the lowest level Pokémon in player's party
     * Respects level cap - won't give XP if at or above cap
     * @return actual XP given
     */
    private int giveXPToLowestPokemon(ServerPlayerEntity player, int cdAmount) {
        if (player == null || cdAmount <= 0) return 0;
        
        try {
            PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
            if (party == null) return 0;
            
            // Find lowest level Pokémon
            Pokemon lowestPokemon = null;
            int lowestLevel = Integer.MAX_VALUE;
            
            for (int i = 0; i < 6; i++) {
                Pokemon pokemon = party.get(i);
                if (pokemon != null && pokemon.getLevel() < lowestLevel) {
                    lowestLevel = pokemon.getLevel();
                    lowestPokemon = pokemon;
                }
            }
            
            if (lowestPokemon == null) return 0;
            
            // Get level cap (default 100 if not available)
            int levelCap = 100; // Default
            // Note: We can't easily access LevelCapManager from here, so use a safe default
            // The EXPERIENCE_GAINED_EVENT_PRE will block XP if over cap anyway
            
            // Don't give XP if already at cap
            if (lowestLevel >= levelCap) {
                return 0;
            }
            
            // Convert CD to XP
            int xpToGive = cdAmount * XP_PER_CD;
            
            // Give XP to the Pokémon by adding to current experience
            // Use setExperienceAndUpdateLevel which handles level ups properly
            int currentExp = lowestPokemon.getExperience();
            lowestPokemon.setExperienceAndUpdateLevel(currentExp + xpToGive);
            
            String pokemonName = lowestPokemon.getSpecies().getName();
            player.sendMessage(Text.literal("§b✨ " + pokemonName + " §7recibió §b" + xpToGive + " XP §7(nivel " + lowestLevel + ")"));
            
            return xpToGive;
            
        } catch (Exception e) {
            logger.error("Error giving XP to lowest pokemon: " + e.getMessage());
            return 0;
        }
    }
    
    /**
     * Calculate synergy reward for a player based on their PARTY only
     */
    private SynergyRewardResult calculateSynergyReward(ServerPlayerEntity player) {
        SynergyRewardResult result = new SynergyRewardResult();
        
        // Get player's party (NOT PC)
        PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
        if (party == null) return result;
        
        // Collect party Pokémon
        List<Pokemon> partyPokemon = new ArrayList<>();
        Set<String> types = new HashSet<>();
        int totalPitufipuntos = 0;
        int shinyCount = 0;
        int legendaryCount = 0;
        
        for (int i = 0; i < 6; i++) {
            Pokemon pokemon = party.get(i);
            if (pokemon != null) {
                partyPokemon.add(pokemon);
                
                // Calculate Pitufipuntos for this Pokémon
                int pp = calculatePitufipuntos(pokemon);
                totalPitufipuntos += pp;
                
                // Track types
                pokemon.getSpecies().getTypes().forEach(type -> 
                    types.add(type.getName().toLowerCase())
                );
                
                // Track shinies and legendaries
                if (pokemon.getShiny()) shinyCount++;
                if (isLegendary(pokemon.getSpecies().getName())) legendaryCount++;
            }
        }
        
        result.partySize = partyPokemon.size();
        result.shinyCount = shinyCount;
        result.legendaryCount = legendaryCount;
        result.uniqueTypes = types.size();
        
        // Minimum 3 Pokémon to qualify
        if (result.partySize < SYNERGY_MIN_PARTY_SIZE) {
            return result; // No reward
        }
        
        // Calculate average Pitufipuntos
        result.avgPitufipuntos = totalPitufipuntos / result.partySize;
        
        // Base reward
        result.reward = SYNERGY_BASE_REWARD;
        
        // Pitufipuntos bonus (capped to prevent exploit)
        // Average PP * multiplier, capped at max
        result.ppBonus = Math.min(result.avgPitufipuntos * SYNERGY_PER_AVG_PP, SYNERGY_MAX_PP_BONUS);
        result.reward += result.ppBonus;
        
        // Full team bonus (6 Pokémon)
        if (result.partySize == 6) {
            result.fullTeamBonus = SYNERGY_FULL_TEAM_BONUS;
            result.reward += result.fullTeamBonus;
        }
        
        // Type diversity bonus (max 10 types = 5000 CD)
        result.typeDiversityBonus = Math.min(result.uniqueTypes * SYNERGY_TYPE_DIVERSITY_BONUS, 5000);
        result.reward += result.typeDiversityBonus;
        
        // Shiny bonus
        result.shinyBonus = shinyCount * SYNERGY_SHINY_BONUS;
        result.reward += result.shinyBonus;
        
        // Legendary bonus
        result.legendaryBonus = legendaryCount * SYNERGY_LEGENDARY_BONUS;
        result.reward += result.legendaryBonus;
        
        return result;
    }
    
    /**
     * Calculate Pitufipuntos for a single Pokémon
     * Simplified version of the backend calculation
     */
    private int calculatePitufipuntos(Pokemon pokemon) {
        int pp = 0;
        
        // Base stat estimate (400 for average Pokémon)
        pp += 400;
        
        // IV bonus: IVTotal * 2
        var ivs = pokemon.getIvs();
        int ivTotal = ivs.get(Stats.HP) + ivs.get(Stats.ATTACK) + ivs.get(Stats.DEFENCE) +
                      ivs.get(Stats.SPECIAL_ATTACK) + ivs.get(Stats.SPECIAL_DEFENCE) + ivs.get(Stats.SPEED);
        pp += ivTotal * 2;
        
        // EV bonus: EVTotal / 4
        var evs = pokemon.getEvs();
        int evTotal = evs.get(Stats.HP) + evs.get(Stats.ATTACK) + evs.get(Stats.DEFENCE) +
                      evs.get(Stats.SPECIAL_ATTACK) + evs.get(Stats.SPECIAL_DEFENCE) + evs.get(Stats.SPEED);
        pp += evTotal / 4;
        
        // Level bonus: level * 5
        pp += pokemon.getLevel() * 5;
        
        // Shiny bonus
        if (pokemon.getShiny()) pp += 200;
        
        // Legendary bonus
        if (isLegendary(pokemon.getSpecies().getName())) pp += 300;
        
        return pp;
    }
    
    /**
     * Result of synergy reward calculation
     */
    private static class SynergyRewardResult {
        int reward = 0;
        int partySize = 0;
        int avgPitufipuntos = 0;
        int ppBonus = 0;
        int fullTeamBonus = 0;
        int typeDiversityBonus = 0;
        int shinyBonus = 0;
        int legendaryBonus = 0;
        int uniqueTypes = 0;
        int shinyCount = 0;
        int legendaryCount = 0;
    }
    
    /**
     * Handle /sinergia command - show synergy info
     */
    public void showSynergyInfo(ServerPlayerEntity player) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        SynergyRewardResult result = calculateSynergyReward(player);
        PlayerEconomyData data = getPlayerData(uuid);
        boolean isAFK = isPlayerAFK(uuid);
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§d§l⚡ SINERGIA DE EQUIPO"));
        player.sendMessage(Text.literal("§7Gana CD cada 2 horas basado en tu party"));
        player.sendMessage(Text.literal("§7(¡Se acumula mientras estás offline!)"));
        player.sendMessage(Text.literal(""));
        
        if (result.partySize < SYNERGY_MIN_PARTY_SIZE) {
            player.sendMessage(Text.literal("§c⚠ Necesitas mínimo " + SYNERGY_MIN_PARTY_SIZE + " Pokémon en tu party"));
            player.sendMessage(Text.literal("§7Actualmente tienes: " + result.partySize));
        } else {
            player.sendMessage(Text.literal("§e📊 Tu equipo actual:"));
            player.sendMessage(Text.literal("§7  Pokémon en party: §f" + result.partySize + "/6"));
            player.sendMessage(Text.literal("§7  Pitufipuntos promedio: §f" + result.avgPitufipuntos));
            player.sendMessage(Text.literal("§7  Tipos únicos: §f" + result.uniqueTypes));
            if (result.shinyCount > 0) {
                player.sendMessage(Text.literal("§e  Shinies: §f" + result.shinyCount));
            }
            if (result.legendaryCount > 0) {
                player.sendMessage(Text.literal("§d  Legendarios: §f" + result.legendaryCount));
            }
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§a  Recompensa por periodo: §f~" + result.reward + " CD"));
            
            // AFK status
            if (isAFK) {
                int penalty = (int) (result.reward * AFK_PENALTY_PERCENT);
                player.sendMessage(Text.literal("§c  ⚠ Estado: AFK §7(-" + penalty + " CD penalización)"));
                player.sendMessage(Text.literal("§7  Muévete para evitar la penalización"));
            } else {
                player.sendMessage(Text.literal("§a  ✓ Estado: Activo §7(sin penalización)"));
            }
        }
        
        // Time until next reward
        if (data.lastSynergyReward > 0) {
            long timeSinceLastReward = System.currentTimeMillis() - data.lastSynergyReward;
            int periodsAccumulated = (int) (timeSinceLastReward / SYNERGY_REWARD_INTERVAL_MS);
            long timeInCurrentPeriod = timeSinceLastReward % SYNERGY_REWARD_INTERVAL_MS;
            long timeLeft = SYNERGY_REWARD_INTERVAL_MS - timeInCurrentPeriod;
            
            int hoursLeft = (int) (timeLeft / (60 * 60 * 1000));
            int minsLeft = (int) ((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            player.sendMessage(Text.literal(""));
            if (periodsAccumulated > 0) {
                int accumulated = result.reward * periodsAccumulated;
                player.sendMessage(Text.literal("§6  ¡Tienes " + periodsAccumulated + " periodo(s) acumulado(s)!"));
                player.sendMessage(Text.literal("§a  Total pendiente: ~" + accumulated + " CD"));
            }
            player.sendMessage(Text.literal("§7  Próximo periodo en: " + hoursLeft + "h " + minsLeft + "m"));
        } else {
            player.sendMessage(Text.literal("§a  ¡Primera recompensa en ~2h!"));
        }
        
        // Distribution pool info
        if (synergyDistributionPool > 0) {
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§e  Pool de redistribución: §f" + synergyDistributionPool + " CD"));
            player.sendMessage(Text.literal("§7  (Se reparte cada 30 min a jugadores activos)"));
        }
        
        player.sendMessage(Text.literal(""));
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    /**
     * Give CobbleDollars reward to player using command
     */
    private void giveReward(ServerPlayerEntity player, int amount) {
        if (player == null || amount <= 0) return;
        
        String command = "cobbledollars give " + player.getName().getString() + " " + amount;
        server.getCommandManager().executeWithPrefix(
            server.getCommandSource().withSilent(),
            command
        );
    }
    
    /**
     * Get or create player economy data
     */
    private PlayerEconomyData getPlayerData(UUID uuid) {
        return playerData.computeIfAbsent(uuid, k -> new PlayerEconomyData());
    }
    
    /**
     * Shutdown the economy system
     */
    public void shutdown() {
        logger.info("Economy system shutting down...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
        logger.info("✓ Economy system shutdown complete");
    }
    
    /**
     * Player economy data storage
     */
    private static class PlayerEconomyData {
        Set<String> caughtSpecies = ConcurrentHashMap.newKeySet();
        int dailyStreak = 0;
        long lastDailyReward = 0;
        long lastSynergyReward = 0; // Tracks ONLINE time for synergy rewards
        Map<String, Integer> questProgress = new ConcurrentHashMap<>();
    }
}
