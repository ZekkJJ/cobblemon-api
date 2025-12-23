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
     * Poll backend for tournaments with open registration and announce new ones
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
