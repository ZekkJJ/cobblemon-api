package com.lospitufos.cobblemon.legendarypool;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.arguments.IntegerArgumentType;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

/**
 * Commands for the Legendary Pool system
 * 
 * /pool - Show pool status
 * /pool contribute <amount> - Contribute to the pool
 * /pool spawn - (Admin) Spawn the legendary when pool is complete
 */
public class LegendaryPoolCommands {
    
    private final LegendaryPoolManager poolManager;
    
    public LegendaryPoolCommands(LegendaryPoolManager poolManager) {
        this.poolManager = poolManager;
    }
    
    /**
     * Register all pool commands
     */
    public void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        // /pool - Show status
        dispatcher.register(
            CommandManager.literal("pool")
                .executes(context -> {
                    ServerPlayerEntity player = context.getSource().getPlayer();
                    if (player != null) {
                        poolManager.showStatus(player);
                    }
                    return 1;
                })
                // /pool status - Same as /pool
                .then(CommandManager.literal("status")
                    .executes(context -> {
                        ServerPlayerEntity player = context.getSource().getPlayer();
                        if (player != null) {
                            poolManager.showStatus(player);
                        }
                        return 1;
                    })
                )
                // /pool contribute <amount>
                .then(CommandManager.literal("contribute")
                    .then(CommandManager.argument("amount", IntegerArgumentType.integer(1000))
                        .executes(context -> {
                            ServerPlayerEntity player = context.getSource().getPlayer();
                            int amount = IntegerArgumentType.getInteger(context, "amount");
                            if (player != null) {
                                poolManager.contribute(player, amount);
                            }
                            return 1;
                        })
                    )
                )
                // /pool inject <amount> - Alias for contribute
                .then(CommandManager.literal("inject")
                    .then(CommandManager.argument("amount", IntegerArgumentType.integer(1000))
                        .executes(context -> {
                            ServerPlayerEntity player = context.getSource().getPlayer();
                            int amount = IntegerArgumentType.getInteger(context, "amount");
                            if (player != null) {
                                poolManager.contribute(player, amount);
                            }
                            return 1;
                        })
                    )
                )
                // /pool spawn - Admin only
                .then(CommandManager.literal("spawn")
                    .requires(source -> source.hasPermissionLevel(2)) // OP level 2+
                    .executes(context -> {
                        ServerPlayerEntity player = context.getSource().getPlayer();
                        if (player != null) {
                            poolManager.spawnLegendary(player);
                        }
                        return 1;
                    })
                )
                // /pool help
                .then(CommandManager.literal("help")
                    .executes(context -> {
                        ServerPlayerEntity player = context.getSource().getPlayer();
                        if (player != null) {
                            showHelp(player);
                        }
                        return 1;
                    })
                )
        );
        
        // Alias: /legendarypool
        dispatcher.register(
            CommandManager.literal("legendarypool")
                .redirect(dispatcher.getRoot().getChild("pool"))
        );
        
        // Alias: /lpool
        dispatcher.register(
            CommandManager.literal("lpool")
                .redirect(dispatcher.getRoot().getChild("pool"))
        );
    }
    
    /**
     * Show help message
     */
    private void showHelp(ServerPlayerEntity player) {
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§6§l=== LEGENDARY POOL - AYUDA ==="));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§e/pool §7- Ver estado del pool actual"));
        player.sendMessage(Text.literal("§e/pool contribute <cantidad> §7- Contribuir al pool"));
        player.sendMessage(Text.literal("§e/pool inject <cantidad> §7- Alias de contribute"));
        player.sendMessage(Text.literal("§e/pool help §7- Mostrar esta ayuda"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§7§oTambién puedes contribuir desde la web en /legendary-pool"));
        player.sendMessage(Text.literal(""));
        player.sendMessage(Text.literal("§6¿Cómo funciona?"));
        player.sendMessage(Text.literal("§71. Los jugadores contribuyen CobbleDollars al pool"));
        player.sendMessage(Text.literal("§72. Cuando se alcanza la meta, aparece un legendario"));
        player.sendMessage(Text.literal("§73. ¡El que lo capture, se lo queda!"));
        player.sendMessage(Text.literal("§74. El TOP contribuidor tiene +25% de catch rate"));
        player.sendMessage(Text.literal(""));
    }
}
