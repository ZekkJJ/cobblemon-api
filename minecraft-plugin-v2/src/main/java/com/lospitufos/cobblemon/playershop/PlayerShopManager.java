package com.lospitufos.cobblemon.playershop;

import com.cobblemon.mod.common.Cobblemon;
import com.cobblemon.mod.common.api.pokemon.Natures;
import com.cobblemon.mod.common.api.pokemon.PokemonSpecies;
import com.cobblemon.mod.common.api.pokemon.stats.Stats;
import com.cobblemon.mod.common.api.storage.party.PlayerPartyStore;
import com.cobblemon.mod.common.api.storage.pc.PCStore;
import com.cobblemon.mod.common.pokemon.Pokemon;
import com.cobblemon.mod.common.pokemon.Species;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * Player Shop Manager - Handles Pokemon marketplace deliveries
 * 
 * Features:
 * - Polls backend every 15 seconds for pending deliveries (ASYNC - no lag)
 * - Auto-delivers purchased Pokemon to online players
 * - Handles escrow returns (cancelled listings, expired auctions)
 * - All operations are ASYNC to prevent server lag
 * - Duplicate delivery prevention with processing set
 * - /claimmarket command for manual delivery check
 */
public class PlayerShopManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final ScheduledExecutorService scheduler;
    private final Set<String> processingDeliveries;
    private MinecraftServer server;
    
    // Configuration
    private static final int POLL_INTERVAL_SECONDS = 15;
    private static final int INITIAL_DELAY_SECONDS = 10;
    
    public PlayerShopManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
        // Single thread scheduler to prevent concurrent polling
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "PlayerShop-Poller");
            t.setDaemon(true);
            return t;
        });
        this.processingDeliveries = ConcurrentHashMap.newKeySet();
    }
    
    /**
     * Initialize the manager and start polling
     */
    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Player Shop system initializing...");
        
        // Start polling for pending deliveries
        scheduler.scheduleAtFixedRate(
            this::pollPendingDeliveries,
            INITIAL_DELAY_SECONDS,
            POLL_INTERVAL_SECONDS,
            TimeUnit.SECONDS
        );
        
        logger.info("✓ Player Shop system initialized (polling every " + POLL_INTERVAL_SECONDS + "s)");
    }
    
    /**
     * Poll for pending deliveries for all online players
     * Runs ASYNC - does not block main thread
     */
    private void pollPendingDeliveries() {
        if (server == null) return;
        
        try {
            // Get online players
            var players = server.getPlayerManager().getPlayerList();
            if (players.isEmpty()) return;
            
            // Check each player for pending deliveries
            for (ServerPlayerEntity player : players) {
                if (player == null || player.isDisconnected()) continue;
                
                UUID uuid = player.getUuid();
                
                // Async request to backend
                httpClient.getAsync("/api/player-shop/deliveries?uuid=" + uuid.toString())
                    .thenAccept(response -> {
                        if (response == null) return;
                        if (!response.has("deliveries")) return;
                        
                        JsonArray deliveries = response.getAsJsonArray("deliveries");
                        if (deliveries.isEmpty()) return;
                        
                        logger.info("Found " + deliveries.size() + " pending deliveries for " + player.getName().getString());
                        
                        // Process deliveries on main thread (required for Cobblemon API)
                        server.execute(() -> processDeliveries(player, deliveries));
                    })
                    .exceptionally(throwable -> {
                        // Silent fail - don't spam logs
                        logger.debug("Delivery poll error for " + player.getName().getString() + ": " + throwable.getMessage());
                        return null;
                    });
            }
        } catch (Exception e) {
            logger.error("Error polling deliveries: " + e.getMessage());
        }
    }
    
    /**
     * Process pending deliveries for a player
     * MUST run on main thread for Cobblemon API access
     */
    private void processDeliveries(ServerPlayerEntity player, JsonArray deliveries) {
        if (player == null || player.isDisconnected()) return;
        
        int delivered = 0;
        
        for (JsonElement element : deliveries) {
            try {
                JsonObject delivery = element.getAsJsonObject();
                
                // Get delivery ID (handle MongoDB format)
                String deliveryId = getIdFromJson(delivery.get("_id"));
                if (deliveryId == null) continue;
                
                // Skip if already processing
                if (processingDeliveries.contains(deliveryId)) {
                    logger.debug("Delivery " + deliveryId + " already processing, skipping");
                    continue;
                }
                
                // Mark as processing
                processingDeliveries.add(deliveryId);
                
                // Get Pokemon data
                JsonObject pokemonData = delivery.getAsJsonObject("pokemon");
                if (pokemonData == null) {
                    logger.error("Delivery " + deliveryId + " has no pokemon data");
                    processingDeliveries.remove(deliveryId);
                    continue;
                }
                
                // Get delivery type
                String type = delivery.has("type") ? delivery.get("type").getAsString() : "purchase";
                
                // Process balance transfer if present (for purchases)
                if (delivery.has("balanceTransfer")) {
                    JsonObject balanceTransfer = delivery.getAsJsonObject("balanceTransfer");
                    boolean balanceProcessed = balanceTransfer.has("processed") && balanceTransfer.get("processed").getAsBoolean();
                    
                    if (!balanceProcessed) {
                        boolean balanceSuccess = processBalanceTransfer(balanceTransfer);
                        if (!balanceSuccess) {
                            logger.error("Failed to process balance transfer for delivery " + deliveryId);
                            processingDeliveries.remove(deliveryId);
                            continue;
                        }
                    }
                }
                
                // Deliver the Pokemon
                boolean success = deliverPokemon(player, pokemonData, type);
                
                if (success) {
                    // Mark as delivered in backend
                    markDelivered(deliveryId);
                    delivered++;
                    
                    String species = pokemonData.has("species") ? pokemonData.get("species").getAsString() : "Pokemon";
                    String message = getDeliveryMessage(type, species);
                    
                    player.sendMessage(Text.literal(""));
                    player.sendMessage(Text.literal("§a§l✓ " + message));
                    player.sendMessage(Text.literal("§7¡Revisa tu equipo o PC!"));
                    player.sendMessage(Text.literal(""));
                    
                    logger.info("Delivered " + species + " to " + player.getName().getString() + " (" + type + ")");
                } else {
                    // Failed to deliver - will retry on next poll
                    processingDeliveries.remove(deliveryId);
                    logger.warn("Failed to deliver to " + player.getName().getString() + " - will retry");
                }
                
            } catch (Exception e) {
                logger.error("Error processing delivery: " + e.getMessage());
            }
        }
        
        if (delivered > 0) {
            logger.info("Delivered " + delivered + " Pokemon to " + player.getName().getString());
        }
    }
    
    /**
     * Process balance transfer using CobbleDollars commands
     * Executes /cobbledollars remove and /cobbledollars add commands
     */
    private boolean processBalanceTransfer(JsonObject balanceTransfer) {
        try {
            int amount = balanceTransfer.get("amount").getAsInt();
            String fromUsername = balanceTransfer.get("fromUsername").getAsString();
            String toUsername = balanceTransfer.get("toUsername").getAsString();
            
            logger.info("Processing balance transfer: " + amount + " CD from " + fromUsername + " to " + toUsername);
            
            // Execute CobbleDollars commands via server command dispatcher
            // Remove from buyer
            String removeCommand = "cobbledollars remove " + fromUsername + " " + amount;
            server.getCommandManager().executeWithPrefix(
                server.getCommandSource().withSilent(),
                removeCommand
            );
            logger.info("Executed: /" + removeCommand);
            
            // Give to seller
            String giveCommand = "cobbledollars give " + toUsername + " " + amount;
            server.getCommandManager().executeWithPrefix(
                server.getCommandSource().withSilent(),
                giveCommand
            );
            logger.info("Executed: /" + giveCommand);
            
            logger.info("✓ Balance transfer completed: " + amount + " CD from " + fromUsername + " to " + toUsername);
            return true;
            
        } catch (Exception e) {
            logger.error("Error processing balance transfer: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Deliver a Pokemon to a player's party or PC
     * Returns true if successful
     */
    private boolean deliverPokemon(ServerPlayerEntity player, JsonObject pokemonData, String type) {
        try {
            // Create Pokemon from JSON data
            Pokemon pokemon = createPokemonFromJson(pokemonData);
            if (pokemon == null) {
                logger.error("Failed to create Pokemon from JSON");
                return false;
            }
            
            // Try to add to party first
            PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
            if (party != null) {
                // Check if party has space (max 6)
                int partySize = 0;
                for (int i = 0; i < 6; i++) {
                    if (party.get(i) != null) partySize++;
                }
                
                if (partySize < 6) {
                    party.add(pokemon);
                    logger.debug("Added Pokemon to party");
                    return true;
                }
            }
            
            // Party full - try PC
            PCStore pc = Cobblemon.INSTANCE.getStorage().getPC(player);
            if (pc != null) {
                // Try to add to PC (Cobblemon handles finding a slot)
                pc.add(pokemon);
                logger.debug("Added Pokemon to PC");
                return true;
            }
            
            // Both party and PC are full or unavailable
            player.sendMessage(Text.literal("§c⚠ ¡Tu equipo y PC están llenos! Haz espacio para recibir tu Pokémon."));
            return false;
            
        } catch (Exception e) {
            logger.error("Error delivering Pokemon: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Create a Pokemon from JSON data
     */
    private Pokemon createPokemonFromJson(JsonObject data) {
        try {
            int speciesId = data.has("speciesId") ? data.get("speciesId").getAsInt() : 0;
            String speciesName = data.has("species") ? data.get("species").getAsString().toLowerCase() : "";
            int level = data.has("level") ? data.get("level").getAsInt() : 1;
            boolean shiny = data.has("shiny") && data.get("shiny").getAsBoolean();
            
            // Get Species by Pokedex number or name
            Species species = null;
            if (speciesId > 0) {
                species = PokemonSpecies.INSTANCE.getByPokedexNumber(speciesId, "");
            }
            if (species == null && !speciesName.isEmpty()) {
                species = PokemonSpecies.INSTANCE.getByName(speciesName);
            }
            
            if (species == null) {
                logger.error("Unknown species: " + speciesName + " (ID: " + speciesId + ")");
                return null;
            }
            
            // Create base Pokemon
            Pokemon pokemon = species.create(level);
            pokemon.setShiny(shiny);
            
            // Set gender if specified
            if (data.has("gender")) {
                String gender = data.get("gender").getAsString().toUpperCase();
                try {
                    pokemon.setGender(com.cobblemon.mod.common.pokemon.Gender.valueOf(gender));
                } catch (Exception e) {
                    // Use default gender
                }
            }
            
            // Set nature if specified
            if (data.has("nature")) {
                String nature = data.get("nature").getAsString().toLowerCase();
                var natureObj = Natures.INSTANCE.getNature(nature);
                if (natureObj != null) {
                    pokemon.setNature(natureObj);
                }
            }
            
            // Set IVs if specified
            if (data.has("ivs")) {
                JsonObject ivs = data.getAsJsonObject("ivs");
                var pokemonIvs = pokemon.getIvs();
                if (ivs.has("hp")) pokemonIvs.set(Stats.HP, ivs.get("hp").getAsInt());
                if (ivs.has("attack")) pokemonIvs.set(Stats.ATTACK, ivs.get("attack").getAsInt());
                if (ivs.has("defense")) pokemonIvs.set(Stats.DEFENCE, ivs.get("defense").getAsInt());
                if (ivs.has("spAttack")) pokemonIvs.set(Stats.SPECIAL_ATTACK, ivs.get("spAttack").getAsInt());
                if (ivs.has("spDefense")) pokemonIvs.set(Stats.SPECIAL_DEFENCE, ivs.get("spDefense").getAsInt());
                if (ivs.has("speed")) pokemonIvs.set(Stats.SPEED, ivs.get("speed").getAsInt());
            }
            
            // Set EVs if specified
            if (data.has("evs")) {
                JsonObject evs = data.getAsJsonObject("evs");
                var pokemonEvs = pokemon.getEvs();
                if (evs.has("hp")) pokemonEvs.set(Stats.HP, evs.get("hp").getAsInt());
                if (evs.has("attack")) pokemonEvs.set(Stats.ATTACK, evs.get("attack").getAsInt());
                if (evs.has("defense")) pokemonEvs.set(Stats.DEFENCE, evs.get("defense").getAsInt());
                if (evs.has("spAttack")) pokemonEvs.set(Stats.SPECIAL_ATTACK, evs.get("spAttack").getAsInt());
                if (evs.has("spDefense")) pokemonEvs.set(Stats.SPECIAL_DEFENCE, evs.get("spDefense").getAsInt());
                if (evs.has("speed")) pokemonEvs.set(Stats.SPEED, evs.get("speed").getAsInt());
            }
            
            // Set nickname if specified
            if (data.has("nickname") && !data.get("nickname").isJsonNull()) {
                String nickname = data.get("nickname").getAsString();
                if (!nickname.isEmpty()) {
                    pokemon.setNickname(Text.literal(nickname));
                }
            }
            
            return pokemon;
            
        } catch (Exception e) {
            logger.error("Error creating Pokemon from JSON: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Mark a delivery as completed in the backend
     */
    private void markDelivered(String deliveryId) {
        httpClient.postAsync("/api/player-shop/deliveries/" + deliveryId + "/delivered", new JsonObject())
            .thenAccept(response -> {
                if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                    logger.debug("Marked delivery " + deliveryId + " as completed");
                    processingDeliveries.remove(deliveryId);
                } else {
                    logger.warn("Failed to mark delivery " + deliveryId + " as completed");
                    // Keep in processing set to prevent re-delivery
                }
            })
            .exceptionally(ex -> {
                logger.error("Error marking delivery completed: " + ex.getMessage());
                return null;
            });
    }
    
    /**
     * Handle /claimmarket command - manual delivery check
     */
    public void handleClaimCommand(ServerPlayerEntity player) {
        if (player == null) return;
        
        UUID uuid = player.getUuid();
        player.sendMessage(Text.literal("§e⏳ Buscando entregas pendientes del mercado..."));
        
        httpClient.getAsync("/api/player-shop/deliveries?uuid=" + uuid.toString())
            .thenAccept(response -> {
                server.execute(() -> {
                    try {
                        if (response == null || !response.has("deliveries")) {
                            player.sendMessage(Text.literal("§7No tienes entregas pendientes del mercado."));
                            return;
                        }
                        
                        JsonArray deliveries = response.getAsJsonArray("deliveries");
                        if (deliveries.isEmpty()) {
                            player.sendMessage(Text.literal("§7No tienes entregas pendientes del mercado."));
                            player.sendMessage(Text.literal("§7Las entregas se procesan automáticamente."));
                            return;
                        }
                        
                        processDeliveries(player, deliveries);
                        
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
    
    /**
     * Handle /market command - show market info
     */
    public void handleMarketCommand(ServerPlayerEntity player) {
        if (player == null) return;
        
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§6§l🏪 MERCADO DE JUGADORES"));
        player.sendMessage(Text.literal("§7Compra y vende Pokémon con otros jugadores"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§e➤ §fVisita la web para ver el mercado:"));
        player.sendMessage(Text.literal("§b  https://cobblemon-los-pitufos.vercel.app/mercado"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§e➤ §fComandos:"));
        player.sendMessage(Text.literal("§a  /claimmarket §7- Reclamar entregas pendientes"));
        player.sendMessage(Text.literal(""));
    }
    
    /**
     * Get delivery message based on type
     */
    private String getDeliveryMessage(String type, String species) {
        switch (type) {
            case "purchase":
                return "¡COMPRA ENTREGADA! Recibiste " + capitalize(species);
            case "auction_win":
                return "¡SUBASTA GANADA! Recibiste " + capitalize(species);
            case "escrow_return":
                return "¡POKÉMON DEVUELTO! " + capitalize(species) + " ha vuelto a ti";
            default:
                return "¡ENTREGA COMPLETADA! Recibiste " + capitalize(species);
        }
    }
    
    /**
     * Get ID from JSON (handles MongoDB format)
     */
    private String getIdFromJson(JsonElement idElement) {
        if (idElement == null) return null;
        
        if (idElement.isJsonObject()) {
            JsonObject idObj = idElement.getAsJsonObject();
            if (idObj.has("$oid")) {
                return idObj.get("$oid").getAsString();
            }
        }
        
        return idElement.getAsString();
    }
    
    /**
     * Capitalize first letter
     */
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
    
    /**
     * Shutdown the manager
     */
    public void shutdown() {
        logger.info("Player Shop system shutting down...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
        processingDeliveries.clear();
        logger.info("✓ Player Shop system shutdown complete");
    }
}
