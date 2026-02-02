package com.lospitufos.cobblemon.legendarypool;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;

import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Legendary Pool Manager
 * 
 * Handles the community legendary spawn system.
 * Players contribute CobbleDollars to a pool, and when the goal is reached,
 * a legendary Pokémon spawns in the stadium.
 * 
 * ANTI-EXPLOIT FEATURES:
 * 1. Contributions are validated against backend balance
 * 2. Balance is deducted IMMEDIATELY on backend before in-game
 * 3. Locked balances prevent /syncnow exploit
 * 4. All transactions are atomic
 */
public class LegendaryPoolManager {
    
    private final ModLogger logger;
    private final HttpClient httpClient;
    private MinecraftServer server;
    private final ScheduledExecutorService scheduler;
    
    // Current pool state (cached)
    private String currentPokemon = null;
    private int currentGoal = 0;
    private int currentAmount = 0;
    private String poolStatus = "none";
    private String poolId = null;
    
    // Top contributor info
    private String topContributorUuid = null;
    private String topContributorName = null;
    private int topContributorBonus = 25; // 25% extra catch rate
    
    public LegendaryPoolManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "LegendaryPool-Manager");
            t.setDaemon(true);
            return t;
        });
    }
    
    /**
     * Initialize the legendary pool system
     */
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Legendary Pool system initializing...");
        
        // Poll for pool status every 30 seconds
        scheduler.scheduleAtFixedRate(
            this::pollPoolStatus,
            5, // Initial delay 5s
            30, // Every 30 seconds
            TimeUnit.SECONDS
        );
        
        logger.info("✓ Legendary Pool system initialized");
    }
    
    /**
     * Poll the backend for current pool status
     */
    private void pollPoolStatus() {
        httpClient.getAsync("/api/legendary-pool/active")
            .thenAccept(response -> {
                if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                    if (response.has("pool") && !response.get("pool").isJsonNull()) {
                        JsonObject pool = response.getAsJsonObject("pool");
                        
                        String newStatus = pool.get("status").getAsString();
                        String newPokemon = pool.get("targetPokemon").getAsString();
                        int newAmount = pool.get("currentAmount").getAsInt();
                        int newGoal = pool.get("goalAmount").getAsInt();
                        String newPoolId = pool.get("_id").getAsString();
                        
                        // Check if pool just completed
                        if ("completed".equals(newStatus) && !"completed".equals(poolStatus)) {
                            onPoolCompleted(pool);
                        }
                        
                        // Update cached state
                        poolStatus = newStatus;
                        currentPokemon = newPokemon;
                        currentAmount = newAmount;
                        currentGoal = newGoal;
                        poolId = newPoolId;
                        
                        // Update top contributor
                        if (pool.has("topContributor") && !pool.get("topContributor").isJsonNull()) {
                            JsonObject top = pool.getAsJsonObject("topContributor");
                            topContributorUuid = top.has("minecraftUuid") ? top.get("minecraftUuid").getAsString() : null;
                            topContributorName = top.has("username") ? top.get("username").getAsString() : null;
                        }
                    } else {
                        poolStatus = "none";
                        currentPokemon = null;
                        poolId = null;
                    }
                }
            })
            .exceptionally(ex -> {
                logger.debug("Error polling pool status: " + ex.getMessage());
                return null;
            });
    }
    
    /**
     * Called when a pool is completed - announce and prepare spawn
     * THREAD SAFETY: Makes defensive copy of player list
     */
    private void onPoolCompleted(JsonObject pool) {
        if (server == null) return;
        
        String pokemon = pool.get("targetPokemon").getAsString();
        int level = pool.get("targetLevel").getAsInt();
        
        // Broadcast to all players
        server.execute(() -> {
            // DEFENSIVE COPY: Copy player list to avoid ConcurrentModificationException
            List<ServerPlayerEntity> playersCopy;
            try {
                playersCopy = new ArrayList<>(server.getPlayerManager().getPlayerList());
            } catch (Exception e) {
                return;
            }
            
            for (ServerPlayerEntity player : playersCopy) {
                player.sendMessage(Text.literal(""));
                player.sendMessage(Text.literal("§6§l★★★ ¡LEGENDARY POOL COMPLETADO! ★★★").formatted(Formatting.GOLD, Formatting.BOLD));
                player.sendMessage(Text.literal("§e" + pokemon + " §7nivel §e" + level + " §7aparecerá pronto en el §bEstadio§7!"));
                player.sendMessage(Text.literal("§d¡Prepárate para capturarlo!"));
                if (topContributorName != null) {
                    player.sendMessage(Text.literal("§6Top Contribuidor: §e" + topContributorName + " §7(+25% catch rate)"));
                }
                player.sendMessage(Text.literal(""));
            }
        });
        
        logger.info("[LEGENDARY POOL] Pool completed! " + pokemon + " Lv." + level + " ready to spawn");
    }
    
    /**
     * Contribute to the pool (called from command)
     * This validates with backend and deducts balance atomically
     */
    public void contribute(ServerPlayerEntity player, int amount) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        String username = player.getName().getString();
        
        if (!"active".equals(poolStatus)) {
            player.sendMessage(Text.literal("§cNo hay un pool activo en este momento."));
            return;
        }
        
        if (amount < 1000) {
            player.sendMessage(Text.literal("§cLa contribución mínima es 1,000 CobbleDollars."));
            return;
        }
        
        player.sendMessage(Text.literal("§7Procesando contribución..."));
        
        // Send contribution to backend (backend handles balance validation and deduction)
        JsonObject body = new JsonObject();
        body.addProperty("minecraftUuid", uuid.toString());
        body.addProperty("username", username);
        body.addProperty("amount", amount);
        
        httpClient.postAsync("/api/legendary-pool/contribute", body)
            .thenAccept(response -> {
                server.execute(() -> {
                    if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                        int yourTotal = response.get("yourTotal").getAsInt();
                        int yourRank = response.get("yourRank").getAsInt();
                        boolean isTop = response.get("isTopContributor").getAsBoolean();
                        String progress = response.get("poolProgress").getAsString();
                        
                        player.sendMessage(Text.literal(""));
                        player.sendMessage(Text.literal("§a§l✓ ¡Contribución exitosa!"));
                        player.sendMessage(Text.literal("§7Contribuiste: §e" + formatMoney(amount) + " CD"));
                        player.sendMessage(Text.literal("§7Tu total: §a" + formatMoney(yourTotal) + " CD"));
                        player.sendMessage(Text.literal("§7Tu ranking: §b#" + yourRank));
                        player.sendMessage(Text.literal("§7Progreso del pool: §e" + progress + "%"));
                        
                        if (isTop) {
                            player.sendMessage(Text.literal("§6§l★ ¡Eres el TOP contribuidor! §7(+25% catch rate)"));
                        }
                        
                        if (response.has("poolCompleted") && response.get("poolCompleted").getAsBoolean()) {
                            player.sendMessage(Text.literal("§d§l¡EL POOL SE HA COMPLETADO!"));
                        }
                        
                        player.sendMessage(Text.literal(""));
                        
                        // Sync balance from backend to ensure consistency
                        syncPlayerBalance(player);
                        
                    } else {
                        String error = response != null && response.has("error") 
                            ? response.get("error").getAsString() 
                            : "Error desconocido";
                        player.sendMessage(Text.literal("§c" + error));
                    }
                });
            })
            .exceptionally(ex -> {
                server.execute(() -> {
                    player.sendMessage(Text.literal("§cError al contribuir: " + ex.getMessage()));
                });
                return null;
            });
    }
    
    /**
     * Sync player balance from backend after contribution
     */
    private void syncPlayerBalance(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        String username = player.getName().getString();
        
        httpClient.getAsync("/api/economy/balance/" + uuid.toString())
            .thenAccept(response -> {
                if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                    int balance = response.get("balance").getAsInt();
                    
                    server.execute(() -> {
                        // Set the player's balance to match backend
                        String command = "cobbledollars set " + username + " " + balance;
                        server.getCommandManager().executeWithPrefix(
                            server.getCommandSource().withSilent(),
                            command
                        );
                    });
                }
            });
    }
    
    /**
     * Spawn the legendary (admin command)
     */
    public void spawnLegendary(ServerPlayerEntity admin) {
        if (admin == null) return;
        
        if (!"completed".equals(poolStatus)) {
            admin.sendMessage(Text.literal("§cEl pool no está completado. Estado actual: " + poolStatus));
            return;
        }
        
        if (poolId == null) {
            admin.sendMessage(Text.literal("§cNo hay pool ID disponible."));
            return;
        }
        
        admin.sendMessage(Text.literal("§7Spawneando legendario..."));
        
        JsonObject body = new JsonObject();
        body.addProperty("poolId", poolId);
        body.addProperty("spawnLocation", "Estadio Principal");
        body.addProperty("spawnedBy", admin.getName().getString());
        
        httpClient.postAsync("/api/legendary-pool/spawn", body)
            .thenAccept(response -> {
                server.execute(() -> {
                    if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                        String spawnCommand = response.get("spawnCommand").getAsString();
                        String pokemon = response.get("pokemon").getAsString();
                        int level = response.get("level").getAsInt();
                        
                        // Execute spawn command
                        server.getCommandManager().executeWithPrefix(
                            server.getCommandSource(),
                            spawnCommand
                        );
                        
                        // DEFENSIVE COPY: Copy player list to avoid ConcurrentModificationException
                        List<ServerPlayerEntity> playersCopy;
                        try {
                            playersCopy = new ArrayList<>(server.getPlayerManager().getPlayerList());
                        } catch (Exception e) {
                            playersCopy = new ArrayList<>();
                        }
                        
                        // Broadcast
                        for (ServerPlayerEntity player : playersCopy) {
                            player.sendMessage(Text.literal(""));
                            player.sendMessage(Text.literal("§6§l★★★ ¡" + pokemon.toUpperCase() + " HA APARECIDO! ★★★").formatted(Formatting.GOLD, Formatting.BOLD));
                            player.sendMessage(Text.literal("§e¡Corre al Estadio para intentar capturarlo!"));
                            player.sendMessage(Text.literal(""));
                        }
                        
                        // Give top contributor their bonus
                        if (response.has("topContributor") && !response.get("topContributor").isJsonNull()) {
                            JsonObject top = response.getAsJsonObject("topContributor");
                            String topUuid = top.get("uuid").getAsString();
                            String topName = top.get("username").getAsString();
                            
                            // Give Master Ball to top contributor
                            ServerPlayerEntity topPlayer = server.getPlayerManager().getPlayer(UUID.fromString(topUuid));
                            if (topPlayer != null) {
                                server.getCommandManager().executeWithPrefix(
                                    server.getCommandSource().withSilent(),
                                    "pokegive " + topName + " master_ball 1"
                                );
                                topPlayer.sendMessage(Text.literal("§6§l★ ¡Recibiste una Master Ball por ser el TOP contribuidor!"));
                            }
                        }
                        
                        admin.sendMessage(Text.literal("§a✓ Legendario spawneado exitosamente!"));
                        
                        // Reset local state
                        poolStatus = "spawned";
                        
                    } else {
                        String error = response != null && response.has("error") 
                            ? response.get("error").getAsString() 
                            : "Error desconocido";
                        admin.sendMessage(Text.literal("§cError: " + error));
                    }
                });
            })
            .exceptionally(ex -> {
                server.execute(() -> {
                    admin.sendMessage(Text.literal("§cError al spawner: " + ex.getMessage()));
                });
                return null;
            });
    }
    
    /**
     * Show pool status to player
     */
    public void showStatus(ServerPlayerEntity player) {
        if (player == null) return;
        
        if (!"active".equals(poolStatus) && !"completed".equals(poolStatus)) {
            player.sendMessage(Text.literal("§7No hay un pool activo en este momento."));
            return;
        }
        
        double progress = currentGoal > 0 ? (currentAmount * 100.0 / currentGoal) : 0;
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§6§l=== LEGENDARY POOL ==="));
        player.sendMessage(Text.literal("§ePokémon: §f" + currentPokemon));
        player.sendMessage(Text.literal("§eProgreso: §a" + formatMoney(currentAmount) + " §7/ §e" + formatMoney(currentGoal) + " CD"));
        player.sendMessage(Text.literal("§eCompletado: §b" + String.format("%.1f", progress) + "%"));
        player.sendMessage(Text.literal("§eEstado: §" + (poolStatus.equals("completed") ? "a" : "7") + poolStatus.toUpperCase()));
        
        if (topContributorName != null) {
            player.sendMessage(Text.literal("§6Top Contribuidor: §e" + topContributorName));
        }
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§7Usa §e/pool contribute <cantidad> §7para contribuir"));
        player.sendMessage(Text.literal(""));
    }
    
    /**
     * Check if player is top contributor (for catch rate bonus)
     */
    public boolean isTopContributor(UUID playerUuid) {
        return topContributorUuid != null && topContributorUuid.equals(playerUuid.toString());
    }
    
    /**
     * Get top contributor bonus percentage
     */
    public int getTopContributorBonus() {
        return topContributorBonus;
    }
    
    /**
     * Get locked balance for a player (prevents /syncnow exploit)
     */
    public void getLockedBalance(UUID uuid, java.util.function.Consumer<Integer> callback) {
        httpClient.getAsync("/api/legendary-pool/locked-balance/" + uuid.toString())
            .thenAccept(response -> {
                if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                    int locked = response.get("totalLocked").getAsInt();
                    callback.accept(locked);
                } else {
                    callback.accept(0);
                }
            })
            .exceptionally(ex -> {
                callback.accept(0);
                return null;
            });
    }
    
    /**
     * Format money for display
     */
    private String formatMoney(int amount) {
        if (amount >= 1000000) {
            return String.format("%.1fM", amount / 1000000.0);
        } else if (amount >= 1000) {
            return String.format("%dK", amount / 1000);
        }
        return String.valueOf(amount);
    }
    
    /**
     * Shutdown the manager
     */
    public void shutdown() {
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
