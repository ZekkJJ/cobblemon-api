package com.lospitufos.cobblemon.admin;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Bulk Item Manager - Admin Item Giver System
 * 
 * Polls backend for pending item deliveries and executes them via /give
 * Used by admins to send multiple items to players from the web panel
 */
public class BulkItemManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final ScheduledExecutorService scheduler;
    private MinecraftServer server;
    
    private static final int POLL_INTERVAL_SECONDS = 10;
    private static final int INITIAL_DELAY_SECONDS = 15;
    
    // Track deliveries being processed to prevent duplicates
    private final Set<String> processingDeliveries = new HashSet<>();
    
    public BulkItemManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "BulkItem-Poller");
            t.setDaemon(true);
            return t;
        });
    }

    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Bulk Item Manager initializing...");
        
        // Start polling for pending deliveries
        scheduler.scheduleAtFixedRate(
            this::pollPendingDeliveries,
            INITIAL_DELAY_SECONDS,
            POLL_INTERVAL_SECONDS,
            TimeUnit.SECONDS
        );
        
        logger.info("Bulk Item Manager initialized (polling every " + POLL_INTERVAL_SECONDS + "s)");
    }
    
    private void pollPendingDeliveries() {
        if (server == null) return;
        
        try {
            int playerCount = server.getPlayerManager().getPlayerList().size();
            if (playerCount == 0) return;
            
            // Poll for all pending deliveries
            httpClient.getAsync("/api/admin/bulk-items/poll-all")
                .thenAccept(response -> {
                    if (response == null || !response.has("deliveries")) return;
                    
                    JsonArray deliveries = response.getAsJsonArray("deliveries");
                    if (deliveries.size() == 0) return;
                    
                    logger.info("Found " + deliveries.size() + " pending bulk item deliveries");
                    
                    for (JsonElement deliveryElement : deliveries) {
                        JsonObject delivery = deliveryElement.getAsJsonObject();
                        String deliveryId = delivery.get("_id").getAsString();
                        String playerUuid = delivery.get("playerUuid").getAsString();
                        String playerName = delivery.get("playerName").getAsString();
                        
                        // Skip if already processing
                        if (processingDeliveries.contains(deliveryId)) continue;
                        
                        // Find online player
                        ServerPlayerEntity player = findPlayerByUuid(playerUuid);
                        if (player == null) {
                            logger.debug("Player " + playerName + " not online, skipping delivery " + deliveryId);
                            continue;
                        }
                        
                        processingDeliveries.add(deliveryId);
                        server.execute(() -> deliverItems(player, delivery, deliveryId));
                    }
                })
                .exceptionally(throwable -> {
                    logger.debug("Bulk items poll error: " + throwable.getMessage());
                    return null;
                });
        } catch (Exception e) {
            logger.error("Error polling bulk items: " + e.getMessage());
        }
    }
    
    private ServerPlayerEntity findPlayerByUuid(String uuidStr) {
        try {
            UUID uuid = UUID.fromString(uuidStr);
            return server.getPlayerManager().getPlayer(uuid);
        } catch (Exception e) {
            return null;
        }
    }

    private void deliverItems(ServerPlayerEntity player, JsonObject delivery, String deliveryId) {
        if (player == null || player.isDisconnected()) {
            processingDeliveries.remove(deliveryId);
            return;
        }
        
        JsonArray items = delivery.getAsJsonArray("items");
        int itemsDelivered = 0;
        StringBuilder itemsReceived = new StringBuilder();
        
        for (JsonElement itemElement : items) {
            try {
                JsonObject item = itemElement.getAsJsonObject();
                String itemId = item.get("itemId").getAsString();
                String displayName = item.has("displayName") ? item.get("displayName").getAsString() : itemId;
                int quantity = item.has("quantity") ? item.get("quantity").getAsInt() : 1;
                String nbt = item.has("nbt") && !item.get("nbt").isJsonNull() ? item.get("nbt").getAsString() : null;
                
                ItemStack stack = createItemStack(itemId, quantity, nbt);
                if (stack == null || stack.isEmpty()) {
                    logger.error("Failed to create item: " + itemId);
                    continue;
                }
                
                // Give item to player
                if (!player.getInventory().insertStack(stack)) {
                    // Inventory full - drop on ground
                    player.dropItem(stack, false);
                    player.sendMessage(Text.literal("§e⚠ Inventario lleno, item dropeado: " + displayName));
                }
                
                itemsDelivered++;
                if (itemsReceived.length() > 0) itemsReceived.append(", ");
                itemsReceived.append(quantity).append("x ").append(displayName);
                
            } catch (Exception e) {
                logger.error("Error delivering item: " + e.getMessage());
            }
        }
        
        // Confirm delivery to backend
        confirmDelivery(deliveryId, itemsDelivered > 0, itemsDelivered);
        
        if (itemsDelivered > 0) {
            player.sendMessage(Text.literal(""));
            player.sendMessage(Text.literal("§6§l✨ ¡ITEMS RECIBIDOS DEL ADMIN!"));
            player.sendMessage(Text.literal("§7Recibiste: §f" + itemsReceived.toString()));
            player.sendMessage(Text.literal(""));
            
            logger.info("Bulk delivered to " + player.getName().getString() + ": " + itemsReceived);
        }
        
        processingDeliveries.remove(deliveryId);
    }
    
    private ItemStack createItemStack(String itemId, int quantity, String nbtString) {
        try {
            Identifier id = Identifier.tryParse(itemId);
            if (id == null) {
                logger.error("Invalid item ID format: " + itemId);
                return null;
            }
            
            var item = Registries.ITEM.get(id);
            
            // Check if item is air (not found)
            if (item == null || item == Registries.ITEM.get(Identifier.tryParse("minecraft:air"))) {
                logger.error("Item not found: " + itemId);
                return null;
            }
            
            ItemStack stack = new ItemStack(item, quantity);
            
            // Note: NBT application for 1.20.1+ requires different approach
            // For now, we skip NBT as the API changed significantly
            // Items with enchantments should use the /give command format instead
            if (nbtString != null && !nbtString.isEmpty()) {
                logger.warn("NBT data provided for " + itemId + " but NBT API changed in 1.20.1+. Consider using /give command format.");
            }
            
            return stack;
        } catch (Exception e) {
            logger.error("Error creating item stack: " + e.getMessage());
            return null;
        }
    }

    private void confirmDelivery(String deliveryId, boolean success, int itemsDelivered) {
        JsonObject body = new JsonObject();
        body.addProperty("success", success);
        body.addProperty("itemsDelivered", itemsDelivered);
        
        httpClient.postAsync("/api/admin/bulk-items/confirm/" + deliveryId, body)
            .thenAccept(response -> {
                logger.debug("Delivery " + deliveryId + " confirmed: " + success);
            })
            .exceptionally(throwable -> {
                logger.error("Failed to confirm delivery " + deliveryId + ": " + throwable.getMessage());
                return null;
            });
    }
    
    public void shutdown() {
        logger.info("Bulk Item Manager shutting down...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
        processingDeliveries.clear();
    }
}