package com.lospitufos.cobblemon.tournament;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.util.*;
import java.util.concurrent.*;

/**
 * Tournament Manager for Cobblemon Los Pitufos
 * 
 * Features:
 * - Join tournaments with /torneo join [code]
 * - Leave tournaments with /torneo leave
 * - View tournament info with /torneo info
 * - Auto-detect battle results and report to backend
 * - In-game notifications for match updates
 */
public class TournamentManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(3);
    
    // Cache of active tournament data per player
    private final Map<UUID, CachedTournament> playerTournaments = new ConcurrentHashMap<>();
    
    // Cache of active matches (player UUID -> match info)
    private final Map<UUID, CachedMatch> activeMatches = new ConcurrentHashMap<>();
    
    // Cache of known tournaments (to detect new ones)
    private final Set<String> knownTournamentIds = ConcurrentHashMap.newKeySet();
    
    // Cache of tournament statuses (to detect status changes)
    private final Map<String, String> tournamentStatuses = new ConcurrentHashMap<>();
    
    // Notification manager for announcements
    private NotificationManager notificationManager;
    
    private MinecraftServer server;
    
    private static final int CACHE_REFRESH_SECONDS = 30;
    private static final int MATCH_CHECK_SECONDS = 10;
    private static final int TOURNAMENT_POLL_SECONDS = 15; // Check for new tournaments every 15 seconds
    
    public TournamentManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
    }
    
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Tournament system initializing...");
        
        // Initialize notification manager
        this.notificationManager = new NotificationManager(logger);
        this.notificationManager.initialize(server);
        
        // Refresh tournament cache periodically
        scheduler.scheduleAtFixedRate(
            this::refreshTournamentCache,
            10,
            CACHE_REFRESH_SECONDS,
            TimeUnit.SECONDS
        );
        
        // Check for active matches periodically
        scheduler.scheduleAtFixedRate(
            this::checkActiveMatches,
            15,
            MATCH_CHECK_SECONDS,
            TimeUnit.SECONDS
        );
        
        // Poll for new tournaments and announce them
        scheduler.scheduleAtFixedRate(
            this::pollForNewTournaments,
            5,
            TOURNAMENT_POLL_SECONDS,
            TimeUnit.SECONDS
        );
        
        logger.info("Tournament system initialized");
    }
    
    /**
     * Poll backend for tournaments and detect status changes
     * - Announce new tournaments with open registration
     * - Trigger epic teleport when tournament starts
     */
    private void pollForNewTournaments() {
        if (server == null) return;
        
        httpClient.getAsync("/api/tournaments/active")
            .thenAccept(response -> {
                if (response == null || !response.has("data")) return;
                
                try {
                    JsonArray tournaments = response.getAsJsonArray("data");
                    
                    for (JsonElement elem : tournaments) {
                        JsonObject tournament = elem.getAsJsonObject();
                        String id = getIdFromJson(tournament.get("_id"));
                        String status = tournament.get("status").getAsString();
                        String previousStatus = tournamentStatuses.get(id);
                        
                        // Update status cache
                        tournamentStatuses.put(id, status);
                        
                        // Check if tournament just started (status changed to "active")
                        if ("active".equals(status) && previousStatus != null && !"active".equals(previousStatus)) {
                            logger.info("Tournament " + id + " just started! Triggering epic teleport...");
                            onTournamentStart(id);
                        }
                        
                        // Only announce tournaments with open registration
                        if (!"registration".equals(status)) continue;
                        
                        // Check if this is a new tournament we haven't seen
                        if (!knownTournamentIds.contains(id)) {
                            knownTournamentIds.add(id);
                            
                            // Announce to server
                            String name = tournament.get("name").getAsString();
                            String code = tournament.get("code").getAsString();
                            String startDate = tournament.has("startDate") && !tournament.get("startDate").isJsonNull()
                                ? formatDate(tournament.get("startDate").getAsString())
                                : "Por anunciar";
                            
                            // Get registration time (default 30 seconds)
                            int registrationSeconds = tournament.has("registrationSeconds") 
                                ? tournament.get("registrationSeconds").getAsInt() 
                                : 30;
                            
                            server.execute(() -> {
                                if (notificationManager != null) {
                                    notificationManager.announceTournamentCreated(name, startDate, code, registrationSeconds);
                                }
                                logger.info("Announced new tournament: " + name + " (" + code + ") - " + registrationSeconds + "s registration");
                            });
                        }
                    }
                } catch (Exception e) {
                    logger.debug("Error polling tournaments: " + e.getMessage());
                }
            })
            .exceptionally(ex -> {
                logger.debug("Error fetching active tournaments: " + ex.getMessage());
                return null;
            });
    }
    
    /**
     * Format ISO date string to readable format
     */
    private String formatDate(String isoDate) {
        try {
            // Simple parsing - just extract date part
            if (isoDate.contains("T")) {
                String[] parts = isoDate.split("T");
                return parts[0]; // Return just the date part
            }
            return isoDate;
        } catch (Exception e) {
            return isoDate;
        }
    }

    
    // ============================================
    // TOURNAMENT COMMANDS
    // ============================================
    
    /**
     * Handle /torneo join [code] command
     */
    public void handleJoinCommand(ServerPlayerEntity player, String tournamentCode) {
        if (player == null || tournamentCode == null || tournamentCode.isEmpty()) {
            return;
        }
        
        UUID uuid = player.getUuid();
        String username = player.getName().getString();
        
        // Validate code format (6 alphanumeric characters)
        if (!isValidTournamentCode(tournamentCode)) {
            player.sendMessage(Text.literal("§c¡Código de torneo inválido! Debe ser de 6 caracteres alfanuméricos."));
            return;
        }
        
        // Check if already in a tournament
        if (playerTournaments.containsKey(uuid)) {
            CachedTournament cached = playerTournaments.get(uuid);
            player.sendMessage(Text.literal("§c¡Ya estás inscrito en el torneo \"" + cached.name + "\"!"));
            player.sendMessage(Text.literal("§7Usa §e/torneo leave §7para salir primero."));
            return;
        }
        
        player.sendMessage(Text.literal("§e⏳ Registrando en torneo..."));
        
        // Register with backend
        JsonObject payload = new JsonObject();
        payload.addProperty("code", tournamentCode.toUpperCase());
        payload.addProperty("minecraftUuid", uuid.toString());
        payload.addProperty("username", username);
        
        httpClient.postAsync("/api/tournaments/register", payload)
            .thenAccept(response -> {
                server.execute(() -> handleJoinResponse(player, response, tournamentCode));
            })
            .exceptionally(ex -> {
                server.execute(() -> {
                    player.sendMessage(Text.literal("§c✗ Error de conexión. Intenta de nuevo."));
                    logger.error("Tournament join error: " + ex.getMessage());
                });
                return null;
            });
    }
    
    private void handleJoinResponse(ServerPlayerEntity player, JsonObject response, String code) {
        if (player == null || player.isDisconnected()) return;
        
        if (response == null) {
            player.sendMessage(Text.literal("§c✗ Error al conectar con el servidor."));
            return;
        }
        
        if (!response.has("success") || !response.get("success").getAsBoolean()) {
            String error = response.has("message") ? response.get("message").getAsString() : "Error desconocido";
            
            // Translate common errors
            if (error.contains("INVALID_CODE") || error.contains("inválido")) {
                player.sendMessage(Text.literal("§c✗ ¡Código de torneo inválido!"));
            } else if (error.contains("ALREADY_REGISTERED") || error.contains("Ya estás")) {
                player.sendMessage(Text.literal("§c✗ ¡Ya estás inscrito en este torneo!"));
            } else if (error.contains("TOURNAMENT_FULL") || error.contains("lleno")) {
                player.sendMessage(Text.literal("§c✗ ¡El torneo está lleno!"));
            } else if (error.contains("REGISTRATION_CLOSED") || error.contains("cerradas")) {
                player.sendMessage(Text.literal("§c✗ ¡Las inscripciones están cerradas!"));
            } else {
                player.sendMessage(Text.literal("§c✗ " + error));
            }
            return;
        }
        
        // Success!
        try {
            JsonObject data = response.getAsJsonObject("data");
            JsonObject tournament = data.getAsJsonObject("tournament");
            JsonObject participant = data.getAsJsonObject("participant");
            
            String tournamentName = tournament.get("name").getAsString();
            String tournamentCode = tournament.get("code").getAsString();
            int seed = participant.get("seed").getAsInt();
            int currentParticipants = tournament.getAsJsonArray("participants").size();
            int maxParticipants = tournament.get("maxParticipants").getAsInt();
            
            // Cache tournament data
            CachedTournament cached = new CachedTournament();
            cached.id = tournament.has("_id") ? getIdFromJson(tournament.get("_id")) : "";
            cached.code = tournamentCode;
            cached.name = tournamentName;
            cached.status = tournament.get("status").getAsString();
            cached.participantId = participant.get("id").getAsString();
            cached.seed = seed;
            cached.lastUpdated = System.currentTimeMillis();
            
            playerTournaments.put(player.getUuid(), cached);
            
            // Send success messages
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§a§l✓ ¡INSCRIPCIÓN EXITOSA!"));
            player.sendMessage(Text.literal("§7Torneo: §f" + tournamentName));
            player.sendMessage(Text.literal("§7Código: §e" + tournamentCode));
            player.sendMessage(Text.literal("§7Tu seed: §b#" + seed));
            player.sendMessage(Text.literal("§7Participantes: §f" + currentParticipants + "/" + maxParticipants));
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§7Usa §e/torneo info §7para ver el estado del torneo."));
            player.sendMessage(Text.literal(""));
            
            logger.info("Player " + player.getName().getString() + " joined tournament " + tournamentName);
            
        } catch (Exception e) {
            player.sendMessage(Text.literal("§a✓ ¡Inscripción exitosa!"));
            logger.error("Error parsing join response: " + e.getMessage());
        }
    }
    
    /**
     * Handle /torneo leave command
     */
    public void handleLeaveCommand(ServerPlayerEntity player) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        
        if (!playerTournaments.containsKey(uuid)) {
            player.sendMessage(Text.literal("§c¡No estás inscrito en ningún torneo!"));
            return;
        }
        
        CachedTournament cached = playerTournaments.get(uuid);
        
        // Can't leave if tournament is active
        if ("active".equals(cached.status)) {
            player.sendMessage(Text.literal("§c¡No puedes abandonar un torneo en curso!"));
            player.sendMessage(Text.literal("§7Contacta a un administrador si necesitas retirarte."));
            return;
        }
        
        player.sendMessage(Text.literal("§e⏳ Saliendo del torneo..."));
        
        // Remove from backend
        httpClient.postAsync("/api/tournaments/" + cached.id + "/leave", createPlayerPayload(uuid))
            .thenAccept(response -> {
                server.execute(() -> {
                    playerTournaments.remove(uuid);
                    player.sendMessage(Text.literal("§a✓ Has abandonado el torneo \"" + cached.name + "\"."));
                    logger.info("Player " + player.getName().getString() + " left tournament " + cached.name);
                });
            })
            .exceptionally(ex -> {
                server.execute(() -> {
                    // Remove from cache anyway
                    playerTournaments.remove(uuid);
                    player.sendMessage(Text.literal("§a✓ Has abandonado el torneo."));
                });
                return null;
            });
    }
    
    /**
     * Handle /torneo info command
     */
    public void handleInfoCommand(ServerPlayerEntity player) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        
        if (!playerTournaments.containsKey(uuid)) {
            player.sendMessage(Text.literal("§c¡No estás inscrito en ningún torneo!"));
            player.sendMessage(Text.literal("§7Usa §e/torneo join [código] §7para inscribirte."));
            return;
        }
        
        CachedTournament cached = playerTournaments.get(uuid);
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§6§l═══ TORNEO INFO ═══"));
        player.sendMessage(Text.literal("§7Nombre: §f" + cached.name));
        player.sendMessage(Text.literal("§7Código: §e" + cached.code));
        player.sendMessage(Text.literal("§7Estado: " + getStatusDisplay(cached.status)));
        player.sendMessage(Text.literal("§7Tu seed: §b#" + cached.seed));
        
        // Show next opponent if available
        if (activeMatches.containsKey(uuid)) {
            CachedMatch match = activeMatches.get(uuid);
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§a§l¡TIENES UN MATCH ACTIVO!"));
            player.sendMessage(Text.literal("§7Oponente: §c" + match.opponentName));
            player.sendMessage(Text.literal("§7Ronda: §f" + match.roundNumber));
            player.sendMessage(Text.literal("§e¡Busca a tu oponente y comienza la batalla!"));
        }
        
        player.sendMessage(Text.literal("§6§l═══════════════════"));
        player.sendMessage(Text.literal(""));
        
        // Refresh data in background
        refreshPlayerTournament(uuid);
    }

    
    // ============================================
    // BATTLE RESULT REPORTING
    // ============================================
    
    /**
     * Report a battle result to the backend
     * Called by BattleListener when a Cobblemon battle ends
     */
    public void reportBattleResult(UUID winnerUuid, UUID loserUuid, String victoryType) {
        // Check if both players are in tournaments
        if (!playerTournaments.containsKey(winnerUuid) && !playerTournaments.containsKey(loserUuid)) {
            logger.debug("Battle between non-tournament players, ignoring");
            return;
        }
        
        logger.info("Reporting battle result: " + winnerUuid + " defeated " + loserUuid + " (" + victoryType + ")");
        
        // Find the match between these players
        JsonObject payload = new JsonObject();
        payload.addProperty("player1Uuid", winnerUuid.toString());
        payload.addProperty("player2Uuid", loserUuid.toString());
        
        httpClient.postAsync("/api/tournaments/find-match", payload)
            .thenAccept(response -> {
                if (response == null || !response.has("data") || response.get("data").isJsonNull()) {
                    logger.debug("No active tournament match found between these players");
                    return;
                }
                
                try {
                    JsonObject data = response.getAsJsonObject("data");
                    JsonObject match = data.getAsJsonObject("match");
                    JsonObject tournament = data.getAsJsonObject("tournament");
                    
                    String matchId = match.get("id").getAsString();
                    String tournamentId = getIdFromJson(tournament.get("_id"));
                    
                    // Get participant IDs
                    String winnerId = getParticipantIdByUuid(tournament, winnerUuid.toString());
                    String loserId = getParticipantIdByUuid(tournament, loserUuid.toString());
                    
                    if (winnerId == null || loserId == null) {
                        logger.error("Could not find participant IDs for battle result");
                        return;
                    }
                    
                    // Report the result
                    JsonObject resultPayload = new JsonObject();
                    resultPayload.addProperty("winnerId", winnerId);
                    resultPayload.addProperty("loserId", loserId);
                    resultPayload.addProperty("victoryType", victoryType);
                    resultPayload.addProperty("tournamentId", tournamentId);
                    
                    httpClient.postAsync("/api/tournaments/matches/" + matchId + "/result", resultPayload)
                        .thenAccept(resultResponse -> {
                            if (resultResponse != null && resultResponse.has("success") && 
                                resultResponse.get("success").getAsBoolean()) {
                                logger.info("Battle result reported successfully for match " + matchId);
                                
                                // Notify players
                                server.execute(() -> {
                                    notifyMatchResult(winnerUuid, loserUuid, tournament.get("name").getAsString());
                                });
                                
                                // Refresh tournament cache
                                refreshPlayerTournament(winnerUuid);
                                refreshPlayerTournament(loserUuid);
                            } else {
                                logger.warn("Failed to report battle result: " + 
                                    (resultResponse != null ? resultResponse.toString() : "null response"));
                            }
                        })
                        .exceptionally(ex -> {
                            logger.error("Error reporting battle result: " + ex.getMessage());
                            return null;
                        });
                        
                } catch (Exception e) {
                    logger.error("Error processing match data: " + e.getMessage());
                }
            })
            .exceptionally(ex -> {
                logger.error("Error finding match: " + ex.getMessage());
                return null;
            });
    }
    
    private void notifyMatchResult(UUID winnerUuid, UUID loserUuid, String tournamentName) {
        ServerPlayerEntity winner = server.getPlayerManager().getPlayer(winnerUuid);
        ServerPlayerEntity loser = server.getPlayerManager().getPlayer(loserUuid);
        
        if (winner != null && !winner.isDisconnected()) {
            winner.sendMessage(Text.literal(""));
            winner.sendMessage(Text.literal("§a§l✓ ¡VICTORIA EN TORNEO!"));
            winner.sendMessage(Text.literal("§7Torneo: §f" + tournamentName));
            winner.sendMessage(Text.literal("§7¡Avanzas a la siguiente ronda!"));
            winner.sendMessage(Text.literal("§eUsa §6/torneo info §epara ver tu próximo match."));
            winner.sendMessage(Text.literal(""));
        }
        
        if (loser != null && !loser.isDisconnected()) {
            loser.sendMessage(Text.literal(""));
            loser.sendMessage(Text.literal("§c§l✗ ELIMINADO DEL TORNEO"));
            loser.sendMessage(Text.literal("§7Torneo: §f" + tournamentName));
            loser.sendMessage(Text.literal("§7¡Gracias por participar!"));
            loser.sendMessage(Text.literal(""));
            
            // Remove from cache
            playerTournaments.remove(loserUuid);
            activeMatches.remove(loserUuid);
        }
    }
    
    // ============================================
    // NOTIFICATIONS
    // ============================================
    
    /**
     * Send a notification to a player
     */
    public void sendNotification(UUID playerUuid, String message) {
        if (server == null) return;
        
        ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerUuid);
        if (player != null && !player.isDisconnected()) {
            player.sendMessage(Text.literal(message));
        }
    }
    
    /**
     * Announce a message to all online players
     */
    public void announceToServer(String message) {
        if (server == null) return;
        
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player != null && !player.isDisconnected()) {
                player.sendMessage(Text.literal(message));
            }
        }
    }
    
    /**
     * Notify player about their upcoming match
     */
    public void notifyMatchScheduled(UUID playerUuid, String opponentName, int roundNumber, String tournamentName) {
        ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerUuid);
        if (player == null || player.isDisconnected()) return;
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§6§l═══ ¡MATCH PROGRAMADO! ═══"));
        player.sendMessage(Text.literal("§7Torneo: §f" + tournamentName));
        player.sendMessage(Text.literal("§7Ronda: §f" + roundNumber));
        player.sendMessage(Text.literal("§7Oponente: §c" + opponentName));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§e¡Busca a tu oponente y comienza la batalla!"));
        player.sendMessage(Text.literal("§6§l═══════════════════════════"));
        player.sendMessage(Text.literal(""));
    }
    
    /**
     * Notify player about no-show warning
     */
    public void notifyNoShowWarning(UUID playerUuid, int minutesRemaining) {
        ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerUuid);
        if (player == null || player.isDisconnected()) return;
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§c§l⚠ ¡ADVERTENCIA DE NO-SHOW!"));
        player.sendMessage(Text.literal("§7Tienes §c" + minutesRemaining + " minutos §7para comenzar tu match."));
        player.sendMessage(Text.literal("§7Si no te presentas, serás descalificado."));
        player.sendMessage(Text.literal(""));
    }

    
    // ============================================
    // CACHE MANAGEMENT
    // ============================================
    
    private void refreshTournamentCache() {
        if (server == null) return;
        
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player == null || player.isDisconnected()) continue;
            refreshPlayerTournament(player.getUuid());
        }
    }
    
    private void refreshPlayerTournament(UUID playerUuid) {
        httpClient.getAsync("/api/tournaments/player/" + playerUuid.toString())
            .thenAccept(response -> {
                if (response == null || !response.has("data") || response.get("data").isJsonNull()) {
                    // Player not in any tournament
                    playerTournaments.remove(playerUuid);
                    activeMatches.remove(playerUuid);
                    return;
                }
                
                try {
                    JsonObject tournament = response.getAsJsonObject("data");
                    
                    CachedTournament cached = new CachedTournament();
                    cached.id = getIdFromJson(tournament.get("_id"));
                    cached.code = tournament.get("code").getAsString();
                    cached.name = tournament.get("name").getAsString();
                    cached.status = tournament.get("status").getAsString();
                    cached.lastUpdated = System.currentTimeMillis();
                    
                    // Find participant info
                    JsonArray participants = tournament.getAsJsonArray("participants");
                    for (JsonElement elem : participants) {
                        JsonObject p = elem.getAsJsonObject();
                        if (p.get("minecraftUuid").getAsString().equals(playerUuid.toString())) {
                            cached.participantId = p.get("id").getAsString();
                            cached.seed = p.get("seed").getAsInt();
                            break;
                        }
                    }
                    
                    playerTournaments.put(playerUuid, cached);
                    
                } catch (Exception e) {
                    logger.debug("Error refreshing tournament cache: " + e.getMessage());
                }
            })
            .exceptionally(ex -> {
                logger.debug("Error fetching player tournament: " + ex.getMessage());
                return null;
            });
    }
    
    private void checkActiveMatches() {
        if (server == null) return;
        
        for (Map.Entry<UUID, CachedTournament> entry : playerTournaments.entrySet()) {
            UUID playerUuid = entry.getKey();
            CachedTournament cached = entry.getValue();
            
            if (!"active".equals(cached.status)) continue;
            
            // Check for active match
            checkPlayerActiveMatch(playerUuid, cached);
        }
    }
    
    private void checkPlayerActiveMatch(UUID playerUuid, CachedTournament cached) {
        httpClient.getAsync("/api/tournaments/" + cached.id)
            .thenAccept(response -> {
                if (response == null || !response.has("data")) return;
                
                try {
                    JsonObject tournament = response.getAsJsonObject("data");
                    if (!tournament.has("bracket") || tournament.get("bracket").isJsonNull()) return;
                    
                    JsonObject bracket = tournament.getAsJsonObject("bracket");
                    JsonArray rounds = bracket.getAsJsonArray("rounds");
                    
                    // Find active match for this player
                    for (JsonElement roundElem : rounds) {
                        JsonObject round = roundElem.getAsJsonObject();
                        JsonArray matches = round.getAsJsonArray("matches");
                        
                        for (JsonElement matchElem : matches) {
                            JsonObject match = matchElem.getAsJsonObject();
                            String status = match.get("status").getAsString();
                            
                            if (!"ready".equals(status) && !"active".equals(status)) continue;
                            
                            String player1Id = match.has("player1Id") && !match.get("player1Id").isJsonNull() 
                                ? match.get("player1Id").getAsString() : null;
                            String player2Id = match.has("player2Id") && !match.get("player2Id").isJsonNull() 
                                ? match.get("player2Id").getAsString() : null;
                            
                            if (cached.participantId.equals(player1Id) || cached.participantId.equals(player2Id)) {
                                // Found active match
                                String opponentId = cached.participantId.equals(player1Id) ? player2Id : player1Id;
                                String opponentName = getParticipantNameById(tournament, opponentId);
                                
                                CachedMatch cachedMatch = new CachedMatch();
                                cachedMatch.matchId = match.get("id").getAsString();
                                cachedMatch.opponentId = opponentId;
                                cachedMatch.opponentName = opponentName != null ? opponentName : "Desconocido";
                                cachedMatch.roundNumber = round.get("roundNumber").getAsInt();
                                cachedMatch.status = status;
                                
                                CachedMatch previousMatch = activeMatches.get(playerUuid);
                                
                                // Notify if this is a new match
                                if (previousMatch == null || !previousMatch.matchId.equals(cachedMatch.matchId)) {
                                    server.execute(() -> {
                                        notifyMatchScheduled(playerUuid, cachedMatch.opponentName, 
                                            cachedMatch.roundNumber, cached.name);
                                    });
                                }
                                
                                activeMatches.put(playerUuid, cachedMatch);
                                return;
                            }
                        }
                    }
                    
                    // No active match found
                    activeMatches.remove(playerUuid);
                    
                } catch (Exception e) {
                    logger.debug("Error checking active match: " + e.getMessage());
                }
            })
            .exceptionally(ex -> {
                logger.debug("Error fetching tournament for match check: " + ex.getMessage());
                return null;
            });
    }
    
    // ============================================
    // EPIC TOURNAMENT START - TELEPORT WITH EFFECTS
    // ============================================
    
    // Arena coordinates
    private static final double ARENA_X = 1382;
    private static final double ARENA_Y = 64;
    private static final double ARENA_Z = 1494;
    private static final int SPAWN_RADIUS = 5;
    private static final long TELEPORT_INTERVAL_MS = 4000; // 4 seconds between each player
    
    /**
     * Participant data for epic intro
     */
    private static class ParticipantData {
        UUID uuid;
        String username;
        int seed;
        
        ParticipantData(UUID uuid, String username, int seed) {
            this.uuid = uuid;
            this.username = username;
            this.seed = seed;
        }
    }
    
    /**
     * Match data for announcements
     */
    private static class MatchData {
        String player1Name;
        String player2Name;
        int matchNumber;
        
        MatchData(String p1, String p2, int num) {
            this.player1Name = p1;
            this.player2Name = p2;
            this.matchNumber = num;
        }
    }
    
    /**
     * Epic tournament start sequence:
     * 1. Set weather to thunder (dramatic)
     * 2. Teleport players one by one with lightning (4 seconds apart)
     * 3. Announce each player globally as they arrive
     * 4. After all teleports, announce matches in order
     * 5. Clear weather
     */
    public void startTournamentEpic(String tournamentId, List<ParticipantData> participants, List<MatchData> matches, String tournamentName) {
        if (server == null || participants.isEmpty()) return;
        
        logger.info("Starting epic tournament teleport for " + participants.size() + " players");
        
        // Step 1: Set weather to thunder for dramatic effect
        server.execute(() -> {
            // Set thundering weather for longer duration
            int weatherDuration = (int) ((participants.size() * TELEPORT_INTERVAL_MS / 50) + 600); // Extra 30 seconds
            server.getOverworld().setWeather(0, weatherDuration, true, true);
            
            // Epic announcement
            announceToServer("");
            announceToServer("§0§l▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬");
            announceToServer("");
            announceToServer("§5§l          ⚡ TORNEO: " + tournamentName.toUpperCase() + " ⚡");
            announceToServer("");
            announceToServer("§d§l              ¡ESTÁ POR COMENZAR!");
            announceToServer("");
            announceToServer("§7              " + participants.size() + " participantes");
            announceToServer("");
            announceToServer("§0§l▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬");
            announceToServer("");
        });
        
        // Step 2: Teleport players one by one with 4 second intervals
        for (int i = 0; i < participants.size(); i++) {
            final int index = i;
            final ParticipantData participant = participants.get(i);
            
            scheduler.schedule(() -> {
                server.execute(() -> teleportPlayerWithLightningSmooth(participant, index, participants.size()));
            }, 3000 + (i * TELEPORT_INTERVAL_MS), TimeUnit.MILLISECONDS); // Start after 3 seconds
        }
        
        // Step 3: After all teleports, announce matches in order
        long afterTeleportsTime = 3000 + (participants.size() * TELEPORT_INTERVAL_MS) + 3000; // Extra 3 seconds
        
        // Announce "all players ready"
        scheduler.schedule(() -> {
            server.execute(() -> {
                announceToServer("");
                announceToServer("§a§l✓ ¡TODOS LOS PARTICIPANTES HAN LLEGADO!");
                announceToServer("");
            });
        }, afterTeleportsTime, TimeUnit.MILLISECONDS);
        
        // Announce matches one by one (2 seconds apart)
        for (int i = 0; i < matches.size(); i++) {
            final int matchIndex = i;
            final MatchData match = matches.get(i);
            
            scheduler.schedule(() -> {
                server.execute(() -> announceMatch(match, matchIndex + 1, matches.size()));
            }, afterTeleportsTime + 2000 + (i * 2000L), TimeUnit.MILLISECONDS);
        }
        
        // Final announcement
        long finalAnnouncementTime = afterTeleportsTime + 2000 + (matches.size() * 2000L) + 2000;
        scheduler.schedule(() -> {
            server.execute(() -> {
                announceToServer("");
                announceToServer("§6§l⚔ ═══════════════════════════════════════ ⚔");
                announceToServer("");
                announceToServer("§e§l          ¡QUE COMIENCE EL TORNEO!");
                announceToServer("");
                announceToServer("§a§l              ¡BUENA SUERTE A TODOS!");
                announceToServer("");
                announceToServer("§6§l⚔ ═══════════════════════════════════════ ⚔");
                announceToServer("");
            });
        }, finalAnnouncementTime, TimeUnit.MILLISECONDS);
        
        // Clear weather after everything
        scheduler.schedule(() -> {
            server.execute(() -> {
                server.getOverworld().setWeather(6000, 0, false, false);
                logger.info("Weather cleared after tournament start");
            });
        }, finalAnnouncementTime + 5000, TimeUnit.MILLISECONDS);
    }
    
    /**
     * Announce a single match globally
     */
    private void announceMatch(MatchData match, int matchNumber, int totalMatches) {
        announceToServer("");
        announceToServer("§6§l⚔ COMBATE #" + matchNumber + " de " + totalMatches + " ⚔");
        announceToServer("");
        announceToServer("§c§l  " + match.player1Name);
        announceToServer("§7§l         VS");
        announceToServer("§9§l  " + match.player2Name);
        announceToServer("");
    }
    
    /**
     * Teleport a single player with lightning effect - SMOOTH version
     * Announces globally when each player arrives
     */
    private void teleportPlayerWithLightningSmooth(ParticipantData participant, int index, int totalPlayers) {
        ServerPlayerEntity player = server.getPlayerManager().getPlayer(participant.uuid);
        if (player == null || player.isDisconnected()) {
            logger.warn("Player " + participant.username + " not online for tournament teleport");
            // Still announce they were supposed to arrive
            announceToServer("§8[§c✗§8] §7" + participant.username + " §8(no conectado)");
            return;
        }
        
        // Calculate spawn position in a circle around the arena center
        double angle = (2 * Math.PI * index) / Math.max(totalPlayers, 1);
        double spawnX = ARENA_X + (SPAWN_RADIUS * Math.cos(angle));
        double spawnZ = ARENA_Z + (SPAWN_RADIUS * Math.sin(angle));
        
        // Spawn lightning at destination (visual only, no damage)
        net.minecraft.entity.LightningEntity lightning = net.minecraft.entity.EntityType.LIGHTNING_BOLT.create(server.getOverworld());
        if (lightning != null) {
            lightning.setPosition(spawnX, ARENA_Y, spawnZ);
            lightning.setCosmetic(true); // No damage!
            server.getOverworld().spawnEntity(lightning);
        }
        
        // Teleport player
        player.teleport(
            server.getOverworld(),
            spawnX,
            ARENA_Y,
            spawnZ,
            player.getYaw(),
            player.getPitch()
        );
        
        // Global announcement of player arrival
        announceToServer("");
        announceToServer("§5⚡ §e§l" + participant.username + " §7ha llegado a la arena §8[§a" + (index + 1) + "§8/§a" + totalPlayers + "§8]");
        
        // Personal message to the player
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§5§l⚡ ¡BIENVENIDO AL TORNEO! ⚡"));
        player.sendMessage(Text.literal("§7Tu seed: §e#" + participant.seed));
        player.sendMessage(Text.literal("§7Posición: §a" + (index + 1) + " §7de §a" + totalPlayers));
        player.sendMessage(Text.literal(""));
        
        // Play thunder sound to everyone nearby
        for (ServerPlayerEntity nearby : server.getPlayerManager().getPlayerList()) {
            if (nearby != null && !nearby.isDisconnected()) {
                nearby.playSoundToPlayer(
                    net.minecraft.sound.SoundEvents.ENTITY_LIGHTNING_BOLT_THUNDER,
                    net.minecraft.sound.SoundCategory.WEATHER,
                    0.8f,
                    1.0f
                );
            }
        }
        
        logger.info("Teleported " + participant.username + " to tournament arena (position " + (index + 1) + ")");
    }
    
    /**
     * Called when a tournament transitions from registration to active
     * Triggers the epic teleport sequence with match announcements
     */
    public void onTournamentStart(String tournamentId) {
        // Fetch tournament participants and bracket
        httpClient.getAsync("/api/tournaments/" + tournamentId)
            .thenAccept(response -> {
                if (response == null || !response.has("data")) return;
                
                try {
                    JsonObject tournament = response.getAsJsonObject("data");
                    String tournamentName = tournament.get("name").getAsString();
                    JsonArray participantsArray = tournament.getAsJsonArray("participants");
                    
                    // Build participant list sorted by seed
                    List<ParticipantData> participants = new java.util.ArrayList<>();
                    Map<String, String> participantIdToName = new java.util.HashMap<>();
                    
                    for (JsonElement elem : participantsArray) {
                        JsonObject p = elem.getAsJsonObject();
                        if (p.has("minecraftUuid") && !p.get("minecraftUuid").isJsonNull()) {
                            String uuidStr = p.get("minecraftUuid").getAsString();
                            String username = p.get("username").getAsString();
                            int seed = p.get("seed").getAsInt();
                            String participantId = p.get("id").getAsString();
                            
                            participantIdToName.put(participantId, username);
                            
                            try {
                                participants.add(new ParticipantData(UUID.fromString(uuidStr), username, seed));
                            } catch (Exception e) {
                                logger.debug("Invalid UUID: " + uuidStr);
                            }
                        }
                    }
                    
                    // Sort by seed
                    participants.sort((a, b) -> Integer.compare(a.seed, b.seed));
                    
                    // Build match list from bracket (first round only)
                    List<MatchData> matches = new java.util.ArrayList<>();
                    if (tournament.has("bracket") && !tournament.get("bracket").isJsonNull()) {
                        JsonObject bracket = tournament.getAsJsonObject("bracket");
                        if (bracket.has("rounds")) {
                            JsonArray rounds = bracket.getAsJsonArray("rounds");
                            if (rounds.size() > 0) {
                                JsonObject firstRound = rounds.get(0).getAsJsonObject();
                                JsonArray matchesArray = firstRound.getAsJsonArray("matches");
                                
                                int matchNum = 1;
                                for (JsonElement matchElem : matchesArray) {
                                    JsonObject match = matchElem.getAsJsonObject();
                                    String p1Id = match.has("player1Id") && !match.get("player1Id").isJsonNull() 
                                        ? match.get("player1Id").getAsString() : null;
                                    String p2Id = match.has("player2Id") && !match.get("player2Id").isJsonNull() 
                                        ? match.get("player2Id").getAsString() : null;
                                    
                                    String p1Name = p1Id != null ? participantIdToName.getOrDefault(p1Id, "TBD") : "TBD";
                                    String p2Name = p2Id != null ? participantIdToName.getOrDefault(p2Id, "TBD") : "TBD";
                                    
                                    if (!"TBD".equals(p1Name) && !"TBD".equals(p2Name)) {
                                        matches.add(new MatchData(p1Name, p2Name, matchNum++));
                                    }
                                }
                            }
                        }
                    }
                    
                    if (!participants.isEmpty()) {
                        startTournamentEpic(tournamentId, participants, matches, tournamentName);
                    }
                    
                } catch (Exception e) {
                    logger.error("Error starting epic tournament: " + e.getMessage());
                    e.printStackTrace();
                }
            })
            .exceptionally(ex -> {
                logger.error("Error fetching tournament for epic start: " + ex.getMessage());
                return null;
            });
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    private boolean isValidTournamentCode(String code) {
        if (code == null || code.length() != 6) return false;
        return code.matches("^[A-Za-z0-9]{6}$");
    }
    
    private String getStatusDisplay(String status) {
        switch (status) {
            case "registration": return "§a● Inscripciones Abiertas";
            case "upcoming": return "§e● Próximamente";
            case "active": return "§b● En Curso";
            case "completed": return "§7● Finalizado";
            case "cancelled": return "§c● Cancelado";
            default: return "§7● " + status;
        }
    }
    
    private String getIdFromJson(JsonElement idElement) {
        if (idElement == null || idElement.isJsonNull()) return "";
        if (idElement.isJsonObject()) {
            // MongoDB extended JSON format: { "$oid": "..." }
            return idElement.getAsJsonObject().get("$oid").getAsString();
        }
        return idElement.getAsString();
    }
    
    private String getParticipantIdByUuid(JsonObject tournament, String uuid) {
        try {
            JsonArray participants = tournament.getAsJsonArray("participants");
            for (JsonElement elem : participants) {
                JsonObject p = elem.getAsJsonObject();
                if (p.get("minecraftUuid").getAsString().equals(uuid)) {
                    return p.get("id").getAsString();
                }
            }
        } catch (Exception e) {
            logger.debug("Error getting participant ID: " + e.getMessage());
        }
        return null;
    }
    
    private String getParticipantNameById(JsonObject tournament, String participantId) {
        if (participantId == null) return null;
        try {
            JsonArray participants = tournament.getAsJsonArray("participants");
            for (JsonElement elem : participants) {
                JsonObject p = elem.getAsJsonObject();
                if (p.get("id").getAsString().equals(participantId)) {
                    return p.get("username").getAsString();
                }
            }
        } catch (Exception e) {
            logger.debug("Error getting participant name: " + e.getMessage());
        }
        return null;
    }
    
    private JsonObject createPlayerPayload(UUID uuid) {
        JsonObject payload = new JsonObject();
        payload.addProperty("minecraftUuid", uuid.toString());
        return payload;
    }
    
    /**
     * Check if a player is in an active tournament
     */
    public boolean isPlayerInTournament(UUID playerUuid) {
        return playerTournaments.containsKey(playerUuid);
    }
    
    /**
     * Get cached tournament for a player
     */
    public CachedTournament getPlayerTournament(UUID playerUuid) {
        return playerTournaments.get(playerUuid);
    }
    
    /**
     * Get active match for a player
     */
    public CachedMatch getPlayerActiveMatch(UUID playerUuid) {
        return activeMatches.get(playerUuid);
    }
    
    public void shutdown() {
        logger.info("Tournament system shutting down...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
        playerTournaments.clear();
        activeMatches.clear();
        knownTournamentIds.clear();
        tournamentStatuses.clear();
        
        if (notificationManager != null) {
            notificationManager.shutdown();
        }
    }
    
    // ============================================
    // INNER CLASSES
    // ============================================
    
    /**
     * Cached tournament data for a player
     */
    public static class CachedTournament {
        public String id;
        public String code;
        public String name;
        public String status;
        public String participantId;
        public int seed;
        public long lastUpdated;
    }
    
    /**
     * Cached match data
     */
    public static class CachedMatch {
        public String matchId;
        public String opponentId;
        public String opponentName;
        public int roundNumber;
        public String status;
    }
}
