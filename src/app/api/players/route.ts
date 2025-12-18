import { NextResponse } from 'next/server';
import { PlayerSummary } from '@/lib/types/pokemon';
import { db } from '@/lib/mongodb';
import { STARTERS_DATA } from '@/lib/starters-data';

export async function GET() {
    try {
        const users = await db.users.find({});
        const relevantPlayers = users.filter((u: any) => u.minecraftUuid || u.starterId);

        // Transform to summary format
        const summaries: PlayerSummary[] = relevantPlayers.map((u: any) => {
            let starterInfo = null;
            if (u.starterId) {
                const starterData = STARTERS_DATA.find(s => s.pokemonId === u.starterId);
                if (starterData) {
                    starterInfo = {
                        id: u.starterId,
                        name: starterData.nameEs || starterData.name,
                        isShiny: u.starterIsShiny || false
                    };
                }
            }

            return {
                uuid: u.minecraftUuid || u.discordId || 'unknown',
                username: u.minecraftUsername || u.nickname || u.discordUsername || 'Desconocido',
                totalPokemon: (u.pokemonParty?.length || 0),
                shinies: (u.pokemonParty || []).filter((p: any) => p.shiny).length,
                partyPreview: (u.pokemonParty || []).slice(0, 6).map((poke: any) => ({
                    species: poke.species || poke.name || 'Unknown',
                    speciesId: poke.speciesId || poke.pokemonId || 0,
                    level: poke.level || 5,
                    shiny: poke.shiny || false,
                })),
                starter: starterInfo,
                lastSync: u.syncedAt || u.minecraftLastSeen || new Date().toISOString(),
            };
        });

        return NextResponse.json({
            players: summaries,
            count: summaries.length,
            source: 'vercel-kv'
        });
    } catch (error) {
        console.error('Players fetch error:', error);
        return NextResponse.json({
            players: [],
            count: 0,
            source: 'error'
        });
    }
}
