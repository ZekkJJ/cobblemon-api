package com.lospitufos.cobblemon.admin;

import com.cobblemon.mod.common.Cobblemon;
import com.cobblemon.mod.common.api.pokemon.PokemonSpecies;
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
import net.minecraft.util.Formatting;

import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * AdminSyncManager - Handles bidirectional Pokemon sync and in-game announcements
 * 
 * Features:
 * - Polls backend for pending Pokemon ADD/REMOVE operations
 * - Polls backend for in-game announcements from admin panel
 * - Executes operations when players are online
 */
public class AdminSyncManager {

    private final HttpClient httpClient;
    private final ModLogger logger;
    private final ScheduledExecutorService scheduler;
    private MinecraftServer server;

    // Poll intervals
    private static final int ANNOUNCEMENT_POLL_SECONDS = 10;
    private static final int POKEMON_SYNC_POLL_SECONDS = 15;

    public AdminSyncManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.scheduler = Executors.newScheduledThreadPool(2);
    }

    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("AdminSyncManager initializing...");

        // Start announcement polling
        scheduler.scheduleAtFixedRate(
            this::pollAnnouncements,
            5, // Initial delay
            ANNOUNCEMENT_POLL_SECONDS,
            TimeUnit.SECONDS
        );
        logger.info("✓ Announcement polling started (every " + ANNOUNCEMENT_POLL_SECONDS + "s)");

        // Start Pokemon sync polling
        scheduler.scheduleAtFixedRate(
            this::pollPokemonOperations,
            10, // Initial delay
            POKEMON_SYNC_POLL_SECONDS,
            TimeUnit.SECONDS
        );
        logger.info("✓ Pokemon sync polling started (every " + POKEMON_SYNC_POLL_SECONDS + "s)");

        logger.info("✓ AdminSyncManager initialized");
    }

    /**
     * Poll for in-game announcements from admin panel
     */
    private void pollAnnouncements() {
        if (server == null) return;

        try {
            httpClient.getAsync("/api/announcements/ingame/poll")
                .thenAccept(response -> {
                    if (response == null || !response.has("announcements")) return;

                    JsonArray announcements = response.getAsJsonArray("announcements");
                    if (announcements.size() == 0) return;

                    for (JsonElement elem : announcements) {
                        JsonObject announcement = elem.getAsJsonObject();
                        broadcastAnnouncement(announcement);
                    }
                })
                .exceptionally(e -> {
                    // Silent fail - don't spam logs
                    return null;
                });
        } catch (Exception e) {
            // Silent fail
        }
    }

    /**
     * Broadcast an announcement to all online players
     */
    private void broadcastAnnouncement(JsonObject announcement) {
        if (server == null) return;

        String message = announcement.has("message") ? announcement.get("message").getAsString() : "";
        String title = announcement.has("title") ? announcement.get("title").getAsString() : "📢 Anuncio";
        String type = announcement.has("type") ? announcement.get("type").getAsString() : "info";

        if (message.isEmpty()) return;

        // Determine color based on type
        Formatting titleColor = Formatting.GOLD;
        Formatting messageColor = Formatting.WHITE;
        String prefix = "§6§l";

        switch (type) {
            case "warning":
                titleColor = Formatting.RED;
                prefix = "§c§l⚠ ";
                break;
            case "success":
                titleColor = Formatting.GREEN;
                prefix = "§a§l✓ ";
                break;
            case "event":
                titleColor = Formatting.LIGHT_PURPLE;
                prefix = "§d§l🎉 ";
                break;
            default:
                prefix = "§6§l📢 ";
        }

        final String finalPrefix = prefix;
        final String finalMessage = message;
        final String finalTitle = title;

        // Execute on main thread
        server.execute(() -> {
            // Build announcement message
            Text header = Text.literal("\n§8§m                                                  §r\n");
            Text titleText = Text.literal(finalPrefix + finalTitle + "\n").formatted(Formatting.BOLD);
            Text messageText = Text.literal("§f" + finalMessage + "\n");
            Text footer = Text.literal("§8§m                                                  §r\n");

            // Send to all players
            for (ServerPlayerEntity player : server.getPlayerManager().getPlayerList()) {
                player.sendMessage(header, false);
                player.sendMessage(titleText, false);
                player.sendMessage(messageText, false);
                player.sendMessage(footer, false);

                // Also play a sound
                player.playSound(
                    net.minecraft.sound.SoundEvents.ENTITY_EXPERIENCE_ORB_PICKUP,
                    1.0f, 1.0f
                );
            }

            logger.info("[ANNOUNCEMENT] Broadcasted: " + finalMessage);
        });
    }

    /**
     * Poll for pending Pokemon operations (ADD/REMOVE)
     */
    private void pollPokemonOperations() {
        if (server == null) return;

        try {
            httpClient.getAsync("/api/pokemon-sync/poll-all")
                .thenAccept(response -> {
                    if (response == null || !response.has("operations")) return;

                    JsonArray operations = response.getAsJsonArray("operations");
                    if (operations.size() == 0) return;

                    logger.info("[POKEMON-SYNC] Processing " + operations.size() + " pending operations");

                    for (JsonElement elem : operations) {
                        JsonObject operation = elem.getAsJsonObject();
                        processOperation(operation);
                    }
                })
                .exceptionally(e -> {
                    // Silent fail
                    return null;
                });
        } catch (Exception e) {
            // Silent fail
        }
    }

    /**
     * Process a single Pokemon operation
     */
    private void processOperation(JsonObject operation) {
        String operationType = operation.has("operation") ? operation.get("operation").getAsString() : "";
        String playerUuid = operation.has("playerUuid") ? operation.get("playerUuid").getAsString() : "";
        String operationId = operation.has("id") ? operation.get("id").getAsString() : "";

        if (playerUuid.isEmpty() || operationType.isEmpty()) {
            confirmOperation(operationId, false, "Missing playerUuid or operation type");
            return;
        }

        // Find player
        UUID uuid;
        try {
            uuid = UUID.fromString(playerUuid);
        } catch (Exception e) {
            confirmOperation(operationId, false, "Invalid UUID format");
            return;
        }

        ServerPlayerEntity player = server.getPlayerManager().getPlayer(uuid);
        if (player == null) {
            // Player not online - keep operation in queue (don't confirm)
            logger.debug("[POKEMON-SYNC] Player " + playerUuid + " not online, keeping operation in queue");
            return;
        }

        // Execute on main thread
        server.execute(() -> {
            try {
                if ("ADD".equals(operationType)) {
                    handleAddPokemon(player, operation, operationId);
                } else if ("REMOVE".equals(operationType)) {
                    handleRemovePokemon(player, operation, operationId);
                } else {
                    confirmOperation(operationId, false, "Unknown operation type: " + operationType);
                }
            } catch (Exception e) {
                logger.error("[POKEMON-SYNC] Error processing operation: " + e.getMessage());
                confirmOperation(operationId, false, e.getMessage());
            }
        });
    }

    /**
     * Handle ADD Pokemon operation
     */
    private void handleAddPokemon(ServerPlayerEntity player, JsonObject operation, String operationId) {
        try {
            JsonObject pokemonData = operation.getAsJsonObject("pokemon");
            if (pokemonData == null) {
                confirmOperation(operationId, false, "No pokemon data provided");
                return;
            }

            String speciesName = pokemonData.has("species") ? pokemonData.get("species").getAsString() : "";
            if (speciesName.isEmpty()) {
                confirmOperation(operationId, false, "No species provided");
                return;
            }

            // Get species
            Species species = PokemonSpecies.INSTANCE.getByName(speciesName.toLowerCase());
            if (species == null) {
                confirmOperation(operationId, false, "Unknown species: " + speciesName);
                return;
            }

            // Create Pokemon
            Pokemon pokemon = species.create(
                pokemonData.has("level") ? pokemonData.get("level").getAsInt() : 5
            );

            // Set properties
            if (pokemonData.has("shiny") && pokemonData.get("shiny").getAsBoolean()) {
                pokemon.setShiny(true);
            }

            if (pokemonData.has("nature")) {
                try {
                    var nature = com.cobblemon.mod.common.api.pokemon.Natures.INSTANCE.getNature(
                        new net.minecraft.util.Identifier("cobblemon", pokemonData.get("nature").getAsString().toLowerCase())
                    );
                    if (nature != null) {
                        pokemon.setNature(nature);
                    }
                } catch (Exception e) {
                    // Use default nature
                }
            }

            // Set IVs if provided
            if (pokemonData.has("ivs")) {
                JsonObject ivs = pokemonData.getAsJsonObject("ivs");
                if (ivs.has("hp")) pokemon.getIvs().set(com.cobblemon.mod.common.api.pokemon.stats.Stats.HP, ivs.get("hp").getAsInt());
                if (ivs.has("attack")) pokemon.getIvs().set(com.cobblemon.mod.common.api.pokemon.stats.Stats.ATTACK, ivs.get("attack").getAsInt());
                if (ivs.has("defense")) pokemon.getIvs().set(com.cobblemon.mod.common.api.pokemon.stats.Stats.DEFENCE, ivs.get("defense").getAsInt());
                if (ivs.has("spAttack")) pokemon.getIvs().set(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_ATTACK, ivs.get("spAttack").getAsInt());
                if (ivs.has("spDefense")) pokemon.getIvs().set(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_DEFENCE, ivs.get("spDefense").getAsInt());
                if (ivs.has("speed")) pokemon.getIvs().set(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPEED, ivs.get("speed").getAsInt());
            }

            // Add to party or PC
            PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
            
            if (party.size() < 6) {
                party.add(pokemon);
                player.sendMessage(Text.literal("§a§l✓ §r§aRecibiste un §e" + species.getName() + " §aLv." + pokemon.getLevel() + "§a!"), false);
            } else {
                // Party full, add to PC
                PCStore pc = Cobblemon.INSTANCE.getStorage().getPC(player);
                pc.add(pokemon);
                player.sendMessage(Text.literal("§a§l✓ §r§aRecibiste un §e" + species.getName() + " §aLv." + pokemon.getLevel() + " §7(enviado al PC - party llena)"), false);
            }

            // Play sound
            player.playSound(
                net.minecraft.sound.SoundEvents.ENTITY_PLAYER_LEVELUP,
                1.0f, 1.0f
            );

            logger.info("[POKEMON-SYNC] Added " + species.getName() + " to " + player.getName().getString());
            confirmOperation(operationId, true, null);

        } catch (Exception e) {
            logger.error("[POKEMON-SYNC] Error adding Pokemon: " + e.getMessage());
            confirmOperation(operationId, false, e.getMessage());
        }
    }

    /**
     * Handle REMOVE Pokemon operation
     */
    private void handleRemovePokemon(ServerPlayerEntity player, JsonObject operation, String operationId) {
        try {
            String pokemonUuid = operation.has("pokemonUuid") ? operation.get("pokemonUuid").getAsString() : "";
            String reason = operation.has("reason") ? operation.get("reason").getAsString() : "Removed by admin";

            if (pokemonUuid.isEmpty()) {
                confirmOperation(operationId, false, "No pokemonUuid provided");
                return;
            }

            UUID targetUuid;
            try {
                targetUuid = UUID.fromString(pokemonUuid);
            } catch (Exception e) {
                confirmOperation(operationId, false, "Invalid Pokemon UUID format");
                return;
            }

            // Search in party first
            PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
            
            for (int i = 0; i < 6; i++) {
                Pokemon p = party.get(i);
                if (p != null && p.getUuid().equals(targetUuid)) {
                    String speciesName = p.getSpecies().getName();
                    party.remove(p);
                    player.sendMessage(Text.literal("§c§l⚠ §r§c" + speciesName + " fue removido: §7" + reason), false);
                    logger.info("[POKEMON-SYNC] Removed " + speciesName + " from " + player.getName().getString() + "'s party");
                    confirmOperation(operationId, true, null);
                    return;
                }
            }

            // Search in PC
            PCStore pc = Cobblemon.INSTANCE.getStorage().getPC(player);
            
            // Iterate through all boxes
            for (int boxIndex = 0; boxIndex < pc.getBoxes().size(); boxIndex++) {
                com.cobblemon.mod.common.api.storage.pc.PCBox box = pc.getBoxes().get(boxIndex);
                for (int slot = 0; slot < 30; slot++) {
                    Pokemon p = box.get(slot);
                    if (p != null && p.getUuid().equals(targetUuid)) {
                        String speciesName = p.getSpecies().getName();
                        
                        // Use the PC's remove method instead of box.set(null)
                        // This properly handles the removal and triggers save
                        pc.remove(p);
                        
                        player.sendMessage(Text.literal("§c§l⚠ §r§c" + speciesName + " fue removido del PC: §7" + reason), false);
                        logger.info("[POKEMON-SYNC] Removed " + speciesName + " from " + player.getName().getString() + "'s PC (box " + boxIndex + ", slot " + slot + ")");
                        confirmOperation(operationId, true, null);
                        return;
                    }
                }
            }

            // Not found - log more details for debugging
            logger.warn("[POKEMON-SYNC] Pokemon UUID " + pokemonUuid + " not found for player " + player.getName().getString());
            logger.warn("[POKEMON-SYNC] Party size: " + party.size() + ", PC boxes: " + pc.getBoxes().size());
            confirmOperation(operationId, false, "Pokemon not found in party or PC");

        } catch (Exception e) {
            logger.error("[POKEMON-SYNC] Error removing Pokemon: " + e.getMessage());
            e.printStackTrace();
            confirmOperation(operationId, false, e.getMessage());
        }
    }

    /**
     * Confirm operation completion to backend
     */
    private void confirmOperation(String operationId, boolean success, String error) {
        if (operationId == null || operationId.isEmpty()) return;

        JsonObject payload = new JsonObject();
        payload.addProperty("operationId", operationId);
        payload.addProperty("success", success);
        if (error != null) {
            payload.addProperty("error", error);
        }

        httpClient.postAsync("/api/pokemon-sync/confirm", payload)
            .exceptionally(e -> {
                logger.debug("[POKEMON-SYNC] Failed to confirm operation: " + e.getMessage());
                return null;
            });
    }

    public void shutdown() {
        logger.info("AdminSyncManager shutting down...");
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
