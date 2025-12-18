import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';

// Rate limiting to prevent server lag - max 1 request per UUID per 10 seconds
const syncTimestamps = new Map<string, number>();
const RATE_LIMIT_MS = 10000; // 10 seconds

// POST: Sync player data from Minecraft server
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('[PLAYER SYNC] Received:', { uuid: body.uuid, username: body.username, keys: Object.keys(body) });

        const { uuid, username, online, lastSeen, verified, party, pcStorage, cobbleDollarsBalance, inventory, enderChest } = body;

        if (!uuid || !username) {
            return NextResponse.json(
                { error: 'UUID and username required' },
                { status: 400 }
            );
        }

        // Rate limiting check
        const now = Date.now();
        const lastSync = syncTimestamps.get(uuid) || 0;
        if (now - lastSync < RATE_LIMIT_MS) {
            console.log(`[PLAYER SYNC] Rate limited: ${username} (${uuid})`);
            return NextResponse.json({ success: true, rateLimited: true });
        }
        syncTimestamps.set(uuid, now);

        // Find or update player by minecraftUuid (primary key)
        const existing = await db.users.findOne({ minecraftUuid: uuid });

        if (existing) {
            // Update by minecraftUuid to avoid issues with changing discordId
            await db.users.updateOne(
                { minecraftUuid: uuid } as any,
                {
                    minecraftUsername: username,
                    nickname: username,
                    minecraftOnline: online || false,
                    minecraftLastSeen: lastSeen || new Date().toISOString(),
                    pokemonParty: party || [],
                    pcStorage: pcStorage || [],
                    cobbleDollarsBalance: cobbleDollarsBalance || 0,
                    inventory: inventory || [],
                    enderChest: enderChest || [],
                    syncedAt: new Date().toISOString(),
                }
            );
            console.log(`[PLAYER SYNC] Updated ${username}: balance=${cobbleDollarsBalance}, party=${party?.length || 0}, pc=${pcStorage?.length || 0}`);
        } else {
            // Create new player entry without Discord linking yet
            await db.users.insertOne({
                discordId: null, // No Discord yet
                discordUsername: '',
                minecraftUuid: uuid,
                minecraftUsername: username,
                nickname: username,
                minecraftOnline: online || false,
                minecraftLastSeen: lastSeen || new Date().toISOString(),
                pokemonParty: party || [],
                pcStorage: pcStorage || [],
                cobbleDollarsBalance: cobbleDollarsBalance || 0,
                inventory: inventory || [],
                enderChest: enderChest || [],
                syncedAt: new Date().toISOString(),
                starterId: null,
                starterIsShiny: false,
                rolledAt: null,
                isAdmin: false,
                banned: false,
                verified: false,
            } as any);
            console.log(`[PLAYER SYNC] Created new player ${username}: balance=${cobbleDollarsBalance}`);
        }

        const isBanned = (existing as any)?.banned || false;
        return NextResponse.json({ success: true, banned: isBanned });
    } catch (error) {
        console.error('Player sync error:', error);
        return NextResponse.json(
            { error: 'Error syncing player data' },
            { status: 500 }
        );
    }
}

// GET: Get all players
export async function GET() {
    try {
        const users = await db.users.find({});
        const players = users.filter((u: any) => u.minecraftUuid);

        return NextResponse.json({ players });
    } catch (error) {
        console.error('Get players error:', error);
        return NextResponse.json({ players: [] });
    }
}
