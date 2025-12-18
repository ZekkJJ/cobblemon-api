package com.lospitufos.cobblemon.economy;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.lospitufos.cobblemon.utils.ModLogger;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Manages CobbleDollars economy integration
 * Reads player balance from cobbledollarsplayerdata folder
 */
public class CobbleDollarsManager {
    
    private static final String COBBLEDOLLARS_PATH = "world/cobbledollarsplayerdata";
    private final ModLogger logger;
    
    public CobbleDollarsManager(ModLogger logger) {
        this.logger = logger;
    }
    
    /**
     * Get player's CobbleDollars balance
     * Returns 0 if file doesn't exist or error occurs
     */
    public int getPlayerBalance(UUID playerUuid) {
        try {
            Path playerFile = Paths.get(COBBLEDOLLARS_PATH, playerUuid.toString() + ".json");
            
            if (Files.exists(playerFile)) {
                String content = Files.readString(playerFile);
                JsonObject data = JsonParser.parseString(content).getAsJsonObject();
                
                if (data.has("balance")) {
                    return data.get("balance").getAsInt();
                }
            }
        } catch (IOException e) {
            logger.debug("Could not read CobbleDollars data for " + playerUuid + ": " + e.getMessage());
        } catch (Exception e) {
            logger.error("Error parsing CobbleDollars data for " + playerUuid + ": " + e.getMessage());
        }
        
        return 0;
    }
    
    /**
     * Set player's CobbleDollars balance
     * Creates file if it doesn't exist
     */
    public boolean setPlayerBalance(UUID playerUuid, int balance) {
        try {
            Path dataDir = Paths.get(COBBLEDOLLARS_PATH);
            if (!Files.exists(dataDir)) {
                Files.createDirectories(dataDir);
            }
            
            Path playerFile = dataDir.resolve(playerUuid.toString() + ".json");
            
            JsonObject data = new JsonObject();
            data.addProperty("balance", balance);
            
            Files.writeString(playerFile, data.toString());
            return true;
        } catch (IOException e) {
            logger.error("Could not write CobbleDollars data for " + playerUuid + ": " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Check if CobbleDollars mod is installed
     */
    public boolean isCobbleDollarsInstalled() {
        Path dataDir = Paths.get(COBBLEDOLLARS_PATH);
        return Files.exists(dataDir) && Files.isDirectory(dataDir);
    }
}
