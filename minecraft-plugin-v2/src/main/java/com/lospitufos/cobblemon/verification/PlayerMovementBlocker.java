package com.lospitufos.cobblemon.verification;

import com.lospitufos.cobblemon.core.Config;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.event.player.AttackEntityCallback;
import net.fabricmc.fabric.api.event.player.PlayerBlockBreakEvents;
import net.fabricmc.fabric.api.event.player.UseItemCallback;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.ActionResult;
import net.minecraft.util.TypedActionResult;

/**
 * Blocks player movement and actions until verified
 */
public class PlayerMovementBlocker {
    
    private final VerificationManager verificationManager;
    private final Config config;
    private final ModLogger logger;
    
    public PlayerMovementBlocker(VerificationManager verificationManager, Config config, ModLogger logger) {
        this.verificationManager = verificationManager;
        this.config = config;
        this.logger = logger;
    }
    
    public void initialize(MinecraftServer server) {
        if (!config.isFreezeUnverified()) {
            logger.info("Player freeze disabled in config");
            return;
        }
        
        logger.info("Initializing player movement blocker...");
        
        // Block movement by canceling velocity
        ServerTickEvents.END_SERVER_TICK.register(minecraftServer -> {
            for (ServerPlayerEntity player : minecraftServer.getPlayerManager().getPlayerList()) {
                if (!verificationManager.isVerified(player.getUuid())) {
                    // Cancel horizontal velocity only, allow falling
                    player.setVelocity(0, player.getVelocity().y, 0);
                    
                    // Show verification message every 5 seconds (100 ticks)
                    if (player.age % 100 == 0) {
                        player.sendMessage(Text.literal(config.getVerificationMessage()), true);
                    }
                }
            }
        });
        
        // Block breaking blocks
        PlayerBlockBreakEvents.BEFORE.register((world, player, pos, state, blockEntity) -> {
            if (!verificationManager.isVerified(player.getUuid())) {
                player.sendMessage(Text.literal(config.getVerificationMessage()));
                return false;
            }
            return true;
        });
        
        // Block using items
        UseItemCallback.EVENT.register((player, world, hand) -> {
            if (player instanceof ServerPlayerEntity serverPlayer) {
                if (!verificationManager.isVerified(serverPlayer.getUuid())) {
                    serverPlayer.sendMessage(Text.literal(config.getVerificationMessage()));
                    return TypedActionResult.fail(serverPlayer.getStackInHand(hand));
                }
            }
            return TypedActionResult.pass(player.getStackInHand(hand));
        });
        
        // Block attacking entities
        AttackEntityCallback.EVENT.register((player, world, hand, entity, hitResult) -> {
            if (player instanceof ServerPlayerEntity serverPlayer) {
                if (!verificationManager.isVerified(serverPlayer.getUuid())) {
                    serverPlayer.sendMessage(Text.literal(config.getVerificationMessage()));
                    return ActionResult.FAIL;
                }
            }
            return ActionResult.PASS;
        });
        
        logger.info("✓ Player movement blocker initialized");
    }
}
