package com.lospitufos.cobblemon.utils;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Secure HTTP client with HMAC signing for plugin-to-backend communication.
 * Implements anti-tamper measures including:
 * - HMAC-SHA256 request signing
 * - Timestamp validation (prevents replay attacks)
 * - Nonce generation (prevents duplicate requests)
 */
public class SecureHttpClient {
    
    private final String baseUrl;
    private final String secretKey;
    private final SecureRandom random = new SecureRandom();
    
    public SecureHttpClient(String baseUrl, String secretKey) {
        this.baseUrl = baseUrl;
        this.secretKey = secretKey;
    }
    
    /**
     * Sends a signed POST request to the backend
     * @param endpoint API endpoint (e.g., "/api/tutorias/battle-log/store")
     * @param payload JSON payload to send
     * @return Response as JsonObject
     */
    public JsonObject signedPost(String endpoint, JsonObject payload) throws Exception {
        // Add timestamp to prevent replay attacks
        long timestamp = System.currentTimeMillis();
        payload.addProperty("timestamp", timestamp);
        
        // Add nonce to prevent duplicate requests
        String nonce = generateNonce();
        payload.addProperty("nonce", nonce);
        
        // Generate HMAC signature
        String dataToSign = payload.toString();
        String signature = generateHMAC(dataToSign);
        payload.addProperty("signature", signature);
        
        // Send request
        return post(endpoint, payload);
    }
    
    /**
     * Sends a signed GET request to the backend
     * @param endpoint API endpoint with query parameters
     * @return Response as JsonObject
     */
    public JsonObject signedGet(String endpoint) throws Exception {
        // Add timestamp and nonce to query string
        long timestamp = System.currentTimeMillis();
        String nonce = generateNonce();
        
        String separator = endpoint.contains("?") ? "&" : "?";
        String signedEndpoint = endpoint + separator + "timestamp=" + timestamp + "&nonce=" + nonce;
        
        // Generate signature from the endpoint
        String signature = generateHMAC(signedEndpoint);
        signedEndpoint += "&signature=" + signature;
        
        return get(signedEndpoint);
    }
    
    /**
     * Generates HMAC-SHA256 signature
     */
    private String generateHMAC(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(
            secretKey.getBytes(StandardCharsets.UTF_8), 
            "HmacSHA256"
        );
        mac.init(secretKeySpec);
        byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hmacBytes);
    }
    
    /**
     * Generates a random nonce for request uniqueness
     */
    private String generateNonce() {
        byte[] nonceBytes = new byte[16];
        random.nextBytes(nonceBytes);
        return Base64.getEncoder().encodeToString(nonceBytes);
    }
    
    /**
     * Sends a POST request
     */
    private JsonObject post(String endpoint, JsonObject payload) throws Exception {
        URL url = new URL(baseUrl + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        try {
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("X-Plugin-Version", "2.0");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(30000);
            
            // Write payload
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Read response
            int responseCode = conn.getResponseCode();
            InputStream is = responseCode >= 400 ? conn.getErrorStream() : conn.getInputStream();
            
            if (is == null) {
                JsonObject error = new JsonObject();
                error.addProperty("success", false);
                error.addProperty("error", "No response from server");
                return error;
            }
            
            try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                return JsonParser.parseString(response.toString()).getAsJsonObject();
            }
        } finally {
            conn.disconnect();
        }
    }
    
    /**
     * Sends a GET request
     */
    private JsonObject get(String endpoint) throws Exception {
        URL url = new URL(baseUrl + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        try {
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("X-Plugin-Version", "2.0");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(30000);
            
            // Read response
            int responseCode = conn.getResponseCode();
            InputStream is = responseCode >= 400 ? conn.getErrorStream() : conn.getInputStream();
            
            if (is == null) {
                JsonObject error = new JsonObject();
                error.addProperty("success", false);
                error.addProperty("error", "No response from server");
                return error;
            }
            
            try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                return JsonParser.parseString(response.toString()).getAsJsonObject();
            }
        } finally {
            conn.disconnect();
        }
    }
    
    /**
     * Validates a signature from an incoming request (for backend verification)
     */
    public boolean validateSignature(String data, String providedSignature) {
        try {
            String expectedSignature = generateHMAC(data);
            return expectedSignature.equals(providedSignature);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Checks if a timestamp is within acceptable range (5 minutes)
     */
    public boolean isTimestampValid(long timestamp) {
        long now = System.currentTimeMillis();
        long fiveMinutes = 5 * 60 * 1000;
        return Math.abs(now - timestamp) <= fiveMinutes;
    }
}
