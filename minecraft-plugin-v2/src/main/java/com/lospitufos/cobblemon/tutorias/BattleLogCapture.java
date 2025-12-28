package com.lospitufos.cobblemon.tutorias;

import com.cobblemon.mod.common.api.battles.model.PokemonBattle;
import com.cobblemon.mod.common.api.battles.model.actor.BattleActor;
import com.cobblemon.mod.common.api.events.CobblemonEvents;
import com.cobblemon.mod.common.battles.actor.PlayerBattleActor;
import com.cobblemon.mod.common.battles.pokemon.BattlePokemon;
import com.cobblemon.mod.common.pokemon.Pokemon;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;

import java.util.*;
import java.util.concurrent.*;

/**
 * Captures detailed battle data for AI analysis in the Tutorías system.
 * 
 * Features:
 * - Captures battle start/end events
 * - Records each turn's moves and damage
 * - Tracks Pokemon switches and faints
 * - Sends complete battle logs to backend for AI analysis
 * - Supports both PvP and PvE battles
 */
public class BattleLogCapture {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private MinecraftServer server;
    
    // Track active battles with their logs
    private final Map<UUID, BattleLog> activeBattles = new ConcurrentHashMap<>();
    
    // Executor for async HTTP calls
    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    
    public BattleLogCapture(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
    }
    
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("[TUTORIAS] ========================================");
        logger.info("[TUTORIAS] BattleLogCapture initializing...");
        logger.info("[TUTORIAS] Server: " + (server != null ? "OK" : "NULL"));
        
        // Register Cobblemon battle events
        registerBattleEvents();
        
        logger.info("[TUTORIAS] BattleLogCapture initialized - capturing all PvP battles");
        logger.info("[TUTORIAS] ========================================");
    }
    
    private void registerBattleEvents() {
        logger.info("[TUTORIAS] Registering Cobblemon battle events...");
        
        // Battle Started Event - use LOWEST priority to run after tournament system
        CobblemonEvents.BATTLE_STARTED_PRE.subscribe(com.cobblemon.mod.common.api.Priority.LOWEST, event -> {
            logger.info("[TUTORIAS] BATTLE_STARTED_PRE event received!");
            try {
                onBattleStart(event.getBattle());
            } catch (Exception e) {
                logger.error("[TUTORIAS] Error handling battle start: " + e.getMessage());
                e.printStackTrace();
            }
            return kotlin.Unit.INSTANCE;
        });
        
        // Battle Victory Event - use LOWEST priority to run after tournament system
        CobblemonEvents.BATTLE_VICTORY.subscribe(com.cobblemon.mod.common.api.Priority.LOWEST, event -> {
            logger.info("[TUTORIAS] BATTLE_VICTORY event received!");
            try {
                onBattleVictory(event.getBattle(), event.getWinners(), event.getLosers());
            } catch (Exception e) {
                logger.error("[TUTORIAS] Error handling battle victory: " + e.getMessage());
                e.printStackTrace();
            }
            return kotlin.Unit.INSTANCE;
        });
        
        // Battle Fled Event (forfeit) - use LOWEST priority
        CobblemonEvents.BATTLE_FLED.subscribe(com.cobblemon.mod.common.api.Priority.LOWEST, event -> {
            logger.info("[TUTORIAS] BATTLE_FLED event received!");
            try {
                PlayerBattleActor fleeingActor = event.getPlayer();
                if (fleeingActor != null) {
                    onBattleFled(event.getBattle(), fleeingActor.getUuid());
                }
            } catch (Exception e) {
                logger.error("[TUTORIAS] Error handling battle fled: " + e.getMessage());
                e.printStackTrace();
            }
            return kotlin.Unit.INSTANCE;
        });
        
        logger.info("[TUTORIAS] Battle events registered successfully!");
    }
    
    /**
     * Handle battle start - create a new battle log
     */
    private void onBattleStart(PokemonBattle battle) {
        if (battle == null) {
            logger.warn("[TUTORIAS] onBattleStart: battle is null!");
            return;
        }
        
        UUID battleId = battle.getBattleId();
        logger.info("[TUTORIAS] Processing battle start: " + battleId);
        
        List<PlayerInfo> players = new ArrayList<>();
        int actorCount = 0;
        int playerActorCount = 0;
        
        for (BattleActor actor : battle.getActors()) {
            actorCount++;
            logger.info("[TUTORIAS] Actor " + actorCount + ": " + actor.getClass().getSimpleName());
            
            if (actor instanceof PlayerBattleActor) {
                playerActorCount++;
                PlayerBattleActor playerActor = (PlayerBattleActor) actor;
                UUID playerUuid = playerActor.getUuid();
                
                logger.info("[TUTORIAS] Found player actor: " + playerUuid);
                
                PlayerInfo info = new PlayerInfo();
                info.uuid = playerUuid;
                info.discordId = getDiscordId(playerUuid);
                info.team = extractTeamData(playerActor);
                players.add(info);
            }
        }
        
        logger.info("[TUTORIAS] Battle has " + actorCount + " actors, " + playerActorCount + " are players");
        
        // Only track PvP battles with exactly 2 players
        if (playerActorCount != 2) {
            logger.info("[TUTORIAS] Skipping battle - not a 2-player PvP (has " + playerActorCount + " players)");
            return;
        }
        
        // Create battle log
        BattleLog log = new BattleLog();
        log.battleId = battleId;
        log.internalId = UUID.randomUUID();
        log.startTime = System.currentTimeMillis();
        log.player1 = players.get(0);
        log.player2 = players.get(1);
        log.turns = new ArrayList<>();
        log.currentTurn = 1;
        
        activeBattles.put(battleId, log);
        
        logger.info("[TUTORIAS] ✓ Started tracking PvP battle: " + battleId + 
                   " between " + log.player1.uuid + " and " + log.player2.uuid);
    }

    
    /**
     * Handle battle victory - finalize and send battle log
     */
    private void onBattleVictory(PokemonBattle battle, List<BattleActor> winners, List<BattleActor> losers) {
        if (battle == null) {
            logger.warn("[TUTORIAS] onBattleVictory: battle is null!");
            return;
        }
        
        UUID battleId = battle.getBattleId();
        logger.info("[TUTORIAS] Processing battle victory: " + battleId);
        logger.info("[TUTORIAS] Active battles tracked: " + activeBattles.size());
        
        BattleLog log = activeBattles.remove(battleId);
        
        if (log == null) {
            logger.info("[TUTORIAS] Battle victory for untracked battle: " + battleId + " (this is normal for non-PvP battles)");
            return;
        }
        
        // Determine winner and loser
        UUID winnerUuid = null;
        UUID loserUuid = null;
        
        for (BattleActor actor : winners) {
            if (actor instanceof PlayerBattleActor) {
                winnerUuid = ((PlayerBattleActor) actor).getUuid();
                logger.info("[TUTORIAS] Winner: " + winnerUuid);
                break;
            }
        }
        
        for (BattleActor actor : losers) {
            if (actor instanceof PlayerBattleActor) {
                loserUuid = ((PlayerBattleActor) actor).getUuid();
                logger.info("[TUTORIAS] Loser: " + loserUuid);
                break;
            }
        }
        
        if (winnerUuid == null || loserUuid == null) {
            logger.warn("[TUTORIAS] Could not determine winner/loser for battle: " + battleId);
            return;
        }
        
        // Finalize log
        log.endTime = System.currentTimeMillis();
        log.winnerUuid = winnerUuid;
        log.loserUuid = loserUuid;
        log.result = "KO";
        log.totalTurns = log.currentTurn;
        
        // Send to backend asynchronously
        logger.info("[TUTORIAS] ✓ Sending battle log to backend: " + log.internalId);
        sendBattleLog(log);
        
        logger.info("[TUTORIAS] Battle ended: " + winnerUuid + " defeated " + loserUuid + 
                   " in " + log.totalTurns + " turns");
    }
    
    /**
     * Handle battle fled (forfeit)
     */
    private void onBattleFled(PokemonBattle battle, UUID fleeingPlayerUuid) {
        if (battle == null) return;
        
        UUID battleId = battle.getBattleId();
        BattleLog log = activeBattles.remove(battleId);
        
        if (log == null) {
            logger.debug("Battle fled for untracked battle: " + battleId);
            return;
        }
        
        // Determine winner (the one who didn't flee)
        UUID winnerUuid = log.player1.uuid.equals(fleeingPlayerUuid) 
            ? log.player2.uuid 
            : log.player1.uuid;
        
        // Finalize log
        log.endTime = System.currentTimeMillis();
        log.winnerUuid = winnerUuid;
        log.loserUuid = fleeingPlayerUuid;
        log.result = "FORFEIT";
        log.totalTurns = log.currentTurn;
        
        // Send to backend asynchronously
        sendBattleLog(log);
        
        logger.info("Battle forfeit: " + fleeingPlayerUuid + " fled, " + winnerUuid + " wins");
    }
    
    /**
     * Extract team data from a player battle actor
     */
    private JsonArray extractTeamData(PlayerBattleActor actor) {
        JsonArray team = new JsonArray();
        
        try {
            for (BattlePokemon battlePokemon : actor.getPokemonList()) {
                Pokemon pokemon = battlePokemon.getOriginalPokemon();
                if (pokemon == null) continue;
                
                JsonObject pokeData = new JsonObject();
                pokeData.addProperty("species", pokemon.getSpecies().getName());
                pokeData.addProperty("level", pokemon.getLevel());
                pokeData.addProperty("nature", pokemon.getNature().getName().getPath());
                
                // Ability
                if (pokemon.getAbility() != null) {
                    pokeData.addProperty("ability", pokemon.getAbility().getName());
                }
                
                // Moves
                JsonArray moves = new JsonArray();
                pokemon.getMoveSet().forEach(move -> {
                    if (move != null) {
                        moves.add(move.getName());
                    }
                });
                pokeData.add("moves", moves);
                
                // IVs
                JsonObject ivs = new JsonObject();
                ivs.addProperty("hp", pokemon.getIvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.HP));
                ivs.addProperty("attack", pokemon.getIvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.ATTACK));
                ivs.addProperty("defense", pokemon.getIvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.DEFENCE));
                ivs.addProperty("specialAttack", pokemon.getIvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_ATTACK));
                ivs.addProperty("specialDefense", pokemon.getIvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_DEFENCE));
                ivs.addProperty("speed", pokemon.getIvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPEED));
                pokeData.add("ivs", ivs);
                
                // EVs
                JsonObject evs = new JsonObject();
                evs.addProperty("hp", pokemon.getEvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.HP));
                evs.addProperty("attack", pokemon.getEvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.ATTACK));
                evs.addProperty("defense", pokemon.getEvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.DEFENCE));
                evs.addProperty("specialAttack", pokemon.getEvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_ATTACK));
                evs.addProperty("specialDefense", pokemon.getEvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_DEFENCE));
                evs.addProperty("speed", pokemon.getEvs().get(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPEED));
                pokeData.add("evs", evs);
                
                // Held item
                if (pokemon.heldItem() != null && !pokemon.heldItem().isEmpty()) {
                    pokeData.addProperty("heldItem", pokemon.heldItem().getName().getString());
                }
                
                // Shiny status
                pokeData.addProperty("shiny", pokemon.getShiny());
                
                team.add(pokeData);
            }
        } catch (Exception e) {
            logger.error("Error extracting team data: " + e.getMessage());
        }
        
        return team;
    }
    
    /**
     * Get Discord ID for a player (from user data)
     */
    private String getDiscordId(UUID playerUuid) {
        // This would need to be fetched from your user database
        // For now, return null and let the backend resolve it
        return null;
    }

    
    /**
     * Send battle log to backend
     */
    private void sendBattleLog(BattleLog log) {
        executor.submit(() -> {
            try {
                logger.info("[TUTORIAS] Preparing battle log payload for: " + log.internalId);
                
                JsonObject payload = new JsonObject();
                payload.addProperty("battleId", log.internalId.toString());
                payload.addProperty("cobblemonBattleId", log.battleId.toString());
                payload.addProperty("startTime", log.startTime);
                payload.addProperty("endTime", log.endTime);
                payload.addProperty("duration", log.endTime - log.startTime);
                payload.addProperty("totalTurns", log.totalTurns);
                payload.addProperty("result", log.result);
                payload.addProperty("winnerUuid", log.winnerUuid.toString());
                payload.addProperty("loserUuid", log.loserUuid.toString());
                
                // Player 1 data
                JsonObject player1Data = new JsonObject();
                player1Data.addProperty("uuid", log.player1.uuid.toString());
                if (log.player1.discordId != null) {
                    player1Data.addProperty("discordId", log.player1.discordId);
                }
                player1Data.add("team", log.player1.team);
                player1Data.addProperty("isWinner", log.player1.uuid.equals(log.winnerUuid));
                payload.add("player1", player1Data);
                
                // Player 2 data
                JsonObject player2Data = new JsonObject();
                player2Data.addProperty("uuid", log.player2.uuid.toString());
                if (log.player2.discordId != null) {
                    player2Data.addProperty("discordId", log.player2.discordId);
                }
                player2Data.add("team", log.player2.team);
                player2Data.addProperty("isWinner", log.player2.uuid.equals(log.winnerUuid));
                payload.add("player2", player2Data);
                
                // Turn data (if captured)
                JsonArray turnsArray = new JsonArray();
                for (TurnData turn : log.turns) {
                    JsonObject turnObj = new JsonObject();
                    turnObj.addProperty("turn", turn.turnNumber);
                    turnObj.addProperty("player1Move", turn.player1Move);
                    turnObj.addProperty("player2Move", turn.player2Move);
                    turnObj.addProperty("player1Pokemon", turn.player1ActivePokemon);
                    turnObj.addProperty("player2Pokemon", turn.player2ActivePokemon);
                    if (turn.notes != null) {
                        turnObj.addProperty("notes", turn.notes);
                    }
                    turnsArray.add(turnObj);
                }
                payload.add("turns", turnsArray);
                
                logger.info("[TUTORIAS] Sending POST to /api/tutorias/battle-log/store");
                
                // Send to backend
                JsonObject response = httpClient.post("/api/tutorias/battle-log/store", payload);
                
                if (response != null) {
                    logger.info("[TUTORIAS] Response received: " + response.toString());
                    if (response.has("success") && response.get("success").getAsBoolean()) {
                        logger.info("[TUTORIAS] ✓ Battle log sent successfully: " + log.internalId);
                    } else {
                        String error = response.has("error") 
                            ? response.get("error").getAsString() 
                            : "Unknown error";
                        logger.error("[TUTORIAS] ✗ Failed to send battle log: " + error);
                    }
                } else {
                    logger.error("[TUTORIAS] ✗ No response from backend (null)");
                }
            } catch (Exception e) {
                logger.error("[TUTORIAS] ✗ Error sending battle log: " + e.getMessage());
                e.printStackTrace();
            }
        });
    }
    
    /**
     * Record a move action during battle
     */
    public void recordMove(UUID battleId, UUID playerUuid, String moveName, String targetPokemon) {
        BattleLog log = activeBattles.get(battleId);
        if (log == null) return;
        
        // Get or create current turn
        TurnData currentTurn = null;
        if (log.turns.isEmpty() || log.turns.get(log.turns.size() - 1).turnNumber < log.currentTurn) {
            currentTurn = new TurnData();
            currentTurn.turnNumber = log.currentTurn;
            log.turns.add(currentTurn);
        } else {
            currentTurn = log.turns.get(log.turns.size() - 1);
        }
        
        // Record move for the appropriate player
        if (playerUuid.equals(log.player1.uuid)) {
            currentTurn.player1Move = moveName;
        } else if (playerUuid.equals(log.player2.uuid)) {
            currentTurn.player2Move = moveName;
        }
    }
    
    /**
     * Record a Pokemon switch
     */
    public void recordSwitch(UUID battleId, UUID playerUuid, String newPokemon) {
        BattleLog log = activeBattles.get(battleId);
        if (log == null) return;
        
        // Get or create current turn
        TurnData currentTurn = null;
        if (log.turns.isEmpty() || log.turns.get(log.turns.size() - 1).turnNumber < log.currentTurn) {
            currentTurn = new TurnData();
            currentTurn.turnNumber = log.currentTurn;
            log.turns.add(currentTurn);
        } else {
            currentTurn = log.turns.get(log.turns.size() - 1);
        }
        
        // Record switch
        if (playerUuid.equals(log.player1.uuid)) {
            currentTurn.player1Move = "Switch to " + newPokemon;
            currentTurn.player1ActivePokemon = newPokemon;
        } else if (playerUuid.equals(log.player2.uuid)) {
            currentTurn.player2Move = "Switch to " + newPokemon;
            currentTurn.player2ActivePokemon = newPokemon;
        }
    }
    
    /**
     * Advance to next turn
     */
    public void nextTurn(UUID battleId) {
        BattleLog log = activeBattles.get(battleId);
        if (log != null) {
            log.currentTurn++;
        }
    }
    
    /**
     * Check if a battle is being tracked
     */
    public boolean isTrackingBattle(UUID cobblemonBattleId) {
        return activeBattles.containsKey(cobblemonBattleId);
    }
    
    /**
     * Get the internal battle ID for a Cobblemon battle
     */
    public UUID getBattleId(UUID cobblemonBattleId) {
        BattleLog log = activeBattles.get(cobblemonBattleId);
        return log != null ? log.internalId : null;
    }
    
    /**
     * Get active battle count
     */
    public int getActiveBattleCount() {
        return activeBattles.size();
    }
    
    public void shutdown() {
        logger.info("BattleLogCapture shutting down...");
        
        // Send any remaining battle logs as incomplete
        for (BattleLog log : activeBattles.values()) {
            log.endTime = System.currentTimeMillis();
            log.result = "INCOMPLETE";
            log.totalTurns = log.currentTurn;
            sendBattleLog(log);
        }
        
        activeBattles.clear();
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
        
        logger.info("BattleLogCapture shutdown complete");
    }
    
    // ============================================
    // INNER CLASSES
    // ============================================
    
    /**
     * Complete battle log data
     */
    private static class BattleLog {
        UUID battleId;          // Cobblemon battle ID
        UUID internalId;        // Our internal ID
        long startTime;
        long endTime;
        int totalTurns;
        int currentTurn;
        String result;          // KO, FORFEIT, TIMEOUT, INCOMPLETE
        UUID winnerUuid;
        UUID loserUuid;
        PlayerInfo player1;
        PlayerInfo player2;
        List<TurnData> turns;
    }
    
    /**
     * Player information
     */
    private static class PlayerInfo {
        UUID uuid;
        String discordId;
        JsonArray team;
    }
    
    /**
     * Turn data
     */
    private static class TurnData {
        int turnNumber;
        String player1Move;
        String player2Move;
        String player1ActivePokemon;
        String player2ActivePokemon;
        String notes;
    }
}
