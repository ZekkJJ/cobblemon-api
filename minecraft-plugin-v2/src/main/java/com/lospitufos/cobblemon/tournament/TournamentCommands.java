package com.lospitufos.cobblemon.tournament;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.arguments.StringArgumentType;
import com.mojang.brigadier.context.CommandContext;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

/**
 * Tournament Commands for Cobblemon Los Pitufos
 * 
 * Commands:
 * - /torneo join [code] - Join a tournament
 * - /torneo leave - Leave current tournament
 * - /torneo info - View tournament info
 * - /torneo help - Show help
 */
public class TournamentCommands {
    
    private final TournamentManager tournamentManager;
    
    public TournamentCommands(TournamentManager tournamentManager) {
        this.tournamentManager = tournamentManager;
    }
    
    public void register(CommandDispatcher<ServerCommandSource> dispatcher) {
        dispatcher.register(
            CommandManager.literal("torneo")
                .then(CommandManager.literal("join")
                    .then(CommandManager.argument("code", StringArgumentType.word())
                        .executes(this::joinTournament)))
                .then(CommandManager.literal("leave")
                    .executes(this::leaveTournament))
                .then(CommandManager.literal("info")
                    .executes(this::showInfo))
                .then(CommandManager.literal("help")
                    .executes(this::showHelp))
                .executes(this::showHelp)
        );
        
        // Alias: /tournament
        dispatcher.register(
            CommandManager.literal("tournament")
                .then(CommandManager.literal("join")
                    .then(CommandManager.argument("code", StringArgumentType.word())
                        .executes(this::joinTournament)))
                .then(CommandManager.literal("leave")
                    .executes(this::leaveTournament))
                .then(CommandManager.literal("info")
                    .executes(this::showInfo))
                .then(CommandManager.literal("help")
                    .executes(this::showHelp))
                .executes(this::showHelp)
        );
    }
    
    private int joinTournament(CommandContext<ServerCommandSource> context) {
        ServerCommandSource source = context.getSource();
        
        if (!source.isExecutedByPlayer()) {
            source.sendMessage(Text.literal("§cEste comando solo puede ser ejecutado por jugadores."));
            return 0;
        }
        
        ServerPlayerEntity player = source.getPlayer();
        String code = StringArgumentType.getString(context, "code");
        
        tournamentManager.handleJoinCommand(player, code);
        return 1;
    }
    
    private int leaveTournament(CommandContext<ServerCommandSource> context) {
        ServerCommandSource source = context.getSource();
        
        if (!source.isExecutedByPlayer()) {
            source.sendMessage(Text.literal("§cEste comando solo puede ser ejecutado por jugadores."));
            return 0;
        }
        
        ServerPlayerEntity player = source.getPlayer();
        tournamentManager.handleLeaveCommand(player);
        return 1;
    }
    
    private int showInfo(CommandContext<ServerCommandSource> context) {
        ServerCommandSource source = context.getSource();
        
        if (!source.isExecutedByPlayer()) {
            source.sendMessage(Text.literal("§cEste comando solo puede ser ejecutado por jugadores."));
            return 0;
        }
        
        ServerPlayerEntity player = source.getPlayer();
        tournamentManager.handleInfoCommand(player);
        return 1;
    }
    
    private int showHelp(CommandContext<ServerCommandSource> context) {
        ServerCommandSource source = context.getSource();
        
        source.sendMessage(Text.literal(""));
        source.sendMessage(Text.literal("§6§l═══ COMANDOS DE TORNEO ═══"));
        source.sendMessage(Text.literal(""));
        source.sendMessage(Text.literal("§e/torneo join [código] §7- Inscribirse en un torneo"));
        source.sendMessage(Text.literal("§e/torneo leave §7- Abandonar el torneo actual"));
        source.sendMessage(Text.literal("§e/torneo info §7- Ver información del torneo"));
        source.sendMessage(Text.literal("§e/torneo help §7- Mostrar esta ayuda"));
        source.sendMessage(Text.literal(""));
        source.sendMessage(Text.literal("§7Obtén el código del torneo en la web:"));
        source.sendMessage(Text.literal("§bcobblemon-los-pitufos.vercel.app/torneos"));
        source.sendMessage(Text.literal("§6§l═══════════════════════════"));
        source.sendMessage(Text.literal(""));
        
        return 1;
    }
}
