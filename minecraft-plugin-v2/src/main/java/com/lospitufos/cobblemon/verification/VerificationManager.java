package com.lospitufos.cobblemon.verification;

import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.core.LosPitufosPlugin;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.ClickEvent;
import net.minecraft.text.HoverEvent;
import net.minecraft.text.Style;
import net.minecraft.text.Text;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * NEW VERIFICATION FLOW (Discord Channel):
 * 1. Player joins Minecraft server (unverified)
 * 2. Plugin generates 5-character code and shows it to player
 * 3. Player posts code in ANY Discord channel of the server
 * 4. Discord bot reads message and links accounts automatically
 * 5. Player is verified and can play normally
 */
public class VerificationManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final Map<UUID, Boolean> verifiedPlayers = new ConcurrentHashMap<>();
    private final Map<UUID, String> pendingCodes = new ConcurrentHashMap<>();
    private final Map<UUID, Long> lastReminderTime = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private PlayerMovementBlocker movementBlocker;
    private MinecraftServer server;
    
    private static final long REMINDER_INTERVAL_MS = 10000; // 10 seconds
    
    public VerificationManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
    }
    
    public void initialize(MinecraftServer server, com.lospitufos.cobblemon.core.Config config) {
        this.server = server;
        logger.info("Verification system initializing (DISCORD CHANNEL FLOW)...");
        
        // Initialize movement blocker
        movementBlocker = new PlayerMovementBlocker(this, config, logger);
        movementBlocker.initialize(server);
        
        // Register join event
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server1) -> {
            onPlayerJoin(handler.getPlayer());
        });
        
        // Start verification checker (every 5 seconds)
        scheduler.scheduleAtFixedRate(this::checkVerificationAndRemind, 5, 5, TimeUnit.SECONDS);
        
        logger.info("Verification system initialized (DISCORD CHANNEL FLOW)");
    }


    /**
     * Periodically check verification status and remind unverified players
     */
    private void checkVerificationAndRemind() {
        if (server == null) return;
        
        try {
            long now = System.currentTimeMillis();
            
            for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
                if (player == null || player.isDisconnected()) continue;
                
                UUID uuid = player.getUuid();
                Boolean isVerified = verifiedPlayers.get(uuid);
                
                // Only process unverified players
                if (isVerified != null && !isVerified) {
                    // Check if player has been verified via Discord
                    checkPlayerVerificationAsync(player);
                    
                    // Send reminder every 10 seconds
                    Long lastReminder = lastReminderTime.get(uuid);
                    if (lastReminder == null || (now - lastReminder) >= REMINDER_INTERVAL_MS) {
                        sendVerificationReminder(player);
                        lastReminderTime.put(uuid, now);
                    }
                }
            }
        } catch (Exception e) {
            logger.debug("Error in verification checker: " + e.getMessage());
        }
    }
    
    /**
     * Check if player has been verified (async)
     */
    private void checkPlayerVerificationAsync(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        
        JsonObject payload = new JsonObject();
        payload.addProperty("uuid", uuid.toString());
        payload.addProperty("username", player.getName().getString());
        payload.addProperty("online", true);
        
        httpClient.postAsync("/api/players/sync", payload)
            .thenAccept(response -> {
                if (response != null && response.has("verified") && response.get("verified").getAsBoolean()) {
                    verifiedPlayers.put(uuid, true);
                    pendingCodes.remove(uuid);
                    lastReminderTime.remove(uuid);
                    
                    String discordUsername = response.has("discordUsername") 
                        ? response.get("discordUsername").getAsString() 
                        : "Discord";
                    
                    server.execute(() -> {
                        ServerPlayerEntity onlinePlayer = server.getPlayerManager().getPlayer(uuid);
                        if (onlinePlayer != null && !onlinePlayer.isDisconnected()) {
                            onlinePlayer.sendMessage(Text.literal(""));
                            onlinePlayer.sendMessage(Text.literal("\u00A7a\u00A7l\u2713 \u00A1CUENTA VERIFICADA!"));
                            onlinePlayer.sendMessage(Text.literal("\u00A77Vinculado a Discord: \u00A7b" + discordUsername));
                            onlinePlayer.sendMessage(Text.literal("\u00A77Ya puedes jugar normalmente."));
                            onlinePlayer.sendMessage(Text.literal(""));
                        }
                    });
                    
                    logger.info("Player " + player.getName().getString() + " verified via Discord!");
                }
            })
            .exceptionally(throwable -> null);
    }
    
    /**
     * Send verification reminder to player
     */
    private void sendVerificationReminder(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        String code = pendingCodes.get(uuid);
        
        if (code == null) return;
        
        // Create clickable code text
        Text codeText = Text.literal("\u00A7e\u00A7l" + code)
            .setStyle(Style.EMPTY
                .withClickEvent(new ClickEvent(ClickEvent.Action.COPY_TO_CLIPBOARD, code))
                .withHoverEvent(new HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.literal("\u00A7aClick para copiar el codigo")))
            );
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("\u00A7c\u00A7l\u26A0 VERIFICACION REQUERIDA"));
        player.sendMessage(Text.literal("\u00A77Pon este codigo en el Discord del servidor:"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("\u00A78[").append(codeText).append(Text.literal("\u00A78]")));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("\u00A77Discord: \u00A7bdiscord.gg/lospitufos"));
        player.sendMessage(Text.literal("\u00A78(Click en el codigo para copiarlo)"));
        player.sendMessage(Text.literal(""));
    }

    
    /**
     * Handle player join - generate code if not verified
     */
    private void onPlayerJoin(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        
        // Check ban status FIRST (async)
        httpClient.getAsync("/api/admin/ban-status?uuid=" + uuid.toString())
            .thenAccept(banResponse -> {
                if (banResponse != null && banResponse.has("banned") && banResponse.get("banned").getAsBoolean()) {
                    String reason = banResponse.has("banReason") ? banResponse.get("banReason").getAsString() : "Sin razon especificada";
                    player.networkHandler.disconnect(
                        Text.literal(
                            "\u00A7c\u00A7l\u00A1Estas baneado del servidor!\n\n" +
                            "\u00A77Razon: \u00A7f" + reason + "\n\n" +
                            "\u00A77Si crees que es un error, contacta a un administrador."
                        )
                    );
                    logger.info("Blocked banned player: " + player.getName().getString());
                    return;
                }
                
                // Check verification status and generate code if needed
                checkAndGenerateCode(player);
            })
            .exceptionally(throwable -> {
                checkAndGenerateCode(player);
                return null;
            });
    }
    
    /**
     * Check verification status and generate code if not verified
     */
    private void checkAndGenerateCode(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        String username = player.getName().getString();
        
        JsonObject payload = new JsonObject();
        payload.addProperty("uuid", uuid.toString());
        payload.addProperty("username", username);
        payload.addProperty("online", true);
        
        httpClient.postAsync("/api/players/sync", payload)
            .thenAccept(response -> {
                boolean verified = response != null && response.has("verified") && response.get("verified").getAsBoolean();
                verifiedPlayers.put(uuid, verified);
                
                if (!verified) {
                    // Generate verification code
                    generateCodeForPlayer(player);
                } else {
                    logger.info("Player " + username + " is already verified");
                }
            })
            .exceptionally(throwable -> {
                verifiedPlayers.put(uuid, false);
                generateCodeForPlayer(player);
                return null;
            });
    }
    
    /**
     * Generate verification code for player via API
     */
    private void generateCodeForPlayer(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        String username = player.getName().getString();
        
        JsonObject payload = new JsonObject();
        payload.addProperty("minecraftUuid", uuid.toString());
        payload.addProperty("minecraftUsername", username);
        
        httpClient.postAsync("/api/verification/generate-code", payload)
            .thenAccept(response -> {
                if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                    if (response.has("alreadyVerified") && response.get("alreadyVerified").getAsBoolean()) {
                        verifiedPlayers.put(uuid, true);
                        logger.info("Player " + username + " is already verified");
                        return;
                    }
                    
                    String code = response.get("code").getAsString();
                    pendingCodes.put(uuid, code);
                    
                    // Show initial verification message
                    server.execute(() -> showInitialVerificationMessage(player, code));
                    
                    logger.info("Generated code " + code + " for " + username);
                }
            })
            .exceptionally(throwable -> {
                logger.error("Failed to generate code for " + username + ": " + throwable.getMessage());
                return null;
            });
    }

    
    /**
     * Show initial verification message when player joins
     */
    private void showInitialVerificationMessage(ServerPlayerEntity player, String code) {
        // Create clickable code text
        Text codeText = Text.literal("\u00A7e\u00A7l" + code)
            .setStyle(Style.EMPTY
                .withClickEvent(new ClickEvent(ClickEvent.Action.COPY_TO_CLIPBOARD, code))
                .withHoverEvent(new HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.literal("\u00A7aClick para copiar el codigo")))
            );
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("\u00A7e\u00A7l====================================="));
        player.sendMessage(Text.literal("\u00A7c\u00A7l\u26A0 \u00A1BIENVENIDO! Tu cuenta no esta verificada"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("\u00A7aPara verificarte y poder jugar:"));
        player.sendMessage(Text.literal("\u00A771. Ve al Discord del servidor"));
        player.sendMessage(Text.literal("\u00A772. Pon este codigo en CUALQUIER canal:"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("   \u00A78[").append(codeText).append(Text.literal("\u00A78]")));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("\u00A773. \u00A1Listo! El bot te verificara automaticamente"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("\u00A77Discord: \u00A7bhttps://discord.gg/GEmFwa4d"));
        player.sendMessage(Text.literal("\u00A78(Click en el codigo para copiarlo)"));
        player.sendMessage(Text.literal("\u00A7e\u00A7l====================================="));
        player.sendMessage(Text.literal(""));
    }

    /**
     * Handle /verify <code> command - LEGACY support for web-generated codes
     */
    public void handleVerifyCommand(ServerPlayerEntity player, String code) {
        if (player == null || code == null || code.isEmpty()) {
            return;
        }
        
        UUID uuid = player.getUuid();
        String username = player.getName().getString();
        
        // Check if already verified
        if (isVerified(uuid)) {
            player.sendMessage(Text.literal("\u00A7a\u2713 Tu cuenta ya esta verificada."));
            return;
        }
        
        // Validate code format (5 characters alphanumeric)
        if (!code.matches("[A-Za-z0-9]{5}")) {
            player.sendMessage(Text.literal("\u00A7c\u2717 Codigo invalido. Debe ser un codigo de 5 caracteres."));
            return;
        }
        
        player.sendMessage(Text.literal("\u00A7e\u231B Verificando codigo..."));
        
        // Send verification request to backend (async, no lag)
        JsonObject payload = new JsonObject();
        payload.addProperty("minecraftUuid", uuid.toString());
        payload.addProperty("minecraftUsername", username);
        payload.addProperty("code", code.toUpperCase());
        
        httpClient.postAsync("/api/verification/link", payload)
            .thenAccept(response -> {
                server.execute(() -> {
                    if (response == null) {
                        player.sendMessage(Text.literal("\u00A7c\u2717 Error de conexion. Intenta de nuevo."));
                        return;
                    }
                    
                    if (response.has("success") && response.get("success").getAsBoolean()) {
                        verifiedPlayers.put(uuid, true);
                        pendingCodes.remove(uuid);
                        lastReminderTime.remove(uuid);
                        
                        String discordUsername = response.has("discordUsername") 
                            ? response.get("discordUsername").getAsString() 
                            : "Discord";
                        
                        player.sendMessage(Text.literal(""));
                        player.sendMessage(Text.literal("\u00A7a\u00A7l\u2713 \u00A1CUENTA VERIFICADA!"));
                        player.sendMessage(Text.literal("\u00A77Vinculado a Discord: \u00A7b" + discordUsername));
                        player.sendMessage(Text.literal("\u00A77Ya puedes jugar normalmente."));
                        player.sendMessage(Text.literal(""));
                        
                        logger.info("Player " + username + " verified via /verify command");
                    } else {
                        String message = response.has("message") 
                            ? response.get("message").getAsString() 
                            : "Error desconocido";
                        
                        player.sendMessage(Text.literal("\u00A7c\u2717 " + message));
                    }
                });
            })
            .exceptionally(throwable -> {
                server.execute(() -> {
                    player.sendMessage(Text.literal("\u00A7c\u2717 Error de conexion. Intenta de nuevo."));
                });
                return null;
            });
    }


    /**
     * Handle /codigo command - Show current verification code
     */
    public void handleCodigoCommand(ServerPlayerEntity player) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        
        if (isVerified(uuid)) {
            player.sendMessage(Text.literal("\u00A7a\u2713 Tu cuenta ya esta verificada."));
            return;
        }
        
        String code = pendingCodes.get(uuid);
        if (code != null) {
            Text codeText = Text.literal("\u00A7e\u00A7l" + code)
                .setStyle(Style.EMPTY
                    .withClickEvent(new ClickEvent(ClickEvent.Action.COPY_TO_CLIPBOARD, code))
                    .withHoverEvent(new HoverEvent(HoverEvent.Action.SHOW_TEXT, Text.literal("\u00A7aClick para copiar")))
                );
            
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("\u00A7eTu codigo de verificacion:"));
            player.sendMessage(Text.literal("   \u00A78[").append(codeText).append(Text.literal("\u00A78]")));
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("\u00A77Ponlo en cualquier canal del Discord"));
            player.sendMessage(Text.literal("\u00A77Discord: \u00A7bdiscord.gg/lospitufos"));
            player.sendMessage(Text.literal(""));
        } else {
            // Generate new code
            generateCodeForPlayer(player);
            player.sendMessage(Text.literal("\u00A7e\u231B Generando codigo..."));
        }
    }
    
    public boolean isVerified(UUID playerUuid) {
        return verifiedPlayers.getOrDefault(playerUuid, false);
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
        pendingCodes.clear();
        lastReminderTime.clear();
    }
}
