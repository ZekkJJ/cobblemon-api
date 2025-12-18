import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import { STARTERS_DATA, getStarterSprites } from '@/lib/starters-data';

// GET: Get all starters with claim status
export async function GET() {
    try {
        // Get claimed starters from KV db
        const claimedStarters = await db.starters.find({ isClaimed: true });
        
        // Get all users to resolve names properly
        const users = await db.users.find({});
        const userMap = new Map(users.map((u: any) => [u.discordId || u.minecraftUuid, u]));

        const claimedMap = new Map(
            claimedStarters.map((s: any) => [s.pokemonId, s])
        );

        // Combine static data with claim info
        const allStarters = STARTERS_DATA.map(starter => {
            const claimed = claimedMap.get(starter.pokemonId);
            const sprites = getStarterSprites(starter.pokemonId, false);
            const shinySprites = getStarterSprites(starter.pokemonId, true);
            
            // Resolve actual user name from users collection
            let displayName = 'Desconocido';
            if (claimed) {
                const user = userMap.get((claimed as any).claimedBy);
                if (user) {
                    displayName = (user as any).minecraftUsername || 
                                 (user as any).nickname || 
                                 (user as any).discordUsername || 
                                 'Desconocido';
                } else {
                    // Fallback to denormalized data
                    displayName = (claimed as any).minecraftUsername || 
                                 (claimed as any).claimedByNickname || 
                                 'Desconocido';
                }
            }

            return {
                ...starter,
                sprites: {
                    normal: sprites,
                    shiny: shinySprites,
                },
                isClaimed: !!claimed,
                claimedBy: displayName,
                claimedAt: (claimed as any)?.claimedAt || null,
                isShiny: (claimed as any)?.starterIsShiny || false,
            };
        });

        // Group by generation
        const byGeneration = allStarters.reduce((acc, starter) => {
            const gen = starter.generation;
            if (!acc[gen]) acc[gen] = [];
            acc[gen].push(starter);
            return acc;
        }, {} as Record<number, typeof allStarters>);

        return NextResponse.json({
            starters: allStarters,
            byGeneration,
            stats: {
                total: STARTERS_DATA.length,
                claimed: claimedStarters.length,
                available: STARTERS_DATA.length - claimedStarters.length,
            },
        });
    } catch (error) {
        console.error('Starters fetch error:', error);

        // Fallback: return static data without claim info
        const allStarters = STARTERS_DATA.map(starter => {
            const sprites = getStarterSprites(starter.pokemonId, false);
            const shinySprites = getStarterSprites(starter.pokemonId, true);

            return {
                ...starter,
                sprites: {
                    normal: sprites,
                    shiny: shinySprites,
                },
                isClaimed: false,
                claimedBy: null,
                claimedAt: null,
                isShiny: false,
            };
        });

        const byGeneration = allStarters.reduce((acc, starter) => {
            const gen = starter.generation;
            if (!acc[gen]) acc[gen] = [];
            acc[gen].push(starter);
            return acc;
        }, {} as Record<number, typeof allStarters>);

        return NextResponse.json({
            starters: allStarters,
            byGeneration,
            stats: {
                total: STARTERS_DATA.length,
                claimed: 0,
                available: STARTERS_DATA.length,
            },
        });
    }
}
