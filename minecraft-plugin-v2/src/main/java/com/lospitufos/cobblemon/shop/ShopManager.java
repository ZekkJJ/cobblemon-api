package com.lospitufos.cobblemon.shop;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.economy.CobbleDollarsManager;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * Shop Manager with AUTO-DELIVERY system
 * 
 * Features:
 * - Polls backend every 15 seconds for pending purchases
 * - Auto-delivers pokeballs to online players
 * - Shows notification in-game
 * - All operations are ASYNC (no lag, no ticks behind)
 * - /claim command still available as fallback
 */
public class ShopManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final CobbleDollarsManager cobbleDollarsManager;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private final Set<String> processingPurchases = ConcurrentHashMap.newKeySet();
    private MinecraftServer server;
    
    private static final int POLL_INTERVAL_SECONDS = 15;
    
    public ShopManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.cobbleDollarsManager = new CobbleDollarsManager(logger);
    }
    
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Shop system initializing with AUTO-DELIVERY...");
        
        // Poll for pending purchases every 15 seconds
        scheduler.scheduleAtFixedRate(
            this::pollPendingPurchases, 
            5,
            POLL_INTERVAL_SECONDS, 
            TimeUnit.SECONDS
        );
        
        // NOTE: Balance sync REMOVED - the in-game balance is the source of truth
        // The plugin sends balance TO backend via /api/players/sync, NOT the other way around
        // Only sync FROM backend after a purchase is delivered (to deduct the spent amount)
        
        logger.info("Shop system initialized (auto-delivery every " + POLL_INTERVAL_SECONDS + "s)");
    }
    
    /**
     * NO LONGER USED - Balance sync from backend was causing issues
     * The in-game balance is the source of truth, not the backend
     * Keeping method for reference but not calling it periodically
     */
    @SuppressWarnings("unused")
    private void syncAllPlayersBalance() {
        // DISABLED - This was overwriting in-game earnings with old backend values
        // if (server == null) return;
        // for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
        //     if (player == null || player.isDisconnected()) continue;
        //     syncBalanceFromBackend(player);
        // }
    }

    private void pollPendingPurchases() {
        if (server == null) return;
        
        try {
            int playerCount = server.getPlayerManager().getPlayerList().size();
            if (playerCount == 0) return;
            
            for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
                if (player == null || player.isDisconnected()) continue;
                
                UUID uuid = player.getUuid();
                
                httpClient.getAsync("/api/shop/purchases?uuid=" + uuid.toString())
                    .thenAccept(response -> {
                        if (response == null) {
                            logger.debug("Shop poll: null response for " + player.getName().getString());
                            return;
                        }
                        if (!response.has("purchases")) {
                            logger.debug("Shop poll: no purchases field for " + player.getName().getString());
                            return;
                        }
                        
                        JsonArray purchases = response.getAsJsonArray("purchases");
                        if (purchases.size() == 0) return;
                        
                        logger.info("Found " + purchases.size() + " pending purchases for " + player.getName().getString());
                        server.execute(() -> deliverPurchases(player, purchases));
                    })
                    .exceptionally(throwable -> {
                        logger.error("Shop poll error for " + player.getName().getString() + ": " + throwable.getMessage());
                        return null;
                    });
            }
        } catch (Exception e) {
            logger.error("Error polling purchases: " + e.getMessage());
        }
    }

    private void deliverPurchases(ServerPlayerEntity player, JsonArray purchases) {
        if (player == null || player.isDisconnected()) return;
        
        UUID uuid = player.getUuid();
        int totalItems = 0;
        StringBuilder itemsReceived = new StringBuilder();
        
        for (JsonElement purchaseElement : purchases) {
            try {
                JsonObject purchase = purchaseElement.getAsJsonObject();
                
                // Handle MongoDB _id which can be either a string or an object with $oid
                String purchaseId;
                JsonElement idElement = purchase.get("_id");
                if (idElement.isJsonObject()) {
                    // MongoDB extended JSON format: { "$oid": "..." }
                    purchaseId = idElement.getAsJsonObject().get("$oid").getAsString();
                } else {
                    purchaseId = idElement.getAsString();
                }
                
                // CRITICAL: Skip if already being processed (prevents duplicates)
                if (processingPurchases.contains(purchaseId)) {
                    logger.debug("Purchase " + purchaseId + " already in processingPurchases, skipping");
                    continue;
                }
                
                // Add to processing set BEFORE any delivery attempt
                processingPurchases.add(purchaseId);
                logger.debug("Processing purchase ID: " + purchaseId);
                
                String ballId = purchase.get("ballId").getAsString();
                int quantity = purchase.get("quantity").getAsInt();
                String ballName = purchase.has("ballName") ? purchase.get("ballName").getAsString() : ballId;
                
                ItemStack ballStack = createPokeball(ballId, quantity);
                if (ballStack == null) {
                    logger.error("Failed to create pokeball: " + ballId);
                    // Don't remove from processingPurchases - let it timeout on backend
                    continue;
                }
                
                if (!player.getInventory().insertStack(ballStack)) {
                    player.sendMessage(Text.literal("§c⚠ ¡Inventario lleno! Haz espacio para " + quantity + "x " + ballName));
                    // Don't remove from processingPurchases - will retry on next poll after backend timeout
                    continue;
                }
                
                // Successfully delivered - mark as claimed
                markAsClaimed(uuid, purchaseId);
                
                totalItems += quantity;
                if (itemsReceived.length() > 0) itemsReceived.append(", ");
                itemsReceived.append(quantity).append("x ").append(ballName);
                
            } catch (Exception e) {
                logger.error("Error delivering purchase: " + e.getMessage());
            }
        }
        
        if (totalItems > 0) {
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§a§l✓ ¡COMPRA ENTREGADA!"));
            player.sendMessage(Text.literal("§7Recibiste: §f" + itemsReceived.toString()));
            player.sendMessage(Text.literal("§e¡Gracias por tu compra en la tienda web!"));
            player.sendMessage(Text.literal(""));
            
            logger.info("Auto-delivered to " + player.getName().getString() + ": " + itemsReceived);
            
            // Sync balance ONLY after successful delivery to deduct the purchase cost
            syncBalanceAfterPurchase(player);
        }
    }
    
    /**
     * Sync player's CobbleDollars balance from backend ONLY AFTER A PURCHASE
     * This is used to deduct the money spent on a purchase
     * 
     * IMPORTANT: This should ONLY be called after deliverPurchases, NOT periodically!
     * The in-game balance is the source of truth for earnings.
     */
    private void syncBalanceAfterPurchase(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        String playerName = player.getName().getString();
        
        httpClient.getAsync("/api/shop/balance?uuid=" + uuid.toString())
            .thenAccept(response -> {
                if (response != null && response.has("balance")) {
                    int backendBalance = response.get("balance").getAsInt();
                    
                    // Update in-game balance to reflect the purchase deduction
                    server.execute(() -> {
                        try {
                            // Use CobbleDollars command: /cobbledollars set <player> <amount>
                            String command = "cobbledollars set " + playerName + " " + backendBalance;
                            server.getCommandManager().executeWithPrefix(
                                server.getCommandSource(),
                                command
                            );
                            logger.info("Updated balance after purchase for " + playerName + ": " + backendBalance);
                            player.sendMessage(Text.literal("§7Balance actualizado: §e" + backendBalance + " CobbleDollars"));
                        } catch (Exception e) {
                            logger.debug("Could not execute cobbledollars command: " + e.getMessage());
                        }
                    });
                }
            })
            .exceptionally(ex -> {
                logger.debug("Failed to sync balance after purchase: " + ex.getMessage());
                return null;
            });
    }

    public void handleClaimCommand(ServerPlayerEntity player) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        player.sendMessage(Text.literal("§e⏳ Buscando compras pendientes..."));
        
        httpClient.getAsync("/api/shop/purchases?uuid=" + uuid.toString())
            .thenAccept(response -> {
                server.execute(() -> {
                    try {
                        if (response == null || !response.has("purchases")) {
                            player.sendMessage(Text.literal("§7No tienes compras pendientes."));
                            player.sendMessage(Text.literal("§7Las compras se entregan automáticamente."));
                            return;
                        }
                        
                        JsonArray purchases = response.getAsJsonArray("purchases");
                        if (purchases.size() == 0) {
                            player.sendMessage(Text.literal("§7No tienes compras pendientes."));
                            player.sendMessage(Text.literal("§7Las compras se entregan automáticamente."));
                            return;
                        }
                        
                        deliverPurchases(player, purchases);
                        
                    } catch (Exception e) {
                        logger.error("Error in claim command: " + e.getMessage());
                        player.sendMessage(Text.literal("§c✗ Error al reclamar. Intenta de nuevo."));
                    }
                });
            })
            .exceptionally(ex -> {
                server.execute(() -> player.sendMessage(Text.literal("§c✗ Error de conexión.")));
                return null;
            });
    }
    
    private ItemStack createPokeball(String ballId, int quantity) {
        try {
            // Check if it's a Minecraft item (has minecraft: prefix or minecraftId)
            if (ballId.startsWith("minecraft:") || isMinecraftItem(ballId)) {
                return createMinecraftItem(ballId, quantity);
            }
            
            // Check if it already has cobblemon: prefix
            String itemId;
            if (ballId.startsWith("cobblemon:")) {
                itemId = ballId;
            } else {
                itemId = "cobblemon:" + ballId;
            }
            
            Identifier identifier = Identifier.tryParse(itemId);
            
            if (identifier == null) {
                logger.error("Invalid item ID: " + ballId);
                return null;
            }
            
            Item item = Registries.ITEM.get(identifier);
            if (item == null || item == Registries.ITEM.get(Identifier.tryParse("minecraft:air"))) {
                // Try as plain Minecraft item
                logger.warn("Cobblemon item not found: " + itemId + ", trying as Minecraft item");
                return createMinecraftItem(ballId.replace("cobblemon:", ""), quantity);
            }
            
            logger.info("Created Cobblemon item: " + itemId + " x" + quantity);
            return new ItemStack(item, quantity);
            
        } catch (Exception e) {
            logger.error("Error creating item " + ballId + ": " + e.getMessage());
            return null;
        }
    }
    
    /**
     * Check if the item ID corresponds to a Minecraft item
     */
    private boolean isMinecraftItem(String itemId) {
        // Known Minecraft food items
        return itemId.equals("golden_apple") ||
               itemId.equals("enchanted_golden_apple") ||
               itemId.equals("golden_carrot") ||
               itemId.equals("cooked_beef") ||
               itemId.equals("cooked_porkchop") ||
               itemId.startsWith("minecraft:");
    }
    
    /**
     * Create a Minecraft item (food, etc.)
     */
    private ItemStack createMinecraftItem(String itemId, int quantity) {
        try {
            // Remove minecraft: prefix if present
            String cleanId = itemId.replace("minecraft:", "");
            String fullId = "minecraft:" + cleanId;
            
            Identifier identifier = Identifier.tryParse(fullId);
            if (identifier == null) {
                logger.error("Invalid Minecraft item ID: " + itemId);
                return null;
            }
            
            Item item = Registries.ITEM.get(identifier);
            if (item == null || item == Registries.ITEM.get(Identifier.tryParse("minecraft:air"))) {
                logger.error("Minecraft item not found: " + fullId);
                return null;
            }
            
            logger.info("Created Minecraft item: " + fullId + " x" + quantity);
            return new ItemStack(item, quantity);
            
        } catch (Exception e) {
            logger.error("Error creating Minecraft item " + itemId + ": " + e.getMessage());
            return null;
        }
    }
    
    private void markAsClaimed(UUID playerUuid, String purchaseId) {
        JsonObject payload = new JsonObject();
        payload.addProperty("uuid", playerUuid.toString());
        payload.addProperty("purchaseId", purchaseId);
        
        httpClient.postAsync("/api/shop/claim", payload)
            .thenAccept(response -> {
                if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                    logger.debug("Marked purchase " + purchaseId + " as claimed");
                    // Only remove from processingPurchases on successful claim
                    processingPurchases.remove(purchaseId);
                } else {
                    logger.warn("Failed to mark purchase " + purchaseId + " as claimed - will retry");
                    // Keep in processingPurchases to prevent re-delivery, backend will timeout
                }
            })
            .exceptionally(ex -> {
                logger.error("Failed to mark claimed: " + ex.getMessage());
                // Keep in processingPurchases - backend will timeout and reset status
                return null;
            });
    }
    
    public void shutdown() {
        logger.info("Shop system shutting down...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
        processingPurchases.clear();
    }
}
