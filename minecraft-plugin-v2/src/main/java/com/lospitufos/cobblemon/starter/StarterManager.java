package com.lospitufos.cobblemon.starter;

import com.cobblemon.mod.common.Cobblemon;
import com.cobblemon.mod.common.api.pokemon.PokemonSpecies;
import com.cobblemon.mod.common.api.storage.party.PlayerPartyStore;
import com.cobblemon.mod.common.pokemon.Pokemon;
import com.cobblemon.mod.common.pokemon.Species;
import com.google.gson.JsonObject;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.Identifier;

import java.util.LinkedHashSet;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Manages starter Pokemon assignment using Cobblemon native APIs
 * NO manual JSON manipulation
 */
public class StarterManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private final ExecutorService executor;
    
    public StarterManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.executor = Executors.newSingleThreadExecutor();
    }
    
    public void initialize(MinecraftServer server) {
        logger.info("Starter management initializing...");
        
        // Check for pending starters on join
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server1) -> {
            checkAndGiveStarter(handler.getPlayer());
        });
        
        logger.info("✓ Starter management initialized");
    }

    public void handleForceStarterCommand(ServerPlayerEntity player) {
        if (player != null) {
            checkAndGiveStarter(player);
            player.sendMessage(Text.literal("§aChecking starter for " + player.getName().getString()));
        }
    }
    
    private void checkAndGiveStarter(ServerPlayerEntity player) {
        UUID uuid = player.getUuid();
        
        // Check if player has pending starter from API
        httpClient.getAsync("/api/players/starter?uuid=" + uuid.toString())
            .thenAcceptAsync(response -> {
                if (response != null && response.has("pending") && response.get("pending").getAsBoolean()) {
                    int pokemonId = response.get("pokemonId").getAsInt();
                    boolean isShiny = response.has("isShiny") && response.get("isShiny").getAsBoolean();
                    
                    logger.info("Giving starter to " + player.getName().getString() + " - ID: " + pokemonId + ", Shiny: " + isShiny);
                    giveStarterPokemon(player, pokemonId, isShiny);
                }
            }, executor);
    }
    
    private void giveStarterPokemon(ServerPlayerEntity player, int pokemonId, boolean isShiny) {
        try {
            // Get player's party using Cobblemon API
            PlayerPartyStore party = Cobblemon.INSTANCE.getStorage().getParty(player);
            
            // Check if player already has Pokemon - DO NOT give duplicate starter
            if (!party.isEmpty()) {
                logger.info("Player " + player.getName().getString() + " already has Pokemon in party - skipping starter");
                player.sendMessage(Text.literal("§e⚠ Ya tienes Pokémon en tu equipo"));
                
                // Notify API that starter was already given (mark as complete)
                notifyStarterGiven(player.getUuid(), pokemonId);
                return;
            }
            
            // Get Species by Pokedex number (empty string for default aspects)
            Species species = PokemonSpecies.INSTANCE.getByPokedexNumber(pokemonId, "");
            
            if (species == null) {
                logger.error("Species not found for Pokedex ID: " + pokemonId);
                player.sendMessage(Text.literal("§cError: Pokémon no encontrado"));
                return;
            }
            
            // Create Pokemon at level 5
            Pokemon pokemon = species.create(5);
            
            if (isShiny) {
                pokemon.setShiny(true);
            }
            
            // Add to party
            party.add(pokemon);
            
            player.sendMessage(Text.literal("§a✓ ¡Has recibido tu Pokémon inicial!"));
            logger.info("Successfully gave starter " + species.getName() + " to " + player.getName().getString());
            
            // Notify API that starter was given
            notifyStarterGiven(player.getUuid(), pokemonId);
            
        } catch (Exception e) {
            logger.error("Error giving starter: " + e.getMessage(), e);
            player.sendMessage(Text.literal("§cError al dar el Pokémon inicial"));
        }
    }
    
    private void notifyStarterGiven(UUID playerUuid, int pokemonId) {
        JsonObject payload = new JsonObject();
        payload.addProperty("uuid", playerUuid.toString());
        payload.addProperty("pokemonId", pokemonId);
        payload.addProperty("given", true);
        
        httpClient.postAsync("/api/players/starter-given", payload)
            .thenAccept(response -> {
                if (response != null && response.has("success")) {
                    logger.info("Notified API about starter given for " + playerUuid);
                }
            });
    }
    
    public void shutdown() {
        logger.info("Starter management shutting down...");
        executor.shutdown();
    }
}
