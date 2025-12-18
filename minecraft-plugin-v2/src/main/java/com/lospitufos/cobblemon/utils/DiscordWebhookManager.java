package com.lospitufos.cobblemon.utils;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Manages Discord webhook notifications
 */
public class DiscordWebhookManager {
    
    private final String webhookUrl;
    private final ModLogger logger;
    private final boolean enabled;
    
    public DiscordWebhookManager(String webhookUrl, ModLogger logger) {
        this.webhookUrl = webhookUrl;
        this.logger = logger;
        this.enabled = webhookUrl != null && !webhookUrl.isEmpty() && webhookUrl.startsWith("https://discord.com/api/webhooks/");
        
        if (enabled) {
            logger.info("Discord webhook notifications enabled");
        } else {
            logger.info("Discord webhook notifications disabled");
        }
    }
    
    public void sendVerificationNotification(String username, String code) {
        if (!enabled) return;
        
        try {
            JsonObject embed = new JsonObject();
            embed.addProperty("title", "\uD83D\uDD10 Nueva Verificación");
            embed.addProperty("description", 
                "**Jugador:** " + username + "\n" +
                "**Código:** `" + code + "`\n\n" +
                "El jugador debe ingresar este código en la web para verificar su cuenta.");
            embed.addProperty("color", 3447003); // Blue color
            embed.addProperty("timestamp", java.time.Instant.now().toString());
            
            JsonArray embeds = new JsonArray();
            embeds.add(embed);
            
            JsonObject payload = new JsonObject();
            payload.add("embeds", embeds);
            
            sendWebhook(payload);
            logger.debug("Sent verification webhook for " + username);
        } catch (Exception e) {
            logger.error("Failed to send Discord webhook: " + e.getMessage());
        }
    }
    
    public void sendBanNotification(String username, String reason) {
        if (!enabled) return;
        
        try {
            JsonObject embed = new JsonObject();
            embed.addProperty("title", "🚫 Jugador Baneado");
            embed.addProperty("description", 
                "**Jugador:** " + username + "\n" +
                "**Razón:** " + reason);
            embed.addProperty("color", 15158332); // Red color
            embed.addProperty("timestamp", java.time.Instant.now().toString());
            
            JsonArray embeds = new JsonArray();
            embeds.add(embed);
            
            JsonObject payload = new JsonObject();
            payload.add("embeds", embeds);
            
            sendWebhook(payload);
            logger.debug("Sent ban webhook for " + username);
        } catch (Exception e) {
            logger.error("Failed to send Discord webhook: " + e.getMessage());
        }
    }
    
    public void sendStarterGivenNotification(String username, String pokemonName, boolean isShiny) {
        if (!enabled) return;
        
        try {
            JsonObject embed = new JsonObject();
            embed.addProperty("title", "⭐ Starter Entregado");
            embed.addProperty("description", 
                "**Jugador:** " + username + "\n" +
                "**Pokémon:** " + pokemonName + (isShiny ? " ✨ (Shiny)" : ""));
            embed.addProperty("color", 3066993); // Green color
            embed.addProperty("timestamp", java.time.Instant.now().toString());
            
            JsonArray embeds = new JsonArray();
            embeds.add(embed);
            
            JsonObject payload = new JsonObject();
            payload.add("embeds", embeds);
            
            sendWebhook(payload);
            logger.debug("Sent starter webhook for " + username);
        } catch (Exception e) {
            logger.error("Failed to send Discord webhook: " + e.getMessage());
        }
    }
    
    private void sendWebhook(JsonObject payload) throws Exception {
        URL url = new URL(webhookUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        try {
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int responseCode = conn.getResponseCode();
            if (responseCode < 200 || responseCode >= 300) {
                logger.warn("Discord webhook returned status: " + responseCode);
            }
        } finally {
            conn.disconnect();
        }
    }
    
    public boolean isEnabled() {
        return enabled;
    }
}
