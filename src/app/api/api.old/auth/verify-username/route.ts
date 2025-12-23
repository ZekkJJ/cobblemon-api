import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ALLOWED_SERVER_IDS = (process.env.DISCORD_SERVER_IDS || '').split(',');

interface DiscordMember {
    user: {
        id: string;
        username: string;
        global_name?: string;
        avatar?: string;
    };
    nick?: string;
}

// Check if user exists in Discord servers
async function checkUserInServers(username: string): Promise<DiscordMember | null> {
    if (!DISCORD_BOT_TOKEN) {
        console.error('Discord bot token not configured');
        return null;
    }

    for (const guildId of ALLOWED_SERVER_IDS) {
        if (!guildId.trim()) continue;

        try {
            const response = await fetch(
                `https://discord.com/api/v10/guilds/${guildId.trim()}/members/search?query=${encodeURIComponent(username)}&limit=10`,
                {
                    headers: {
                        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                    },
                }
            );

            if (!response.ok) {
                console.error(`Discord API error for guild ${guildId}:`, response.status);
                continue;
            }

            const members: DiscordMember[] = await response.json();

            // Find exact match
            const exactMatch = members.find(
                (m) =>
                    m.user.username.toLowerCase() === username.toLowerCase() ||
                    m.user.global_name?.toLowerCase() === username.toLowerCase() ||
                    m.nick?.toLowerCase() === username.toLowerCase()
            );

            if (exactMatch) {
                return exactMatch;
            }
        } catch (error) {
            console.error(`Error checking guild ${guildId}:`, error);
        }
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { discordUsername, nickname } = body;

        if (!discordUsername || !nickname) {
            return NextResponse.json(
                { error: 'Se requiere nombre de Discord y apodo' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db.users.findOne({ discordUsername: discordUsername.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({
                success: true,
                user: existingUser,
                message: 'Usuario ya registrado',
            });
        }

        // Check if user is in Discord servers
        const discordMember = await checkUserInServers(discordUsername);

        if (!discordMember) {
            return NextResponse.json(
                {
                    error: 'No se encontró tu usuario en los servidores de Discord. Asegúrate de estar en el servidor.',
                },
                { status: 404 }
            );
        }

        // Create user
        const newUser = await db.users.insertOne({
            discordId: discordMember.user.id,
            discordUsername: discordMember.user.username,
            nickname: nickname.trim(),
            starterId: null,
            starterIsShiny: false,
            rolledAt: null,
            isAdmin: false,
        });

        return NextResponse.json({
            success: true,
            user: newUser,
            message: '¡Usuario verificado y registrado!',
        });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { error: 'Error en la verificación' },
            { status: 500 }
        );
    }
}
