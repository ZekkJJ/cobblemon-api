package com.lospitufos.cobblemon.shop;

import com.cobblemon.mod.common.Cobblemon;
import com.cobblemon.mod.common.api.storage.party.PlayerPartyStore;
import com.cobblemon.mod.common.item.PokemonItem;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.economy.CobbleDollarsManager;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import com.mojang.brigadier.arguments.IntegerArgumentType;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

import java.util.UUID;

public class ShopManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final CobbleDollarsManager cobbleDollarsManager;
    private MinecraftServer server;
    
    public ShopManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.cobbleDollarsManager = new CobbleDollarsManager(logger);
    }
    
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Shop system initializing...");
        
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> {
            dispatcher.register(
                CommandManager.literal("claimshop")
                    .executes(context -> {
                        ServerPlayerEntity player = context.getSource().getPlayer();
                        if (player == null) return 0;
                        
                        claimPurchases(player);
                        return 1;
                    })
            );
            
            logger.info("✓ /claimshop command registered");
        });
        
        logger.info("✓ Shop system initialized");
    }
    
    private void claimPurchases(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        
        player.sendMessage(Text.literal("§e⏳ Recuperando tus compras..."));
        
        httpClient.getAsync("/api/shop/purchases?uuid=" + uuid.toString())
            .thenAccept(response -> {
                server.execute(() -> {
                    try {
                        if (response == null || !response.has("purchases")) {
                            player.sendMessage(Text.literal("§cNo tienes compras pendientes."));
                            return;
                        }
                        
                        JsonArray purchases = response.getAsJsonArray("purchases");
                        if (purchases.size() == 0) {
                            player.sendMessage(Text.literal("§cNo tienes compras pendientes."));
                            return;
                        }
                        
                        int totalItems = 0;
                        
                        for (JsonElement purchaseElement : purchases) {
                            JsonObject purchase = purchaseElement.getAsJsonObject();
                            String ballId = purchase.get("ballId").getAsString();
                            int quantity = purchase.get("quantity").getAsInt();
                            String purchaseId = purchase.get("_id").getAsString();
                            
                            ItemStack ballStack = createPokeball(ballId, quantity);
                            if (ballStack != null) {
                                boolean given = player.getInventory().insertStack(ballStack);
                                
                                if (given) {
                                    totalItems += quantity;
                                    markAsClaimed(uuid, purchaseId);
                                } else {
                                    player.sendMessage(Text.literal("§c¡Inventario lleno! No se pudo entregar " + quantity + "x " + ballId));
                                }
                            }
                        }
                        
                        if (totalItems > 0) {
                            player.sendMessage(Text.literal("§a✓ ¡Recibiste " + totalItems + " pokébolas de la tienda!"));
                            logger.info("Player " + player.getName().getString() + " claimed " + totalItems + " pokeballs");
                        }
                        
                    } catch (Exception e) {
                        logger.error("Error claiming purchases for " + player.getName().getString() + ": " + e.getMessage());
                        player.sendMessage(Text.literal("§c✗ Error al reclamar compras. Intenta de nuevo."));
                    }
                });
            })
            .exceptionally(ex -> {
                server.execute(() -> {
                    player.sendMessage(Text.literal("§c✗ Error de conexión con la tienda. Intenta más tarde."));
                });
                logger.error("Failed to fetch purchases for " + player.getName().getString() + ": " + ex.getMessage());
                return null;
            });
    }
    
    private ItemStack createPokeball(String ballId, int quantity) {
        try {
            String itemId = "cobblemon:" + ballId;
            Identifier identifier = Identifier.tryParse(itemId);
            
            if (identifier == null) {
                logger.error("Invalid pokeball ID: " + ballId);
                return null;
            }
            
            Item item = Registries.ITEM.get(identifier);
            if (item == null) {
                logger.error("Pokeball item not found: " + ballId);
                return null;
            }
            
            return new ItemStack(item, quantity);
            
        } catch (Exception e) {
            logger.error("Error creating pokeball " + ballId + ": " + e.getMessage());
            return null;
        }
    }
    
    private void markAsClaimed(UUID playerUuid, String purchaseId) {
        JsonObject payload = new JsonObject();
        payload.addProperty("uuid", playerUuid.toString());
        payload.addProperty("purchaseId", purchaseId);
        
        httpClient.postAsync("/api/shop/claim", payload)
            .thenAccept(response -> {
                if (response != null && response.has("success")) {
                    logger.debug("Marked purchase " + purchaseId + " as claimed");
                }
            })
            .exceptionally(ex -> {
                logger.error("Failed to mark purchase as claimed: " + ex.getMessage());
                return null;
            });
    }
    
    public void shutdown() {
        logger.info("Shop system shutting down...");
    }
}
