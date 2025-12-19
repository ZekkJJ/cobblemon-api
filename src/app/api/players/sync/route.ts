import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';

// Rate limiting to prevent server lag - max 1 request per UUID per 5 seconds
const syncTimestamps = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 5 seconds (reduced for faster updates)

// POST: Sync player data from Minecraft server
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { uuid, username, online, lastSeen, party, pcStorage, cobbleDollarsBalance, inventory, enderChest } = body;

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
            return NextResponse.json({ success: true, rateLimited: true });
        }
        syncTimestamps.set(uuid, now);

        // Optimized: Only sync essential data, reduce payload size
        const updateData = {
            minecraftUsername: username,
            nickname: username,
            minecraftOnline: online || false,
            minecraftLastSeen: lastSeen || new Date().toISOString(),
            cobbleDollarsBalance: cobbleDollarsBalance || 0,
            syncedAt: new Date().toISOString(),
        };

        // Only include heavy data if it exists
        if (party && party.length > 0) {
            (updateData as any).pokemonParty = party.slice(0, 6); // Max 6 party members
        }
        if (pcStorage && pcStorage.length > 0) {
            (updateData as any).pcStorage = pcStorage.slice(0, 50); // Limit PC storage to 50 Pokemon
        }

        // Find or update player by minecraftUuid (primary key)
        const existing = await db.users.findOne({ minecraftUuid: uuid });

        if (existing) {
            // Update by minecraftUuid
            await db.users.updateOne(
                { minecraftUuid: uuid } as any,
                updateData
            );
        } else {
            // Create new player entry without Discord linking yet
            await db.users.insertOne({
                discordId: null,
                discordUsername: '',
                minecraftUuid: uuid,
                ...updateData,
                pokemonParty: [],
                pcStorage: [],
                inventory: [],
                enderChest: [],
                starterId: null,
                starterIsShiny: false,
                rolledAt: null,
                isAdmin: false,
                banned: false,
                verified: false,
            } as any);
        }

        const isBanned = (existing as any)?.banned || false;
        return NextResponse.json({ success: true, banned: isBanned });
    } catch (error) {
        console.error('[PLAYER SYNC] Error:', error);
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
