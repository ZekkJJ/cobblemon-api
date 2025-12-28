package com.lospitufos.cobblemon.sync;

import com.cobblemon.mod.common.Cobblemon;
import com.cobblemon.mod.common.api.events.CobblemonEvents;
import com.cobblemon.mod.common.api.pokemon.PokemonSpecies;
import com.cobblemon.mod.common.api.storage.party.PlayerPartyStore;
import com.cobblemon.mod.common.api.storage.pc.PCStore;
import com.cobblemon.mod.common.pokemon.Pokemon;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.core.Config;
import com.lospitufos.cobblemon.economy.CobbleDollarsManager;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.item.ItemStack;
import net.minecraft.registry.Registries;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;

import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Syncs player and Pokemon data to web using Cobblemon native APIs
 * - Periodic sync
 * - Event-driven sync on capture/evolution
 * - NO manual JSON reading
 */
public class WebSyncManager {

    private final HttpClient httpClient;
    private final ModLogger logger;
    private final Config config;
    private final ScheduledExecutorService scheduler;
    private final CobbleDollarsManager cobbleDollarsManager;
    private MinecraftServer server;

    public WebSyncManager(HttpClient httpClient, ModLogger logger, Config config) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.config = config;
        this.scheduler = Executors.newScheduledThreadPool(1);
        this.cobbleDollarsManager = new CobbleDollarsManager(logger);
    }

    public void initialize(MinecraftServer server) {
        this.server = server;
        logger.info("Web sync initializing...");

        // Start periodic sync
        int intervalSeconds = config.getSyncIntervalSeconds();
        scheduler.scheduleAtFixedRate(
                this::performPeriodicSync,
                intervalSeconds,
                intervalSeconds,
                TimeUnit.SECONDS);
        logger.info("Periodic sync started (interval: " + intervalSeconds + "s)");

        // Register event listeners
        if (config.isSyncOnCapture()) {
            CobblemonEvents.POKEMON_CAPTURED.subscribe(com.cobblemon.mod.common.api.Priority.NORMAL, event -> {
                ServerPlayerEntity player = event.getPlayer();
                if (player != null) {
                    syncPlayerData(player);
                }
                return kotlin.Unit.INSTANCE;
            });
            logger.info("Sync on capture enabled");
        }

        if (config.isSyncOnEvolution()) {
            CobblemonEvents.EVOLUTION_COMPLETE.subscribe(com.cobblemon.mod.common.api.Priority.NORMAL, event -> {
                Pokemon pokemon = event.getPokemon();
                UUID ownerUuid = pokemon.getOwnerUUID();
                if (ownerUuid != null) {
                    ServerPlayerEntity player = server.getPlayerManager().getPlayer(ownerUuid);
                    if (player != null) {
                        syncPlayerData(player);
                    }
                }
                return kotlin.Unit.INSTANCE;
            });
            logger.info("Sync on evolution enabled");
        }

        // Register disconnect event for online status tracking
        ServerPlayConnectionEvents.DISCONNECT.register((handler, server1) -> {
            try {
                ServerPlayerEntity player = handler.getPlayer();
                if (player == null)
                    return;

                UUID uuid = player.getUuid();

                JsonObject payload = new JsonObject();
                payload.addProperty("uuid", uuid.toString());
                payload.addProperty("username", player.getName().getString());
                payload.addProperty("online", false);
                payload.addProperty("lastSeen", java.time.Instant.now().toString());

                // CRITICAL FIX: Include empty arrays to match API schema
                // The API expects these fields to be present, even on disconnect
                payload.add("party", new JsonArray());
                payload.add("pcStorage", new JsonArray());

                httpClient.postAsync("/api/players/sync", payload)
                        .thenAccept(response -> {
                            if (response != null) {
                                logger.debug("Updated offline status for " + player.getName().getString());
                            }
                        })
                        .exceptionally(throwable -> {
                            // Silently handle errors - player is already disconnecting
                            logger.debug("Failed to update offline status (player disconnecting): "
                                    + throwable.getMessage());
                            return null;
                        });
            } catch (Exception e) {
                // Catch all exceptions to prevent disconnect handler from crashing
                logger.debug("Error in disconnect handler: " + e.getMessage());
            }
        });
        logger.info("Online status tracking enabled");

        logger.info("✓ Web sync initialized");
    }

    private int syncPlayerIndex = 0; // Track which player to sync next

    private void performPeriodicSync() {
        if (server == null)
            return;

        var playerList = server.getPlayerManager().getPlayerList();
        if (playerList.isEmpty())
            return;

        // Only sync ONE player per interval to prevent lag spikes
        // This distributes the load across multiple sync intervals
        if (syncPlayerIndex >= playerList.size()) {
            syncPlayerIndex = 0;
        }

        // DEFENSIVE CHECK: Validate index before accessing
        if (syncPlayerIndex < playerList.size()) {
            ServerPlayerEntity player = playerList.get(syncPlayerIndex);
            // Verify player is still online before syncing
            if (player != null && player.networkHandler != null && !player.isDisconnected()) {
                logger.debug("Syncing player " + (syncPlayerIndex + 1) + "/" + playerList.size() + ": "
                        + player.getName().getString());
                syncPlayerData(player);
            }
        }

        syncPlayerIndex++;
    }

    public void syncPlayerData(ServerPlayerEntity player) {
        // DEFENSIVE CHECK: Verify player is still valid and online
        if (player == null || player.networkHandler == null || player.isDisconnected()) {
            logger.debug("Skipping sync for disconnected/invalid player");
            return;
        }

        try {
            UUID uuid = player.getUuid();

            // Get player's party
            PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);

            // Build sync payload
            JsonObject payload = new JsonObject();
            payload.addProperty("uuid", uuid.toString());
            payload.addProperty("username", player.getName().getString());
            payload.addProperty("online", true);
            payload.addProperty("lastSeen", java.time.Instant.now().toString());
            
            // Add player position for BlueMap integration
            payload.addProperty("x", player.getX());
            payload.addProperty("y", player.getY());
            payload.addProperty("z", player.getZ());
            payload.addProperty("world", player.getWorld().getRegistryKey().getValue().getPath());

            // Add party data with full details
            JsonArray partyArray = new JsonArray();
            for (Pokemon pokemon : party) {
                if (pokemon != null) {
                    partyArray.add(buildPokemonData(pokemon));
                }
            }
            payload.add("party", partyArray);

            // Add PC Storage data - OPTIMIZED: Only sync first 2 boxes to reduce payload
            try {
                PCStore pc = Cobblemon.INSTANCE.getStorage().getPC(player);
                JsonArray pcData = new JsonArray();

                // Only sync first 2 boxes (60 Pokemon max) to reduce payload size
                int maxBoxes = Math.min(2, pc.getBoxes().size());
                int boxIndex = 0;
                for (Object boxObj : pc.getBoxes()) {
                    if (boxIndex >= maxBoxes)
                        break;

                    com.cobblemon.mod.common.api.storage.pc.PCBox box = (com.cobblemon.mod.common.api.storage.pc.PCBox) boxObj;
                    JsonObject boxData = new JsonObject();
                    boxData.addProperty("boxNumber", boxIndex);

                    JsonArray pokemonInBox = new JsonArray();
                    for (int slot = 0; slot < 30; slot++) {
                        Pokemon pokemon = box.get(slot);
                        if (pokemon != null) {
                            JsonObject pokemonData = buildPokemonData(pokemon);
                            pokemonData.addProperty("slot", slot);
                            pokemonInBox.add(pokemonData);
                        }
                    }
                    boxData.add("pokemon", pokemonInBox);
                    pcData.add(boxData);
                    boxIndex++;
                }
                payload.add("pcStorage", pcData);
            } catch (Exception e) {
                logger.error("Failed to sync PC Storage: " + e.getMessage());
                payload.add("pcStorage", new JsonArray());
            }

            // Add CobbleDollars balance if mod is installed
            int balance = cobbleDollarsManager.getPlayerBalance(uuid);
            payload.addProperty("cobbleDollarsBalance", balance);

            // Send to API
            httpClient.postAsync("/api/players/sync", payload)
                    .thenAccept(response -> {
                        if (response != null) {
                            if (response.has("success")) {
                                logger.debug("Synced data for " + player.getName().getString());
                            }

                            // Check ban status from response
                            if (response.has("banned") && response.get("banned").getAsBoolean()) {
                                String reason = response.has("banReason") ? response.get("banReason").getAsString()
                                        : "Sin razón especificada";
                                player.networkHandler.disconnect(
                                        net.minecraft.text.Text.literal(
                                                "§c§l¡Estás baneado del servidor!\n\n" +
                                                        "§7Razón: §f" + reason + "\n\n" +
                                                        "§7Si crees que es un error, contacta a un administrador."));
                                logger.info("Kicked banned player: " + player.getName().getString());
                            }
                        }
                    });

        } catch (IllegalStateException e) {
            // Player disconnected mid-sync - this is expected and not an error
            logger.debug("Player disconnected during sync: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error syncing player data: " + e.getMessage());
        }
    }

    private JsonObject buildPokemonData(Pokemon pokemon) {
        JsonObject data = new JsonObject();

        // Basic info
        data.addProperty("uuid", pokemon.getUuid().toString());
        data.addProperty("species", pokemon.getSpecies().getName());
        data.addProperty("speciesId", pokemon.getSpecies().getNationalPokedexNumber());
        data.addProperty("level", pokemon.getLevel());
        data.addProperty("experience", pokemon.getExperience());
        data.addProperty("shiny", pokemon.getShiny());
        data.addProperty("form", pokemon.getForm().getName());

        // Gender, Nature, Ability
        data.addProperty("gender", pokemon.getGender().name());
        data.addProperty("nature", pokemon.getNature().getName().getPath());
        data.addProperty("ability", pokemon.getAbility().getName());
        data.addProperty("friendship", pokemon.getFriendship());

        // Ball type
        data.addProperty("ball", pokemon.getCaughtBall().getName().getPath());

        // IVs
        JsonObject ivs = new JsonObject();
        ivs.addProperty("hp", pokemon.getIvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.HP));
        ivs.addProperty("attack",
                pokemon.getIvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.ATTACK));
        ivs.addProperty("defense",
                pokemon.getIvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.DEFENCE));
        ivs.addProperty("spAttack",
                pokemon.getIvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_ATTACK));
        ivs.addProperty("spDefense",
                pokemon.getIvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_DEFENCE));
        ivs.addProperty("speed", pokemon.getIvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPEED));
        data.add("ivs", ivs);

        // EVs
        JsonObject evs = new JsonObject();
        evs.addProperty("hp", pokemon.getEvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.HP));
        evs.addProperty("attack",
                pokemon.getEvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.ATTACK));
        evs.addProperty("defense",
                pokemon.getEvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.DEFENCE));
        evs.addProperty("spAttack",
                pokemon.getEvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_ATTACK));
        evs.addProperty("spDefense",
                pokemon.getEvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPECIAL_DEFENCE));
        evs.addProperty("speed", pokemon.getEvs().getOrDefault(com.cobblemon.mod.common.api.pokemon.stats.Stats.SPEED));
        data.add("evs", evs);

        // Moves
        JsonArray moves = new JsonArray();
        try {
            var moveSet = pokemon.getMoveSet();
            for (var move : moveSet) {
                if (move != null) {
                    JsonObject moveObj = new JsonObject();
                    // Get the move template name properly
                    String moveName = move.getTemplate().getName();
                    moveObj.addProperty("name", moveName);
                    moveObj.addProperty("pp", move.getCurrentPp());
                    moveObj.addProperty("maxPp", move.getTemplate().getPp());
                    moves.add(moveObj);
                }
            }
        } catch (Exception e) {
            logger.debug("Could not retrieve moves for Pokemon: " + e.getMessage());
        }
        data.add("moves", moves);

        // Held item
        if (pokemon.heldItem() != null && !pokemon.heldItem().isEmpty()) {
            data.addProperty("heldItem", pokemon.heldItem().getItem().toString());
            data.addProperty("heldItemCount", pokemon.heldItem().getCount());
        }

        // Status
        data.addProperty("currentHealth", pokemon.getCurrentHealth());
        data.addProperty("maxHealth", pokemon.getMaxHealth());
        data.addProperty("status",
                pokemon.getStatus() != null ? pokemon.getStatus().getStatus().getName().getPath() : null);

        return data;
    }

    public void handleSyncCommand(ServerPlayerEntity player) {
        if (player == null)
            return;

        player.sendMessage(
                net.minecraft.text.Text.literal("§a⏳ Sincronizando tus datos con la web..."),
                false);

        syncPlayerData(player);

        // Send confirmation after a short delay (async operation needs time)
        scheduler.schedule(() -> {
            // Check if player is still online
            ServerPlayerEntity stillOnline = server.getPlayerManager().getPlayer(player.getUuid());
            if (stillOnline != null) {
                stillOnline.sendMessage(
                        net.minecraft.text.Text.literal("§a✓ Datos sincronizados correctamente!"),
                        false);
            }
        }, 2, TimeUnit.SECONDS);
    }

    public void shutdown() {
        logger.info("Web sync shutting down...");
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
        }
    }

    /**
     * Handle /ranking sync command - syncs ALL online players immediately
     * Only for OPs to force update the ranking data
     */
    public void handleRankingSyncCommand(net.minecraft.server.command.ServerCommandSource source) {
        if (server == null) return;

        var playerList = server.getPlayerManager().getPlayerList();
        int playerCount = playerList.size();

        if (playerCount == 0) {
            source.sendFeedback(() -> net.minecraft.text.Text.literal("§c✗ No hay jugadores online para sincronizar."), false);
            return;
        }

        source.sendFeedback(() -> net.minecraft.text.Text.literal("§a⏳ Sincronizando " + playerCount + " jugadores para el ranking..."), true);

        // Sync all players in parallel
        int[] synced = {0};
        for (var player : playerList) {
            if (player != null && !player.isDisconnected()) {
                syncPlayerData(player);
                synced[0]++;
            }
        }

        // Send confirmation after a short delay
        scheduler.schedule(() -> {
            source.sendFeedback(() -> net.minecraft.text.Text.literal(
                "§a✓ Ranking actualizado! " + synced[0] + " jugadores sincronizados.\n" +
                "§7Los datos del ranking web se actualizarán en unos segundos."
            ), true);
        }, 3, TimeUnit.SECONDS);

        logger.info("[RANKING SYNC] OP forced sync of " + synced[0] + " players");
    }
}
