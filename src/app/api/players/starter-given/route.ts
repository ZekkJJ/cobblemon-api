import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import { STARTERS_DATA } from '@/lib/starters-data';

export const runtime = 'nodejs';

// POST: Mark starter as given
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uuid, pokemonId, given } = body;

        if (!uuid) {
            return NextResponse.json(
                { error: 'UUID is required' },
                { status: 400 }
            );
        }

        // Get user info for the starter claim
        const user = await db.users.findOne({ minecraftUuid: uuid });
        
        if (!user) {
            console.error('[STARTER GIVEN] User not found for UUID:', uuid);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Update user's starter status
        await db.users.updateOne(
            { minecraftUuid: uuid } as any,
            {
                starterGiven: given !== false, // Default to true
                starterGivenAt: new Date().toISOString()
            } as any
        );

        // If this is marking as given and we have a pokemonId, update starters collection
        if (given !== false && pokemonId) {
            const starterInfo = STARTERS_DATA.find(s => s.pokemonId === pokemonId);
            const nickname = (user as any).minecraftUsername || 
                           (user as any).nickname || 
                           (user as any).discordUsername || 
                           'Desconocido';
            
            await db.starters.upsert(
                { pokemonId },
                {
                    pokemonId,
                    name: starterInfo?.name || 'Unknown',
                    isClaimed: true,
                    claimedBy: (user as any).discordId || uuid,
                    claimedByNickname: nickname,
                    minecraftUsername: (user as any).minecraftUsername,
                    claimedAt: new Date().toISOString(),
                    starterIsShiny: (user as any).starterIsShiny || false,
                }
            );
            
            console.log('[STARTER GIVEN] Registered starter claim:', { uuid, pokemonId, nickname });
        }

        console.log('[STARTER GIVEN] Marked starter as given for', uuid);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[STARTER GIVEN] Error:', error);
        return NextResponse.json(
            { error: 'Error marking starter as given' },
            { status: 500 }
        );
    }
}
