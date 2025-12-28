package com.lospitufos.cobblemon.core;

import com.lospitufos.cobblemon.utils.ModLogger;
import com.lospitufos.cobblemon.utils.HttpClient;
import com.lospitufos.cobblemon.utils.DiscordWebhookManager;
import com.lospitufos.cobblemon.verification.VerificationManager;
import com.lospitufos.cobblemon.starter.StarterManager;
import com.lospitufos.cobblemon.sync.WebSyncManager;
import com.lospitufos.cobblemon.levelcaps.LevelCapManager;
import com.lospitufos.cobblemon.shop.ShopManager;
import com.lospitufos.cobblemon.playershop.PlayerShopManager;
import com.lospitufos.cobblemon.tournament.TournamentManager;
import com.lospitufos.cobblemon.tournament.TournamentCommands;
import com.lospitufos.cobblemon.tournament.BattleListener;
import com.lospitufos.cobblemon.economy.EconomyManager;
import com.lospitufos.cobblemon.gacha.GachaManager;
import com.lospitufos.cobblemon.tutorias.TutoriasManager;
import com.lospitufos.cobblemon.admin.AdminSyncManager;

import net.fabricmc.api.DedicatedServerModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.command.CommandManager;
import net.minecraft.command.argument.EntityArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;

import java.util.List;

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
    private PlayerShopManager playerShopManager;
    private TournamentManager tournamentManager;
    private BattleListener battleListener;
    private EconomyManager economyManager;
    private GachaManager gachaManager;
    private TutoriasManager tutoriasManager;
    private AdminSyncManager adminSyncManager;

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

            // Player Shop (Marketplace) commands
            dispatcher.register(
                CommandManager.literal("claimmarket")
                    .executes(context -> {
                        if (playerShopManager != null) {
                            playerShopManager.handleClaimCommand(context.getSource().getPlayer());
                        }
                        return 1;
                    })
            );
            dispatcher.register(
                CommandManager.literal("market")
                    .executes(context -> {
                        if (playerShopManager != null) {
                            playerShopManager.handleMarketCommand(context.getSource().getPlayer());
                        }
                        return 1;
                    })
            );
            logger.info("✓ Player Shop (Marketplace) commands registered");

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
                
                // Ranking sync command for OPs - syncs ALL online players
                dispatcher.register(
                    CommandManager.literal("ranking")
                        .then(CommandManager.literal("sync")
                            .requires(source -> source.hasPermissionLevel(2)) // OP only
                            .executes(context -> {
                                if (syncManager != null) {
                                    syncManager.handleRankingSyncCommand(context.getSource());
                                }
                                return 1;
                            })
                        )
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

            // Economy commands: /bounties
            dispatcher.register(
                CommandManager.literal("bounties")
                    .executes(context -> {
                        if (economyManager != null) {
                            economyManager.showBounties(context.getSource().getPlayer());
                        }
                        return 1;
                    })
            );
            dispatcher.register(
                CommandManager.literal("recompensas")
                    .executes(context -> {
                        if (economyManager != null) {
                            economyManager.showBounties(context.getSource().getPlayer());
                        }
                        return 1;
                    })
            );
            // Synergy info command
            dispatcher.register(
                CommandManager.literal("sinergia")
                    .executes(context -> {
                        if (economyManager != null) {
                            economyManager.showSynergyInfo(context.getSource().getPlayer());
                        }
                        return 1;
                    })
            );
            dispatcher.register(
                CommandManager.literal("synergy")
                    .executes(context -> {
                        if (economyManager != null) {
                            economyManager.showSynergyInfo(context.getSource().getPlayer());
                        }
                        return 1;
                    })
            );
            logger.info("✓ Economy commands registered");

            // Gacha commands: /claimgacha
            dispatcher.register(
                CommandManager.literal("claimgacha")
                    .executes(context -> {
                        if (gachaManager != null) {
                            gachaManager.handleClaimCommand(context.getSource().getPlayer());
                        }
                        return 1;
                    })
            );
            dispatcher.register(
                CommandManager.literal("gacha")
                    .then(CommandManager.literal("claim")
                        .executes(context -> {
                            if (gachaManager != null) {
                                gachaManager.handleClaimCommand(context.getSource().getPlayer());
                            }
                            return 1;
                        })
                    )
            );
            
            // Admin: /cleargacha <player> [refund] - Clear all gacha pokemon from player's PC and DB
            dispatcher.register(
                CommandManager.literal("cleargacha")
                    .requires(source -> source.hasPermissionLevel(2)) // OP only
                    .then(CommandManager.argument("player", EntityArgumentType.player())
                        .executes(context -> {
                            if (gachaManager != null) {
                                ServerPlayerEntity target = EntityArgumentType.getPlayer(context, "player");
                                gachaManager.handleClearGachaCommand(
                                    context.getSource().getPlayer(),
                                    target,
                                    false // no refund by default
                                );
                            }
                            return 1;
                        })
                        .then(CommandManager.literal("refund")
                            .executes(context -> {
                                if (gachaManager != null) {
                                    ServerPlayerEntity target = EntityArgumentType.getPlayer(context, "player");
                                    gachaManager.handleClearGachaCommand(
                                        context.getSource().getPlayer(),
                                        target,
                                        true // with refund
                                    );
                                }
                                return 1;
                            })
                        )
                    )
            );
            
            // Admin: /cleargachauuid <uuid> [refund] - Clear gacha DB for offline player by UUID
            dispatcher.register(
                CommandManager.literal("cleargachauuid")
                    .requires(source -> source.hasPermissionLevel(2)) // OP only
                    .then(CommandManager.argument("uuid", StringArgumentType.string())
                        .executes(context -> {
                            if (gachaManager != null) {
                                String uuid = StringArgumentType.getString(context, "uuid");
                                gachaManager.handleClearGachaOffline(
                                    context.getSource().getPlayer(),
                                    uuid,
                                    false // no refund by default
                                );
                            }
                            return 1;
                        })
                        .then(CommandManager.literal("refund")
                            .executes(context -> {
                                if (gachaManager != null) {
                                    String uuid = StringArgumentType.getString(context, "uuid");
                                    gachaManager.handleClearGachaOffline(
                                        context.getSource().getPlayer(),
                                        uuid,
                                        true // with refund
                                    );
                                }
                                return 1;
                            })
                        )
                    )
            );
            
            // Casino commands: /casino deposit|withdraw|balance
            dispatcher.register(
                CommandManager.literal("casino")
                    .executes(context -> {
                        // Show balance by default
                        if (gachaManager != null) {
                            gachaManager.handleCasinoBalance(context.getSource().getPlayer());
                        }
                        return 1;
                    })
                    .then(CommandManager.literal("deposit")
                        .then(CommandManager.argument("amount", com.mojang.brigadier.arguments.IntegerArgumentType.integer(1))
                            .executes(context -> {
                                if (gachaManager != null) {
                                    int amount = com.mojang.brigadier.arguments.IntegerArgumentType.getInteger(context, "amount");
                                    gachaManager.handleCasinoDeposit(context.getSource().getPlayer(), amount);
                                }
                                return 1;
                            })
                        )
                    )
                    .then(CommandManager.literal("withdraw")
                        .then(CommandManager.argument("amount", com.mojang.brigadier.arguments.IntegerArgumentType.integer(1))
                            .executes(context -> {
                                if (gachaManager != null) {
                                    int amount = com.mojang.brigadier.arguments.IntegerArgumentType.getInteger(context, "amount");
                                    gachaManager.handleCasinoWithdraw(context.getSource().getPlayer(), amount);
                                }
                                return 1;
                            })
                        )
                    )
                    .then(CommandManager.literal("balance")
                        .executes(context -> {
                            if (gachaManager != null) {
                                gachaManager.handleCasinoBalance(context.getSource().getPlayer());
                            }
                            return 1;
                        })
                    )
            );
            
            // Pitufi commands: /pitufi fusionar <pokemon>
            // Fuses duplicate Pokemon (3+), keeps the BEST one, converts rest to Stardust
            dispatcher.register(
                CommandManager.literal("pitufi")
                    .then(CommandManager.literal("fusionar")
                        .then(CommandManager.argument("pokemon", StringArgumentType.string())
                            .suggests((context, builder) -> {
                                // Autocomplete with Pokemon species that have 3+ duplicates
                                if (gachaManager != null) {
                                    ServerPlayerEntity player = context.getSource().getPlayer();
                                    if (player != null) {
                                        List<String> duplicates = gachaManager.getDuplicatePokemonSpecies(player);
                                        String input = builder.getRemaining().toLowerCase();
                                        for (String species : duplicates) {
                                            if (species.startsWith(input)) {
                                                builder.suggest(species);
                                            }
                                        }
                                    }
                                }
                                return builder.buildFuture();
                            })
                            .executes(context -> {
                                if (gachaManager != null) {
                                    String pokemon = StringArgumentType.getString(context, "pokemon");
                                    gachaManager.handleFusionCommand(context.getSource().getPlayer(), pokemon);
                                }
                                return 1;
                            })
                        )
                    )
            );
            logger.info("✓ Gacha, Casino & Fusion commands registered");
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

            // Initialize Player Shop (Marketplace) system
            playerShopManager = new PlayerShopManager(httpClient, logger);
            playerShopManager.initialize(server);
            logger.info("✓ Player Shop (Marketplace) system enabled");

            // Initialize tournament system
            tournamentManager = new TournamentManager(httpClient, logger);
            tournamentManager.initialize(server);
            battleListener = new BattleListener(tournamentManager, logger);
            battleListener.initialize(server);
            logger.info("✓ Tournament system enabled");

            // Initialize economy system (rewards for captures, battles, etc.)
            economyManager = new EconomyManager(httpClient, logger);
            economyManager.initialize(server);
            logger.info("✓ Economy system enabled");

            // Initialize gacha system (Pokemon gacha rewards delivery)
            gachaManager = new GachaManager(httpClient, logger);
            gachaManager.initialize(server);
            logger.info("✓ Gacha system enabled");

            // Initialize tutorías system (battle log capture for AI analysis)
            tutoriasManager = new TutoriasManager(httpClient, logger);
            tutoriasManager.initialize(server);
            logger.info("✓ Tutorías system enabled");

            // Initialize admin sync system (bidirectional Pokemon sync + in-game announcements)
            adminSyncManager = new AdminSyncManager(httpClient, logger);
            adminSyncManager.initialize(server);
            logger.info("✓ Admin sync system enabled");

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
        if (adminSyncManager != null)
            adminSyncManager.shutdown();
        if (tutoriasManager != null)
            tutoriasManager.shutdown();
        if (gachaManager != null)
            gachaManager.shutdown();
        if (economyManager != null)
            economyManager.shutdown();
        if (tournamentManager != null)
            tournamentManager.shutdown();
        if (battleListener != null)
            battleListener.shutdown();
        if (playerShopManager != null)
            playerShopManager.shutdown();
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
    
    public PlayerShopManager getPlayerShopManager() {
        return playerShopManager;
    }
    
    public TournamentManager getTournamentManager() {
        return tournamentManager;
    }
    
    public DiscordWebhookManager getDiscordWebhook() {
        return discordWebhook;
    }
    
    public EconomyManager getEconomyManager() {
        return economyManager;
    }
    
    public GachaManager getGachaManager() {
        return gachaManager;
    }
    
    public TutoriasManager getTutoriasManager() {
        return tutoriasManager;
    }
}
