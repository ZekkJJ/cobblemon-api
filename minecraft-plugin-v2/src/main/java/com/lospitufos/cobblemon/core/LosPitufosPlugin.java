package com.lospitufos.cobblemon.core;

import com.lospitufos.cobblemon.utils.ModLogger;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.DiscordWebhookManager;
import com.lospitufos.cobblemon.verification.VerificationManager;
import com.lospitufos.cobblemon.starter.StarterManager;
import com.lospitufos.cobblemon.sync.WebSyncManager;
import com.lospitufos.cobblemon.levelcaps.LevelCapManager;
import com.lospitufos.cobblemon.shop.ShopManager;
import com.lospitufos.cobblemon.tournament.TournamentManager;
import com.lospitufos.cobblemon.tournament.TournamentCommands;
import com.lospitufos.cobblemon.tournament.BattleListener;

import net.fabricmc.api.DedicatedServerModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.command.CommandManager;
import com.mojang.brigadier.arguments.StringArgumentType;

/**
 * Cobblemon Los Pitufos Plugin V2
 * 
 * Clean, modular rewrite using Cobblemon 1.7.1+ native APIs
 * 
 * Features:
 * - Player verification system (freeze until verified)
 * - Starter Pokemon management (force-assign from web)
 * - Real-time sync with web (player data & Pokemon)
 * - Level cap enforcement (capture & ownership limits)
 */
public class LosPitufosPlugin implements DedicatedServerModInitializer {

    public static final String MOD_ID = "cobblemon-lospitufos-v2";
    public static final String VERSION = "2.0.0";

    private static LosPitufosPlugin instance;
    private static MinecraftServer server;

    // Core components
    private Config config;
    private HttpClient httpClient;
    private ModLogger logger;
    private DiscordWebhookManager discordWebhook;

    // Feature managers
    private VerificationManager verificationManager;
    private StarterManager starterManager;
    private WebSyncManager syncManager;
    private LevelCapManager levelCapManager;
    private ShopManager shopManager;
    private TournamentManager tournamentManager;
    private BattleListener battleListener;

    @Override
    public void onInitializeServer() {
        instance = this;

        // Initialize logger first
        logger = new ModLogger(MOD_ID);
        logger.info("=".repeat(50));
        logger.info("Cobblemon Los Pitufos V2 - Starting...");
        logger.info("Version: " + VERSION);
        logger.info("=".repeat(50));

        // Load configuration
        try {
            config = Config.load();
            logger.info("Configuration loaded successfully");
        } catch (Exception e) {
            logger.error("Failed to load configuration: " + e.getMessage());
            e.printStackTrace();
            return;
        }

        // Initialize HTTP client
        httpClient = new HttpClient(config.getWebApiUrl(), logger);
        logger.info("HTTP Client initialized: " + config.getWebApiUrl());
        
        // Initialize Discord webhook
        discordWebhook = new DiscordWebhookManager(config.getDiscordWebhookUrl(), logger);

        // Register commands EARLY (before server starts)
        registerCommands();

        // Register lifecycle events
        ServerLifecycleEvents.SERVER_STARTED.register(this::onServerStarted);
        ServerLifecycleEvents.SERVER_STOPPING.register(this::onServerStopping);

        logger.info("✓ Core initialization complete");
    }

    private void registerCommands() {
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> {
            // Verification commands
            if (config.isVerificationEnabled()) {
                dispatcher.register(
                    CommandManager.literal("verify")
                        .then(CommandManager.argument("code", StringArgumentType.string())
                            .executes(context -> {
                                if (verificationManager != null) {
                                    verificationManager.handleVerifyCommand(context.getSource().getPlayer(), 
                                        StringArgumentType.getString(context, "code"));
                                }
                                return 1;
                            })
                        )
                );
                
                dispatcher.register(
                    CommandManager.literal("codigo")
                        .executes(context -> {
                            if (verificationManager != null) {
                                verificationManager.handleCodigoCommand(context.getSource().getPlayer());
                            }
                            return 1;
                        })
                );
                logger.info("✓ Verification commands registered");
            }

            // Shop command
            dispatcher.register(
                CommandManager.literal("claimshop")
                    .executes(context -> {
                        if (shopManager != null) {
                            shopManager.handleClaimCommand(context.getSource().getPlayer());
                        }
                        return 1;
                    })
            );
            logger.info("✓ Shop commands registered");

            // Sync command
            if (config.isWebSyncEnabled()) {
                dispatcher.register(
                    CommandManager.literal("syncnow")
                        .executes(context -> {
                            if (syncManager != null) {
                                syncManager.handleSyncCommand(context.getSource().getPlayer());
                            }
                            return 1;
                        })
                );
                logger.info("✓ Sync commands registered");
            }

            // Starter admin command
            if (config.isStarterManagementEnabled()) {
                dispatcher.register(
                    CommandManager.literal("lospitufos")
                        .then(CommandManager.literal("forcestarter")
                            .requires(source -> source.hasPermissionLevel(2))
                            .executes(context -> {
                                if (starterManager != null) {
                                    starterManager.handleForceStarterCommand(context.getSource().getPlayer());
                                }
                                return 1;
                            })
                        )
                );
                logger.info("✓ Admin commands registered");
            }

            // Tournament commands: /torneo join|leave|info
            dispatcher.register(
                CommandManager.literal("torneo")
                    .then(CommandManager.literal("join")
                        .then(CommandManager.argument("code", StringArgumentType.string())
                            .executes(context -> {
                                if (tournamentManager != null) {
                                    tournamentManager.handleJoinCommand(
                                        context.getSource().getPlayer(),
                                        StringArgumentType.getString(context, "code")
                                    );
                                }
                                return 1;
                            })
                        )
                    )
                    .then(CommandManager.literal("leave")
                        .executes(context -> {
                            if (tournamentManager != null) {
                                tournamentManager.handleLeaveCommand(context.getSource().getPlayer());
                            }
                            return 1;
                        })
                    )
                    .then(CommandManager.literal("info")
                        .executes(context -> {
                            if (tournamentManager != null) {
                                tournamentManager.handleInfoCommand(context.getSource().getPlayer());
                            }
                            return 1;
                        })
                    )
            );
            logger.info("✓ Tournament commands registered");
        });
    }

    private void onServerStarted(MinecraftServer minecraftServer) {
        server = minecraftServer;
        logger.info("Server started - Initializing feature modules...");

        try {
            // Initialize feature managers
            if (config.isVerificationEnabled()) {
                verificationManager = new VerificationManager(httpClient, logger);
                verificationManager.initialize(server, config);
                logger.info("✓ Verification system enabled");
            }

            if (config.isStarterManagementEnabled()) {
                starterManager = new StarterManager(httpClient, logger);
                starterManager.initialize(server);
                logger.info("✓ Starter management enabled");
            }

            if (config.isWebSyncEnabled()) {
                syncManager = new WebSyncManager(httpClient, logger, config);
                syncManager.initialize(server);
                logger.info("✓ Web sync enabled");
            }

            if (config.isLevelCapsEnabled()) {
                levelCapManager = new LevelCapManager(httpClient, logger, config);
                levelCapManager.initialize(server);
                logger.info("✓ Level caps enabled");
            }

            shopManager = new ShopManager(httpClient, logger);
            shopManager.initialize(server);
            logger.info("✓ Shop system enabled");

            // Initialize tournament system
            tournamentManager = new TournamentManager(httpClient, logger);
            tournamentManager.initialize(server);
            battleListener = new BattleListener(tournamentManager, logger);
            battleListener.initialize(server);
            logger.info("✓ Tournament system enabled");

            logger.info("=".repeat(50));
            logger.info("✓ All systems operational!");
            logger.info("=".repeat(50));

        } catch (Exception e) {
            logger.error("Failed to initialize feature modules: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void onServerStopping(MinecraftServer minecraftServer) {
        logger.info("Server stopping - Shutting down gracefully...");

        // Cleanup managers
        if (tournamentManager != null)
            tournamentManager.shutdown();
        if (battleListener != null)
            battleListener.shutdown();
        if (shopManager != null)
            shopManager.shutdown();
        if (syncManager != null)
            syncManager.shutdown();
        if (levelCapManager != null)
            levelCapManager.shutdown();
        if (starterManager != null)
            starterManager.shutdown();
        if (verificationManager != null)
            verificationManager.shutdown();

        logger.info("✓ Shutdown complete");
    }

    // Getters
    public static LosPitufosPlugin getInstance() {
        return instance;
    }

    public static MinecraftServer getServer() {
        return server;
    }

    public Config getConfig() {
        return config;
    }

    public HttpClient getHttpClient() {
        return httpClient;
    }

    public ModLogger getLogger() {
        return logger;
    }

    public VerificationManager getVerificationManager() {
        return verificationManager;
    }

    public StarterManager getStarterManager() {
        return starterManager;
    }

    public WebSyncManager getSyncManager() {
        return syncManager;
    }

    public LevelCapManager getLevelCapManager() {
        return levelCapManager;
    }
    
    public ShopManager getShopManager() {
        return shopManager;
    }
    
    public TournamentManager getTournamentManager() {
        return tournamentManager;
    }
    
    public DiscordWebhookManager getDiscordWebhook() {
        return discordWebhook;
    }
}
