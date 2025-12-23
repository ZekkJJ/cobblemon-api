package com.lospitufos.cobblemon.core;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configuration manager for the plugin
 * Loads from config/cobblemon-lospitufos-v2/config.json
 */
public class Config {

    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final String CONFIG_DIR = "config/cobblemon-lospitufos-v2";
    private static final String CONFIG_FILE = "config.json";

    // Web API settings
    private String webApiUrl = "https://api.playadoradarp.xyz/port/25617";
    private String frontendUrl = "https://cobblemon-los-pitufos.vercel.app";

    // Feature toggles
    private boolean verificationEnabled = true;
    private boolean starterManagementEnabled = true;
    private boolean webSyncEnabled = true;
    private boolean levelCapsEnabled = true;

    // Sync settings
    private int syncIntervalSeconds = 600; // 10 minutes (reduced to prevent lag)
    private boolean syncOnCapture = false; // Disabled to prevent lag spikes
    private boolean syncOnEvolution = false; // Disabled to prevent lag spikes

    // Verification settings
    private boolean freezeUnverified = true;
    private String verificationMessage = "§cDebes verificar tu cuenta antes de jugar. Usa /verify <código>";

    // Discord webhook (optional)
    private String discordWebhookUrl = "";
    private boolean sendVerificationNotifications = false;

    /**
     * Load configuration from file, creating default if doesn't exist
     */
    public static Config load() throws IOException {
        Path configDir = Paths.get(CONFIG_DIR);
        Path configFile = configDir.resolve(CONFIG_FILE);

        // Create directory if doesn't exist
        if (!Files.exists(configDir)) {
            Files.createDirectories(configDir);
        }

        // Load or create default config
        if (Files.exists(configFile)) {
            try (Reader reader = Files.newBufferedReader(configFile)) {
                return GSON.fromJson(reader, Config.class);
            }
        } else {
            // Create default config
            Config defaultConfig = new Config();
            defaultConfig.save();
            return defaultConfig;
        }
    }

    /**
     * Save current configuration to file
     */
    public void save() throws IOException {
        Path configDir = Paths.get(CONFIG_DIR);
        Path configFile = configDir.resolve(CONFIG_FILE);

        if (!Files.exists(configDir)) {
            Files.createDirectories(configDir);
        }

        try (Writer writer = Files.newBufferedWriter(configFile)) {
            GSON.toJson(this, writer);
        }
    }

    // Getters
    public String getWebApiUrl() {
        return webApiUrl;
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }

    public boolean isVerificationEnabled() {
        return verificationEnabled;
    }

    public boolean isStarterManagementEnabled() {
        return starterManagementEnabled;
    }

    public boolean isWebSyncEnabled() {
        return webSyncEnabled;
    }

    public boolean isLevelCapsEnabled() {
        return levelCapsEnabled;
    }

    public int getSyncIntervalSeconds() {
        return syncIntervalSeconds;
    }

    public boolean isSyncOnCapture() {
        return syncOnCapture;
    }

    public boolean isSyncOnEvolution() {
        return syncOnEvolution;
    }

    public boolean isFreezeUnverified() {
        return freezeUnverified;
    }

    public String getVerificationMessage() {
        return verificationMessage;
    }

    public String getDiscordWebhookUrl() {
        return discordWebhookUrl;
    }

    public boolean isSendVerificationNotifications() {
        return sendVerificationNotifications;
    }

    // Setters for runtime modification
    public void setWebApiUrl(String url) {
        this.webApiUrl = url;
    }

    public void setVerificationEnabled(boolean enabled) {
        this.verificationEnabled = enabled;
    }

    public void setStarterManagementEnabled(boolean enabled) {
        this.starterManagementEnabled = enabled;
    }

    public void setWebSyncEnabled(boolean enabled) {
        this.webSyncEnabled = enabled;
    }

    public void setLevelCapsEnabled(boolean enabled) {
        this.levelCapsEnabled = enabled;
    }
}
