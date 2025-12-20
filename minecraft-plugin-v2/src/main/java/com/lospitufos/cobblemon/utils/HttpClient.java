package com.lospitufos.cobblemon.utils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

/**
 * HTTP Client for making async requests to the web API
 */
public class HttpClient {

    private static final Gson GSON = new GsonBuilder().create();
    private static final int TIMEOUT_MS = 60000; // 60 seconds - increased for slow connections
    private static final int MAX_RETRIES = 3; // Maximum retry attempts
    private static final int INITIAL_RETRY_DELAY_MS = 1000; // Start with 1 second

    private final String baseUrl;
    private final ModLogger logger;
    private final ExecutorService executor;

    public HttpClient(String baseUrl, ModLogger logger) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.logger = logger;
        // Increased thread pool to 8 for better concurrency
        this.executor = Executors.newFixedThreadPool(8);
    }

    /**
     * Async GET request
     */
    public CompletableFuture<JsonObject> getAsync(String endpoint) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return get(endpoint);
            } catch (IOException e) {
                logger.error("GET request failed: " + endpoint, e);
                return null;
            }
        }, executor);
    }

    /**
     * Sync GET request with retry logic
     */
    public JsonObject get(String endpoint) throws IOException {
        return executeWithRetry(() -> getInternal(endpoint), endpoint, "GET");
    }

    /**
     * Internal GET request implementation
     */
    private JsonObject getInternal(String endpoint) throws IOException {
        URL url = new URL(baseUrl + endpoint);
        HttpURLConnection conn = null;

        try {
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(TIMEOUT_MS);
            conn.setReadTimeout(TIMEOUT_MS);
            conn.setRequestProperty("Content-Type", "application/json");

            int responseCode = conn.getResponseCode();

            if (responseCode == 200) {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    return JsonParser.parseReader(reader).getAsJsonObject();
                }
            } else {
                // Read error body
                String errorBody = "";
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    errorBody = sb.toString();
                } catch (Exception e) {
                    // Ignore if can't read error body
                }

                logger.warn("GET failed: " + endpoint +
                        " (Status: " + responseCode + ")" +
                        (errorBody.isEmpty() ? "" : " Body: " + errorBody));
                return null;
            }
        } catch (java.net.ConnectException e) {
            logger.error("Failed to connect to API: " + baseUrl +
                    ". Is the web server running?");
            throw e;
        } catch (java.net.SocketTimeoutException e) {
            logger.error("Request timeout: " + endpoint +
                    ". API is taking too long to respond.");
            throw e;
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    /**
     * Async POST request
     */
    public CompletableFuture<JsonObject> postAsync(String endpoint, JsonObject payload) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return post(endpoint, payload);
            } catch (IOException e) {
                logger.error("POST request failed: " + endpoint, e);
                return null;
            }
        }, executor);
    }

    /**
     * Sync POST request with retry logic
     */
    public JsonObject post(String endpoint, JsonObject payload) throws IOException {
        return executeWithRetry(() -> postInternal(endpoint, payload), endpoint, "POST");
    }

    /**
     * Internal POST request implementation
     */
    private JsonObject postInternal(String endpoint, JsonObject payload) throws IOException {
        URL url = new URL(baseUrl + endpoint);
        HttpURLConnection conn = null;

        try {
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(TIMEOUT_MS);
            conn.setReadTimeout(TIMEOUT_MS);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            // Write payload
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = GSON.toJson(payload).getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();

            if (responseCode >= 200 && responseCode < 300) {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    return JsonParser.parseReader(reader).getAsJsonObject();
                }
            } else {
                // Read error body
                String errorBody = "";
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    errorBody = sb.toString();
                } catch (Exception e) {
                    // Ignore if can't read error body
                }

                logger.warn("POST failed: " + endpoint +
                        " (Status: " + responseCode + ")" +
                        (errorBody.isEmpty() ? "" : " Body: " + errorBody));
                return null;
            }
        } catch (java.net.ConnectException e) {
            logger.error("Failed to connect to API: " + baseUrl +
                    ". Is the web server running?");
            throw e;
        } catch (java.net.SocketTimeoutException e) {
            logger.error("Request timeout: " + endpoint +
                    ". API is taking too long to respond.");
            throw e;
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    /**
     * Execute request with exponential backoff retry logic
     */
    private JsonObject executeWithRetry(IOSupplier<JsonObject> supplier, String endpoint, String method)
            throws IOException {
        int attempt = 0;
        IOException lastException = null;

        while (attempt < MAX_RETRIES) {
            try {
                return supplier.get();
            } catch (java.net.SocketTimeoutException | java.net.ConnectException e) {
                lastException = e;
                attempt++;

                if (attempt < MAX_RETRIES) {
                    int delayMs = INITIAL_RETRY_DELAY_MS * (int) Math.pow(2, attempt - 1);
                    logger.warn(method + " request failed (attempt " + attempt + "/" + MAX_RETRIES + "): " + endpoint +
                            ". Retrying in " + delayMs + "ms...");

                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new IOException("Request interrupted during retry", ie);
                    }
                } else {
                    logger.error(method + " request failed after " + MAX_RETRIES + " attempts: " + endpoint);
                }
            }
        }

        throw lastException;
    }

    /**
     * Functional interface for IO operations
     */
    @FunctionalInterface
    private interface IOSupplier<T> {
        T get() throws IOException;
    }

    /**
     * Shutdown executor
     */
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }
}
