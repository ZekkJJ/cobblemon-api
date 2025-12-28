package com.lospitufos.cobblemon.tutorias;

import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.ModLogger;
import net.minecraft.server.MinecraftServer;

/**
 * Manages the Tutorías system integration with Cobblemon.
 * 
 * Features:
 * - Battle log capture for AI analysis
 * - Sends battle data to backend for tutoring features
 */
public class TutoriasManager {
    
    private final HttpClient httpClient;
    private final ModLogger logger;
    private MinecraftServer server;
    private BattleLogCapture battleLogCapture;
    private boolean enabled = true;
    
    public TutoriasManager(HttpClient httpClient, ModLogger logger) {
        this.httpClient = httpClient;
        this.logger = logger;
    }
    
    public void initialize(MinecraftServer server) {
        this.server = server;
        
        logger.info("[TUTORIAS] ========================================");
        logger.info("[TUTORIAS] TutoriasManager initializing...");
        
        // Initialize battle log capture
        battleLogCapture = new BattleLogCapture(httpClient, logger);
        battleLogCapture.initialize(server);
        
        logger.info("[TUTORIAS] ✓ Tutorías system initialized - Battle logging ENABLED");
        logger.info("[TUTORIAS] ========================================");
    }
    
    public void shutdown() {
        enabled = false;
        if (battleLogCapture != null) {
            battleLogCapture.shutdown();
        }
        logger.info("Tutorías system shutdown complete");
    }
    
    public boolean isEnabled() {
        return enabled;
    }
    
    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }
    
    public BattleLogCapture getBattleLogCapture() {
        return battleLogCapture;
    }
    
    /**
     * Get the number of active battles being tracked
     */
    public int getActiveBattleCount() {
        return battleLogCapture != null ? battleLogCapture.getActiveBattleCount() : 0;
    }
}
