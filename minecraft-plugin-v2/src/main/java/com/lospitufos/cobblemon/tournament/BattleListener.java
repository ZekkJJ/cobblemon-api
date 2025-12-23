package com.lospitufos.cobblemon.tournament;

import com.cobblemon.mod.common.api.battles.model.PokemonBattle;
import com.cobblemon.mod.common.api.battles.model.actor.BattleActor;
import com.cobblemon.mod.common.api.events.CobblemonEvents;
import com.cobblemon.mod.common.battles.actor.PlayerBattleActor;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;

import java.util.*;
import java.util.concurrent.*;

/**
 * Battle Listener for Tournament System
 * 
 * Listens to Cobblemon battle events and reports results to the tournament system.
 * 
 * Features:
 * - Detects battle start/end events
 * - Extracts winner/loser UUIDs
 * - Determines victory type (KO, FORFEIT, etc.)
 * - Reports results to TournamentManager
 * - Handles disconnection during battle (3 min timeout)
 */
public class BattleListener {
    
    private final TournamentManager tournamentManager;
    private final ModLogger logger;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    // Track active battles for disconnect handling
    private final Map<UUID, ActiveBattle> activeBattles = new ConcurrentHashMap<>();
    
    // Track disconnected players in battles (UUID -> disconnect time)
    private final Map<UUID, Long> disconnectedPlayers = new ConcurrentHashMap<>();
    
    private MinecraftServer server;
    
    private static final long DISCONNECT_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
    private static final int DISCONNECT_CHECK_SECONDS = 30;
    
    public BattleListener(TournamentManager tournamentManager, ModLogger logger) {
        this.tournamentManager = tournamentManager;
        this.logger = logger;
    }
    
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Battle listener initializing...");
        
        // Register Cobblemon battle events
        registerBattleEvents();
        
        // Check for disconnected players periodically
        scheduler.scheduleAtFixedRate(
            this::checkDisconnectedPlayers,
            DISCONNECT_CHECK_SECONDS,
            DISCONNECT_CHECK_SECONDS,
            TimeUnit.SECONDS
        );
        
        logger.info("Battle listener initialized");
    }
    
    private void registerBattleEvents() {
        // Battle Started Event
        CobblemonEvents.BATTLE_STARTED_PRE.subscribe(com.cobblemon.mod.common.api.Priority.NORMAL, event -> {
            try {
                onBattleStart(event.getBattle());
            } catch (Exception e) {
                logger.error("Error handling battle start: " + e.getMessage());
            }
            return kotlin.Unit.INSTANCE;
        });
        
        // Battle Victory Event (when a side wins)
        CobblemonEvents.BATTLE_VICTORY.subscribe(com.cobblemon.mod.common.api.Priority.NORMAL, event -> {
            try {
                onBattleVictory(event.getBattle(), event.getWinners(), event.getLosers());
            } catch (Exception e) {
                logger.error("Error handling battle victory: " + e.getMessage());
            }
            return kotlin.Unit.INSTANCE;
        });
        
        // Battle Fled Event (forfeit)
        CobblemonEvents.BATTLE_FLED.subscribe(com.cobblemon.mod.common.api.Priority.NORMAL, event -> {
            try {
                PlayerBattleActor fleeingActor = event.getPlayer();
                if (fleeingActor != null && server != null) {
                    ServerPlayerEntity fleeingPlayer = server.getPlayerManager().getPlayer(fleeingActor.getUuid());
                    if (fleeingPlayer != null) {
                        onBattleFled(event.getBattle(), fleeingPlayer);
                    }
                }
            } catch (Exception e) {
                logger.error("Error handling battle fled: " + e.getMessage());
            }
            return kotlin.Unit.INSTANCE;
        });
    }
    
    /**
     * Handle battle start event
     */
    private void onBattleStart(PokemonBattle battle) {
        if (battle == null) return;
        
        List<UUID> playerUuids = new ArrayList<>();
        
        for (BattleActor actor : battle.getActors()) {
            if (actor instanceof PlayerBattleActor) {
                PlayerBattleActor playerActor = (PlayerBattleActor) actor;
                UUID uuid = playerActor.getUuid();
                playerUuids.add(uuid);
                
                // Track active battle
                ActiveBattle activeBattle = new ActiveBattle();
                activeBattle.battleId = battle.getBattleId().toString();
                activeBattle.startTime = System.currentTimeMillis();
                activeBattle.participants = new ArrayList<>(playerUuids);
                activeBattles.put(uuid, activeBattle);
            }
        }
        
        // Check if this is a tournament battle
        boolean isTournamentBattle = false;
        for (UUID uuid : playerUuids) {
            if (tournamentManager.isPlayerInTournament(uuid)) {
                isTournamentBattle = true;
                break;
            }
        }
        
        if (isTournamentBattle && playerUuids.size() == 2) {
            logger.info("Tournament battle started between " + playerUuids.get(0) + " and " + playerUuids.get(1));
        }
    }
    
    /**
     * Handle battle victory event
     */
    private void onBattleVictory(PokemonBattle battle, List<BattleActor> winners, List<BattleActor> losers) {
        if (battle == null || winners == null || losers == null) return;
        if (winners.isEmpty() || losers.isEmpty()) return;
        
        // Extract player UUIDs
        UUID winnerUuid = null;
        UUID loserUuid = null;
        
        for (BattleActor actor : winners) {
            if (actor instanceof PlayerBattleActor) {
                winnerUuid = ((PlayerBattleActor) actor).getUuid();
                break;
            }
        }
        
        for (BattleActor actor : losers) {
            if (actor instanceof PlayerBattleActor) {
                loserUuid = ((PlayerBattleActor) actor).getUuid();
                break;
            }
        }
        
        if (winnerUuid == null || loserUuid == null) {
            logger.debug("Battle victory: not a PvP battle");
            return;
        }
        
        // Clean up tracking
        activeBattles.remove(winnerUuid);
        activeBattles.remove(loserUuid);
        disconnectedPlayers.remove(winnerUuid);
        disconnectedPlayers.remove(loserUuid);
        
        // Report to tournament manager
        logger.info("Battle ended: " + winnerUuid + " defeated " + loserUuid + " (KO)");
        tournamentManager.reportBattleResult(winnerUuid, loserUuid, "KO");
    }
    
    /**
     * Handle battle fled event (forfeit)
     */
    private void onBattleFled(PokemonBattle battle, ServerPlayerEntity fleeingPlayer) {
        if (battle == null || fleeingPlayer == null) return;
        
        UUID fleeingUuid = fleeingPlayer.getUuid();
        UUID opponentUuid = null;
        
        // Find opponent
        for (BattleActor actor : battle.getActors()) {
            if (actor instanceof PlayerBattleActor) {
                UUID actorUuid = ((PlayerBattleActor) actor).getUuid();
                if (!actorUuid.equals(fleeingUuid)) {
                    opponentUuid = actorUuid;
                    break;
                }
            }
        }
        
        if (opponentUuid == null) {
            logger.debug("Battle fled: no opponent found");
            return;
        }
        
        // Clean up tracking
        activeBattles.remove(fleeingUuid);
        activeBattles.remove(opponentUuid);
        disconnectedPlayers.remove(fleeingUuid);
        disconnectedPlayers.remove(opponentUuid);
        
        // Report forfeit - opponent wins
        logger.info("Battle forfeit: " + fleeingUuid + " fled, " + opponentUuid + " wins");
        tournamentManager.reportBattleResult(opponentUuid, fleeingUuid, "FORFEIT");
    }
    
    /**
     * Handle player disconnect during battle
     */
    public void onPlayerDisconnect(UUID playerUuid) {
        if (!activeBattles.containsKey(playerUuid)) return;
        
        // Check if in tournament
        if (!tournamentManager.isPlayerInTournament(playerUuid)) return;
        
        logger.info("Tournament player disconnected during battle: " + playerUuid);
        disconnectedPlayers.put(playerUuid, System.currentTimeMillis());
    }
    
    /**
     * Handle player reconnect
     */
    public void onPlayerReconnect(UUID playerUuid) {
        disconnectedPlayers.remove(playerUuid);
    }
    
    /**
     * Check for players who have been disconnected too long
     */
    private void checkDisconnectedPlayers() {
        long now = System.currentTimeMillis();
        
        for (Map.Entry<UUID, Long> entry : disconnectedPlayers.entrySet()) {
            UUID playerUuid = entry.getKey();
            long disconnectTime = entry.getValue();
            
            if (now - disconnectTime >= DISCONNECT_TIMEOUT_MS) {
                // Player has been disconnected for too long - forfeit
                ActiveBattle battle = activeBattles.get(playerUuid);
                if (battle != null && battle.participants.size() == 2) {
                    UUID opponentUuid = battle.participants.get(0).equals(playerUuid) 
                        ? battle.participants.get(1) 
                        : battle.participants.get(0);
                    
                    logger.info("Disconnect timeout: " + playerUuid + " forfeits to " + opponentUuid);
                    tournamentManager.reportBattleResult(opponentUuid, playerUuid, "TIMEOUT");
                    
                    // Clean up
                    activeBattles.remove(playerUuid);
                    activeBattles.remove(opponentUuid);
                }
                
                disconnectedPlayers.remove(playerUuid);
            }
        }
    }
    
    /**
     * Extract battle result from a completed battle
     */
    public BattleResult extractResult(PokemonBattle battle, UUID winnerUuid, UUID loserUuid, String victoryType) {
        BattleResult result = new BattleResult();
        result.winnerUuid = winnerUuid;
        result.loserUuid = loserUuid;
        result.victoryType = victoryType;
        result.battleId = battle != null ? battle.getBattleId().toString() : "";
        
        ActiveBattle activeBattle = activeBattles.get(winnerUuid);
        if (activeBattle != null) {
            result.durationMs = System.currentTimeMillis() - activeBattle.startTime;
        }
        
        return result;
    }
    
    public void shutdown() {
        logger.info("Battle listener shutting down...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
        activeBattles.clear();
        disconnectedPlayers.clear();
    }
    
    // ============================================
    // INNER CLASSES
    // ============================================
    
    /**
     * Tracks an active battle
     */
    private static class ActiveBattle {
        String battleId;
        long startTime;
        List<UUID> participants;
    }
    
    /**
     * Battle result data
     */
    public static class BattleResult {
        public UUID winnerUuid;
        public UUID loserUuid;
        public String victoryType;
        public long durationMs;
        public String battleId;
    }
}
