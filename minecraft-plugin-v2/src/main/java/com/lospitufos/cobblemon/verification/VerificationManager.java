package com.lospitufos.cobblemon.verification;

import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.core.LosPitufosPlugin;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import com.mojang.brigadier.arguments.StringArgumentType;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages player verification system
 * - Generates verification codes on join
 * - Sends codes to web API
 * - Handles /verify command
 */
public class VerificationManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final Map<UUID, Boolean> verifiedPlayers = new ConcurrentHashMap<>();
    private final Map<UUID, String> pendingCodes = new ConcurrentHashMap<>();
    private PlayerMovementBlocker movementBlocker;
    
    public VerificationManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
    }
    
    public void initialize(MinecraftServer server, com.lospitufos.cobblemon.core.Config config) {
        logger.info("Verification system initializing...");
        
        // Initialize movement blocker
        movementBlocker = new PlayerMovementBlocker(this, config, logger);
        movementBlocker.initialize(server);
        
        // Register join event
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server1) -> {
            onPlayerJoin(handler.getPlayer());
        });
        
        // Register /verify command
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> {
            dispatcher.register(
                CommandManager.literal("verify")
                    .then(CommandManager.argument("code", StringArgumentType.string())
                        .executes(context -> {
                            ServerPlayerEntity player = context.getSource().getPlayer();
                            if (player == null) return 0;
                            
                            String code = StringArgumentType.getString(context, "code");
                            verifyPlayer(player, code);
                            return 1;
                        })
                    )
            );
            
            // Register /codigo command to show verification code again
            dispatcher.register(
                CommandManager.literal("codigo")
                    .executes(context -> {
                        ServerPlayerEntity player = context.getSource().getPlayer();
                        if (player == null) return 0;
                        
                        showVerificationCode(player);
                        return 1;
                    })
            );
            
            logger.info("✓ /verify and /codigo commands registered");
        });
        
        logger.info("✓ Verification system initialized");
    }
    
    private void onPlayerJoin(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        
        // Check ban status FIRST
        httpClient.getAsync("/api/players/ban-status?uuid=" + uuid.toString())
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
                    logger.info("Blocked banned player from joining: " + player.getName().getString());
                    return;
                }
                
                // If not banned, check verification status
                checkVerificationStatus(player);
            });
    }
    
    private void checkVerificationStatus(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        
        // Check verification status from API
        httpClient.getAsync("/api/players/verification-status?uuid=" + uuid.toString())
            .thenAccept(response -> {
                if (response != null && response.has("verified")) {
                    boolean verified = response.get("verified").getAsBoolean();
                    verifiedPlayers.put(uuid, verified);
                    
                    if (!verified) {
                        // Generate and send verification code
                        generateAndSendCode(player);
                    } else {
                        logger.info("Player " + player.getName().getString() + " is already verified");
                    }
                } else {
                    // Assume not verified if API fails - generate code
                    verifiedPlayers.put(uuid, false);
                    generateAndSendCode(player);
                }
            });
    }
    
    private void generateAndSendCode(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        
        // Generate 5-digit code
        String code = String.format("%05d", new Random().nextInt(100000));
        pendingCodes.put(uuid, code);
        
        // Send code to API
        JsonObject payload = new JsonObject();
        payload.addProperty("minecraftUuid", uuid.toString());
        payload.addProperty("minecraftUsername", player.getName().getString());
        payload.addProperty("code", code);
        
        httpClient.postAsync("/api/verification/generate", payload)
            .thenAccept(response -> {
                if (response != null && response.has("success")) {
                    // Notify player
                    player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                    player.sendMessage(Text.literal("§c⚠ Tu cuenta no está verificada"));
                    player.sendMessage(Text.literal(""));
                    player.sendMessage(Text.literal("§aTu código de verificación: §f§l" + code));
                    player.sendMessage(Text.literal(""));
                    player.sendMessage(Text.literal("§71. Ve a: §b" + LosPitufosPlugin.getInstance().getConfig().getWebApiUrl()));
                    player.sendMessage(Text.literal("§72. Ingresa tu código en la página"));
                    player.sendMessage(Text.literal("§73. Vuelve al juego y usa: §f/verify " + code));
                    player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
                    
                    logger.info("Generated verification code for " + player.getName().getString() + ": " + code);
                    
                    // Send Discord notification if enabled
                    if (com.lospitufos.cobblemon.core.LosPitufosPlugin.getInstance().getDiscordWebhook().isEnabled()) {
                        com.lospitufos.cobblemon.core.LosPitufosPlugin.getInstance().getDiscordWebhook()
                            .sendVerificationNotification(player.getName().getString(), code);
                    }
                } else {
                    player.sendMessage(Text.literal("§cError al generar código de verificación. Contacta un administrador."));
                    logger.error("Failed to generate verification code for " + player.getName().getString());
                }
            });
    }
    
    private void verifyPlayer(ServerPlayerEntity player, String code) {
        UUID uuid = player.getUuid();
        
        // Check if code matches pending code
        String expectedCode = pendingCodes.get(uuid);
        if (expectedCode == null || !expectedCode.equals(code)) {
            player.sendMessage(Text.literal("§c✗ Código inválido"));
            return;
        }
        
        // Send verification request to API
        JsonObject payload = new JsonObject();
        payload.addProperty("minecraftUuid", uuid.toString());
        payload.addProperty("code", code);
        
        httpClient.postAsync("/api/verification/verify", payload)
            .thenAccept(response -> {
                if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                    verifiedPlayers.put(uuid, true);
                    pendingCodes.remove(uuid);
                    
                    player.sendMessage(Text.literal(""));
                    player.sendMessage(Text.literal("§a§l✓ ¡Cuenta verificada exitosamente!"));
                    player.sendMessage(Text.literal("§7Ya puedes jugar normalmente."));
                    player.sendMessage(Text.literal(""));
                    
                    logger.info("Player " + player.getName().getString() + " verified successfully");
                } else {
                    player.sendMessage(Text.literal("§c✗ Error al verificar. Intenta de nuevo."));
                }
            });
    }
    
    public boolean isVerified(UUID playerUuid) {
        return verifiedPlayers.getOrDefault(playerUuid, false);
    }
    
    private void showVerificationCode(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        String code = pendingCodes.get(uuid);
        
        if (code != null) {
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
            player.sendMessage(Text.literal("§aTu código de verificación: §f§l" + code));
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§71. Ve a: §b" + com.lospitufos.cobblemon.core.LosPitufosPlugin.getInstance().getConfig().getWebApiUrl() + "/verificar"));
            player.sendMessage(Text.literal("§72. Ingresa tu código en la página"));
            player.sendMessage(Text.literal("§73. Vuelve al juego y usa: §f/verify " + code));
            player.sendMessage(Text.literal("§e§l━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
        } else if (isVerified(uuid)) {
            player.sendMessage(Text.literal("§a✓ Tu cuenta ya está verificada."));
        } else {
            player.sendMessage(Text.literal("§cNo tienes un código de verificación pendiente."));
            player.sendMessage(Text.literal("§7Reloguea al servidor para generar uno nuevo."));
        }
    }
    
    public void shutdown() {
        logger.info("Verification system shutting down...");
        verifiedPlayers.clear();
        pendingCodes.clear();
    }
}
