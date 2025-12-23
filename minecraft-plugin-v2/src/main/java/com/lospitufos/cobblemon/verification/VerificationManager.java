package com.lospitufos.cobblemon.verification;

import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.core.LosPitufosPlugin;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * NEW VERIFICATION FLOW:
 * 1. User logs in with Discord on WEB → rolls gacha → gets 5-digit code
 * 2. User enters game and uses /verify <code>
 * 3. Plugin sends code + minecraftUuid to backend
 * 4. Backend links discordId (from code) with minecraftUuid → verified!
 * 
 * This is the OPPOSITE of the old flow where code was generated in-game.
 */
public class VerificationManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final Map<UUID, Boolean> verifiedPlayers = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private PlayerMovementBlocker movementBlocker;
    private MinecraftServer server;
    
    public VerificationManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
    }
    
    public void initialize(MinecraftServer server, com.lospitufos.cobblemon.core.Config config) {
        this.server = server;
        logger.info("Verification system initializing (NEW WEB-FIRST FLOW)...");
        
        // Initialize movement blocker
        movementBlocker = new PlayerMovementBlocker(this, config, logger);
        movementBlocker.initialize(server);
        
        // Register join event
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server1) -> {
            onPlayerJoin(handler.getPlayer());
        });
        
        // Start verification status checker (every 10 seconds for unverified players)
        scheduler.scheduleAtFixedRate(this::checkVerificationStatus, 10, 10, TimeUnit.SECONDS);
        
        logger.info("✓ Verification system initialized (WEB-FIRST FLOW)");
    }

    /**
     * Periodically check if unverified players have been verified
     * Only checks ONE player per cycle to avoid lag
     */
    private void checkVerificationStatus() {
        if (server == null) return;
        
        try {
            for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
                if (player == null || player.isDisconnected()) continue;
                
                UUID uuid = player.getUuid();
                Boolean isVerified = verifiedPlayers.get(uuid);
                
                // Only check unverified players
                if (isVerified != null && !isVerified) {
                    // Check verification status from API (async)
                    JsonObject payload = new JsonObject();
                    payload.addProperty("uuid", uuid.toString());
                    payload.addProperty("username", player.getName().getString());
                    payload.addProperty("online", true);
                    
                    httpClient.postAsync("/api/players/sync", payload)
                        .thenAccept(response -> {
                            if (response != null && response.has("verified") && response.get("verified").getAsBoolean()) {
                                verifiedPlayers.put(uuid, true);
                                
                                ServerPlayerEntity onlinePlayer = server.getPlayerManager().getPlayer(uuid);
                                if (onlinePlayer != null && !onlinePlayer.isDisconnected()) {
                                    onlinePlayer.sendMessage(Text.literal(""));
                                    onlinePlayer.sendMessage(Text.literal("§a§l✓ ¡Cuenta verificada exitosamente!"));
                                    onlinePlayer.sendMessage(Text.literal("§7Ya puedes jugar normalmente."));
                                    onlinePlayer.sendMessage(Text.literal(""));
                                }
                                
                                logger.info("Player " + player.getName().getString() + " verified!");
                            }
                        })
                        .exceptionally(throwable -> null);
                    
                    // Only check ONE player per cycle
                    break;
                }
            }
        } catch (Exception e) {
            logger.debug("Error in verification checker: " + e.getMessage());
        }
    }

    /**
     * Handle /verify <code> command - NEW FLOW
     * Links Minecraft account to Discord via web-generated code
     */
    public void handleVerifyCommand(ServerPlayerEntity player, String code) {
        if (player == null || code == null || code.isEmpty()) {
            return;
        }
        
        UUID uuid = player.getUuid();
        String username = player.getName().getString();
        
        // Check if already verified
        if (isVerified(uuid)) {
            player.sendMessage(Text.literal("§a✓ Tu cuenta ya está verificada."));
            return;
        }
        
        // Validate code format (5 digits)
        if (!code.matches("\\d{5}")) {
            player.sendMessage(Text.literal("§c✗ Código inválido. Debe ser un código de 5 dígitos."));
            player.sendMessage(Text.literal("§7Obtén tu código en: §b" + getWebUrl() + "/verificar"));
            return;
        }
        
        player.sendMessage(Text.literal("§e⏳ Verificando código..."));
        
        // Send verification request to backend (async, no lag)
        JsonObject payload = new JsonObject();
        payload.addProperty("minecraftUuid", uuid.toString());
        payload.addProperty("minecraftUsername", username);
        payload.addProperty("code", code);
        
        httpClient.postAsync("/api/verification/link", payload)
            .thenAccept(response -> {
                // Execute on main thread for player messages
                server.execute(() -> {
                    if (response == null) {
                        player.sendMessage(Text.literal("§c✗ Error de conexión. Intenta de nuevo."));
                        return;
                    }
                    
                    if (response.has("success") && response.get("success").getAsBoolean()) {
                        verifiedPlayers.put(uuid, true);
                        
                        String discordUsername = response.has("discordUsername") 
                            ? response.get("discordUsername").getAsString() 
                            : "Discord";
                        
                        player.sendMessage(Text.literal(""));
                        player.sendMessage(Text.literal("§a§l✓ ¡CUENTA VERIFICADA!"));
                        player.sendMessage(Text.literal("§7Vinculado a Discord: §b" + discordUsername));
                        player.sendMessage(Text.literal("§7Ya puedes jugar normalmente y usar la tienda web."));
                        player.sendMessage(Text.literal(""));
                        
                        logger.info("Player " + username + " verified via web code, linked to " + discordUsername);
                    } else {
                        String message = response.has("message") 
                            ? response.get("message").getAsString() 
                            : "Error desconocido";
                        
                        player.sendMessage(Text.literal("§c✗ " + message));
                        
                        if (message.contains("expirado") || message.contains("inválido")) {
                            player.sendMessage(Text.literal("§7Genera un nuevo código en: §b" + getWebUrl() + "/verificar"));
                        }
                    }
                });
            })
            .exceptionally(throwable -> {
                server.execute(() -> {
                    player.sendMessage(Text.literal("§c✗ Error de conexión. Intenta de nuevo."));
                    logger.error("Verification error for " + username + ": " + throwable.getMessage());
                });
                return null;
            });
    }

    /**
     * Handle /codigo command - Show verification instructions
     */
    public void handleCodigoCommand(ServerPlayerEntity player) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        
        if (isVerified(uuid)) {
            player.sendMessage(Text.literal("§a✓ Tu cuenta ya está verificada."));
            return;
        }
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
        player.sendMessage(Text.literal("§c⚠ Tu cuenta no está verificada"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§aPara verificar tu cuenta:"));
        player.sendMessage(Text.literal("§71. Ve a: §b" + getWebUrl()));
        player.sendMessage(Text.literal("§72. Inicia sesión con Discord"));
        player.sendMessage(Text.literal("§73. Haz tu tirada del gacha"));
        player.sendMessage(Text.literal("§74. Copia el código de 5 dígitos"));
        player.sendMessage(Text.literal("§75. Usa: §f/verify <código>"));
        player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
        player.sendMessage(Text.literal(""));
    }
    
    private void onPlayerJoin(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        
        // Check ban status FIRST (async)
        httpClient.getAsync("/api/admin/ban-status?uuid=" + uuid.toString())
            .thenAccept(banResponse -> {
                if (banResponse != null && banResponse.has("banned") && banResponse.get("banned").getAsBoolean()) {
                    String reason = banResponse.has("banReason") ? banResponse.get("banReason").getAsString() : "Sin razón especificada";
                    player.networkHandler.disconnect(
                        Text.literal(
                            "§c§l¡Estás baneado del servidor!\n\n" +
                            "§7Razón: §f" + reason + "\n\n" +
                            "§7Si crees que es un error, contacta a un administrador."
                        )
                    );
                    logger.info("Blocked banned player: " + player.getName().getString());
                    return;
                }
                
                // Check verification status
                checkPlayerVerification(player);
            })
            .exceptionally(throwable -> {
                checkPlayerVerification(player);
                return null;
            });
    }
    
    private void checkPlayerVerification(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        
        JsonObject payload = new JsonObject();
        payload.addProperty("uuid", uuid.toString());
        payload.addProperty("username", player.getName().getString());
        payload.addProperty("online", true);
        
        httpClient.postAsync("/api/players/sync", payload)
            .thenAccept(response -> {
                boolean verified = response != null && response.has("verified") && response.get("verified").getAsBoolean();
                verifiedPlayers.put(uuid, verified);
                
                if (!verified) {
                    // Show verification instructions (on main thread)
                    server.execute(() -> showVerificationInstructions(player));
                } else {
                    logger.info("Player " + player.getName().getString() + " is verified");
                }
            })
            .exceptionally(throwable -> {
                verifiedPlayers.put(uuid, false);
                server.execute(() -> showVerificationInstructions(player));
                return null;
            });
    }
    
    private void showVerificationInstructions(ServerPlayerEntity player) {
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
        player.sendMessage(Text.literal("§c⚠ Tu cuenta no está verificada"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§aPara verificar:"));
        player.sendMessage(Text.literal("§71. Ve a: §b" + getWebUrl()));
        player.sendMessage(Text.literal("§72. Inicia sesión con Discord"));
        player.sendMessage(Text.literal("§73. Haz tu tirada del gacha"));
        player.sendMessage(Text.literal("§74. Usa: §f/verify <código de 5 dígitos>"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§7Usa §f/codigo §7para ver estas instrucciones de nuevo."));
        player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
        player.sendMessage(Text.literal(""));
    }
    
    public boolean isVerified(UUID playerUuid) {
        return verifiedPlayers.getOrDefault(playerUuid, false);
    }
    
    private String getWebUrl() {
        try {
            return LosPitufosPlugin.getInstance().getConfig().getFrontendUrl();
        } catch (Exception e) {
            return "https://cobblemon-los-pitufos.vercel.app";
        }
    }
    
    public void shutdown() {
        logger.info("Verification system shutting down...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
        verifiedPlayers.clear();
    }
}
