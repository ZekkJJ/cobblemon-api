package com.lospitufos.cobblemon.tournament;

import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.sound.SoundEvents;
import net.minecraft.text.Text;

import java.util.*;
import java.util.concurrent.*;

/**
 * Notification Manager for Tournament System
 * 
 * Handles all in-game notifications for tournament events:
 * - Match scheduled notifications
 * - Win/loss notifications
 * - No-show warnings
 * - Tournament announcements
 */
public class NotificationManager {
    
    private final ModLogger logger;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    
    // Track no-show warnings (player UUID -> scheduled warning task)
    private final Map<UUID, ScheduledFuture<?>> noShowWarnings = new ConcurrentHashMap<>();
    
    private MinecraftServer server;
    
    private static final int NO_SHOW_WARNING_MINUTES = 5;
    private static final int NO_SHOW_FORFEIT_MINUTES = 10;
    
    public NotificationManager(ModLogger logger) {
        this.logger = logger;
    }
    
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Notification manager initialized");
    }
    
    // ============================================
    // MATCH NOTIFICATIONS
    // ============================================
    
    /**
     * Notify player that their match is scheduled
     */
    public void notifyMatchScheduled(UUID playerUuid, String opponentName, int roundNumber, String tournamentName) {
        if (server == null) return;
        
        ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerUuid);
        if (player == null || player.isDisconnected()) return;
        
        // Send formatted message
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§6§l╔═══════════════════════════════╗"));
        player.sendMessage(Text.literal("§6§l║    §e§l¡MATCH PROGRAMADO!    §6§l║"));
        player.sendMessage(Text.literal("§6§l╠═══════════════════════════════╣"));
        player.sendMessage(Text.literal("§6§l║ §7Torneo: §f" + padRight(tournamentName, 18) + "§6§l║"));
        player.sendMessage(Text.literal("§6§l║ §7Ronda: §f" + padRight(String.valueOf(roundNumber), 19) + "§6§l║"));
        player.sendMessage(Text.literal("§6§l║ §7Oponente: §c" + padRight(opponentName, 16) + "§6§l║"));
        player.sendMessage(Text.literal("§6§l╠═══════════════════════════════╣"));
        player.sendMessage(Text.literal("§6§l║ §e¡Busca a tu oponente y pelea! §6§l║"));
        player.sendMessage(Text.literal("§6§l╚═══════════════════════════════╝"));
        player.sendMessage(Text.literal(""));
        
        // Play notification sound
        playNotificationSound(player);
        
        // Schedule no-show warning
        scheduleNoShowWarning(playerUuid, opponentName, tournamentName);
        
        logger.info("Notified " + player.getName().getString() + " about match vs " + opponentName);
    }
    
    /**
     * Notify player of victory
     */
    public void notifyVictory(UUID playerUuid, String tournamentName, String nextOpponent, int nextRound) {
        if (server == null) return;
        
        ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerUuid);
        if (player == null || player.isDisconnected()) return;
        
        // Cancel any pending no-show warnings
        cancelNoShowWarning(playerUuid);
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§a§l╔═══════════════════════════════╗"));
        player.sendMessage(Text.literal("§a§l║      §6§l✓ ¡VICTORIA!      §a§l║"));
        player.sendMessage(Text.literal("§a§l╠═══════════════════════════════╣"));
        player.sendMessage(Text.literal("§a§l║ §7Torneo: §f" + padRight(tournamentName, 18) + "§a§l║"));
        player.sendMessage(Text.literal("§a§l║ §7¡Avanzas a la siguiente ronda! §a§l║"));
        
        if (nextOpponent != null) {
            player.sendMessage(Text.literal("§a§l╠═══════════════════════════════╣"));
            player.sendMessage(Text.literal("§a§l║ §7Próximo oponente: §c" + padRight(nextOpponent, 10) + "§a§l║"));
            player.sendMessage(Text.literal("§a§l║ §7Ronda: §f" + padRight(String.valueOf(nextRound), 19) + "§a§l║"));
        }
        
        player.sendMessage(Text.literal("§a§l╚═══════════════════════════════╝"));
        player.sendMessage(Text.literal(""));
        
        // Play victory sound
        playVictorySound(player);
    }
    
    /**
     * Notify player of elimination
     */
    public void notifyElimination(UUID playerUuid, String tournamentName, int finalPlacement) {
        if (server == null) return;
        
        ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerUuid);
        if (player == null || player.isDisconnected()) return;
        
        // Cancel any pending no-show warnings
        cancelNoShowWarning(playerUuid);
        
        String placementText = getPlacementText(finalPlacement);
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§c§l╔═══════════════════════════════╗"));
        player.sendMessage(Text.literal("§c§l║    §4§l✗ ELIMINADO    §c§l║"));
        player.sendMessage(Text.literal("§c§l╠═══════════════════════════════╣"));
        player.sendMessage(Text.literal("§c§l║ §7Torneo: §f" + padRight(tournamentName, 18) + "§c§l║"));
        player.sendMessage(Text.literal("§c§l║ §7Posición final: §e" + padRight(placementText, 13) + "§c§l║"));
        player.sendMessage(Text.literal("§c§l╠═══════════════════════════════╣"));
        player.sendMessage(Text.literal("§c§l║ §7¡Gracias por participar!     §c§l║"));
        player.sendMessage(Text.literal("§c§l╚═══════════════════════════════╝"));
        player.sendMessage(Text.literal(""));
        
        // Play elimination sound
        playEliminationSound(player);
    }
    
    /**
     * Notify player they won the tournament
     */
    public void notifyTournamentWin(UUID playerUuid, String tournamentName) {
        if (server == null) return;
        
        ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerUuid);
        if (player == null || player.isDisconnected()) return;
        
        // Cancel any pending no-show warnings
        cancelNoShowWarning(playerUuid);
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§6§l╔═══════════════════════════════════════╗"));
        player.sendMessage(Text.literal("§6§l║                                       ║"));
        player.sendMessage(Text.literal("§6§l║   §e§l★ ★ ★ §6§l¡CAMPEÓN! §e§l★ ★ ★   §6§l║"));
        player.sendMessage(Text.literal("§6§l║                                       ║"));
        player.sendMessage(Text.literal("§6§l╠═══════════════════════════════════════╣"));
        player.sendMessage(Text.literal("§6§l║ §7Torneo: §f" + padRight(tournamentName, 24) + "§6§l║"));
        player.sendMessage(Text.literal("§6§l║                                       ║"));
        player.sendMessage(Text.literal("§6§l║ §e¡Felicidades! Has ganado el torneo! §6§l║"));
        player.sendMessage(Text.literal("§6§l║                                       ║"));
        player.sendMessage(Text.literal("§6§l╚═══════════════════════════════════════╝"));
        player.sendMessage(Text.literal(""));
        
        // Play champion sound
        playChampionSound(player);
    }
    
    // ============================================
    // NO-SHOW WARNINGS
    // ============================================
    
    /**
     * Schedule no-show warning for a player
     */
    private void scheduleNoShowWarning(UUID playerUuid, String opponentName, String tournamentName) {
        // Cancel any existing warning
        cancelNoShowWarning(playerUuid);
        
        // Schedule warning after 5 minutes
        ScheduledFuture<?> warningTask = scheduler.schedule(() -> {
            sendNoShowWarning(playerUuid, NO_SHOW_FORFEIT_MINUTES - NO_SHOW_WARNING_MINUTES, opponentName, tournamentName);
        }, NO_SHOW_WARNING_MINUTES, TimeUnit.MINUTES);
        
        noShowWarnings.put(playerUuid, warningTask);
    }
    
    /**
     * Send no-show warning to player
     */
    private void sendNoShowWarning(UUID playerUuid, int minutesRemaining, String opponentName, String tournamentName) {
        if (server == null) return;
        
        server.execute(() -> {
            ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerUuid);
            if (player == null || player.isDisconnected()) return;
            
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§c§l⚠ ¡ADVERTENCIA DE NO-SHOW! ⚠"));
            player.sendMessage(Text.literal("§7Torneo: §f" + tournamentName));
            player.sendMessage(Text.literal("§7Oponente: §c" + opponentName));
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§cTienes §e" + minutesRemaining + " minutos §cpara comenzar tu match."));
            player.sendMessage(Text.literal("§cSi no te presentas, serás §4DESCALIFICADO§c."));
            player.sendMessage(Text.literal(""));
            
            // Play warning sound
            playWarningSound(player);
        });
    }
    
    /**
     * Cancel no-show warning for a player
     */
    public void cancelNoShowWarning(UUID playerUuid) {
        ScheduledFuture<?> task = noShowWarnings.remove(playerUuid);
        if (task != null) {
            task.cancel(false);
        }
    }
    
    // ============================================
    // SERVER ANNOUNCEMENTS
    // ============================================
    
    /**
     * Announce tournament creation to server with registration countdown
     */
    public void announceTournamentCreated(String tournamentName, String startDate, String code, int registrationSeconds) {
        if (server == null) return;
        
        // Initial announcement
        String initialMessage = String.format(
            "\n" +
            "§6§l╔═══════════════════════════════════════════╗\n" +
            "§6§l║     §e§l⚔ ¡NUEVO TORNEO POKÉMON! ⚔     §6§l║\n" +
            "§6§l╠═══════════════════════════════════════════╣\n" +
            "§6§l║ §7Nombre: §f%-30s §6§l║\n" +
            "§6§l║ §7Fecha: §f%-31s §6§l║\n" +
            "§6§l╠═══════════════════════════════════════════╣\n" +
            "§6§l║ §a§lINSCRIPCIONES ABIERTAS POR %d SEGUNDOS! §6§l║\n" +
            "§6§l║                                           §6§l║\n" +
            "§6§l║   §eUsa: §f/torneo join §b%s            §6§l║\n" +
            "§6§l║                                           §6§l║\n" +
            "§6§l╚═══════════════════════════════════════════╝\n",
            tournamentName, startDate, registrationSeconds, code
        );
        
        broadcastToAll(initialMessage);
        playAnnouncementSound();
        
        // Schedule countdown reminders
        if (registrationSeconds >= 20) {
            // Reminder at half time
            int halfTime = registrationSeconds / 2;
            scheduler.schedule(() -> {
                server.execute(() -> {
                    broadcastToAll(String.format(
                        "§6§l[TORNEO] §e¡Quedan §c%d segundos §epara inscribirse! §7/torneo join §b%s",
                        halfTime, code
                    ));
                    playWarningSound();
                });
            }, halfTime, TimeUnit.SECONDS);
        }
        
        // 10 second warning
        if (registrationSeconds >= 15) {
            scheduler.schedule(() -> {
                server.execute(() -> {
                    broadcastToAll(String.format(
                        "§c§l[TORNEO] §c¡ÚLTIMOS 10 SEGUNDOS! §7/torneo join §b%s",
                        code
                    ));
                    playWarningSound();
                });
            }, registrationSeconds - 10, TimeUnit.SECONDS);
        }
        
        // 5 second countdown
        for (int i = 5; i >= 1; i--) {
            final int secondsLeft = i;
            scheduler.schedule(() -> {
                server.execute(() -> {
                    broadcastToAll(String.format("§c§l[TORNEO] §4%d...", secondsLeft));
                });
            }, registrationSeconds - i, TimeUnit.SECONDS);
        }
        
        // Registration closed message
        scheduler.schedule(() -> {
            server.execute(() -> {
                broadcastToAll(String.format(
                    "\n§c§l[TORNEO] §c¡INSCRIPCIONES CERRADAS para %s!\n",
                    tournamentName
                ));
            });
        }, registrationSeconds, TimeUnit.SECONDS);
    }
    
    /**
     * Simple announcement without countdown (for already open tournaments)
     */
    public void announceTournamentOpen(String tournamentName, String code) {
        if (server == null) return;
        
        String message = String.format(
            "\n§6§l[TORNEO] §eTorneo §f%s §econ inscripciones abiertas!\n" +
            "§7Usa §e/torneo join §b%s §7para inscribirte.\n",
            tournamentName, code
        );
        
        broadcastToAll(message);
    }
    
    /**
     * Play announcement sound to all players
     */
    private void playAnnouncementSound() {
        if (server == null) return;
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player != null && !player.isDisconnected()) {
                player.playSound(SoundEvents.ENTITY_ENDER_DRAGON_GROWL, 0.5f, 1.5f);
            }
        }
    }
    
    private void playWarningSound() {
        if (server == null) return;
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player != null && !player.isDisconnected()) {
                player.playSound(SoundEvents.BLOCK_NOTE_BLOCK_BELL.value(), 1.0f, 1.0f);
            }
        }
    }
    
    /**
     * Announce tournament start
     */
    public void announceTournamentStarted(String tournamentName, int participantCount) {
        if (server == null) return;
        
        String message = String.format(
            "\n§a§l═══ ¡TORNEO INICIADO! ═══\n" +
            "§7Nombre: §f%s\n" +
            "§7Participantes: §f%d\n" +
            "§e¡Que comience la batalla!\n" +
            "§a§l═════════════════════════\n",
            tournamentName, participantCount
        );
        
        broadcastToAll(message);
    }
    
    /**
     * Announce tournament winner
     */
    public void announceTournamentWinner(String tournamentName, String winnerName) {
        if (server == null) return;
        
        String message = String.format(
            "\n§6§l★★★ ¡CAMPEÓN DEL TORNEO! ★★★\n" +
            "§7Torneo: §f%s\n" +
            "§7Ganador: §e§l%s\n" +
            "§6¡Felicidades al campeón!\n" +
            "§6§l★★★★★★★★★★★★★★★★★★★★★★★★★★★\n",
            tournamentName, winnerName
        );
        
        broadcastToAll(message);
    }
    
    /**
     * Broadcast message to all online players
     */
    private void broadcastToAll(String message) {
        if (server == null) return;
        
        for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
            if (player != null && !player.isDisconnected()) {
                player.sendMessage(Text.literal(message));
            }
        }
    }
    
    // ============================================
    // SOUND EFFECTS
    // ============================================
    
    private void playNotificationSound(ServerPlayerEntity player) {
        player.playSound(SoundEvents.ENTITY_EXPERIENCE_ORB_PICKUP, 1.0f, 1.0f);
    }
    
    private void playVictorySound(ServerPlayerEntity player) {
        player.playSound(SoundEvents.UI_TOAST_CHALLENGE_COMPLETE, 1.0f, 1.0f);
    }
    
    private void playEliminationSound(ServerPlayerEntity player) {
        player.playSound(SoundEvents.ENTITY_VILLAGER_NO, 1.0f, 0.8f);
    }
    
    private void playChampionSound(ServerPlayerEntity player) {
        player.playSound(SoundEvents.UI_TOAST_CHALLENGE_COMPLETE, 1.0f, 1.2f);
        // Play additional fanfare
        scheduler.schedule(() -> {
            server.execute(() -> {
                if (!player.isDisconnected()) {
                    player.playSound(SoundEvents.ENTITY_FIREWORK_ROCKET_BLAST, 1.0f, 1.0f);
                }
            });
        }, 500, TimeUnit.MILLISECONDS);
    }
    
    private void playWarningSound(ServerPlayerEntity player) {
        player.playSound(SoundEvents.BLOCK_NOTE_BLOCK_BELL.value(), 1.0f, 0.5f);
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    private String padRight(String text, int length) {
        if (text == null) text = "";
        if (text.length() >= length) return text.substring(0, length);
        return text + " ".repeat(length - text.length());
    }
    
    private String getPlacementText(int placement) {
        switch (placement) {
            case 1: return "1° - Campeón";
            case 2: return "2° - Finalista";
            case 3:
            case 4: return placement + "° - Semifinal";
            case 5:
            case 6:
            case 7:
            case 8: return placement + "° - Cuartos";
            default: return placement + "°";
        }
    }
    
    public void shutdown() {
        logger.info("Notification manager shutting down...");
        
        // Cancel all pending warnings
        for (ScheduledFuture<?> task : noShowWarnings.values()) {
            task.cancel(false);
        }
        noShowWarnings.clear();
        
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
    }
}
