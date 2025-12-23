import { NextResponse } from 'next/server';
import { PlayerProfile } from '@/lib/types/pokemon';
import { db } from '@/lib/mongodb';

export async function GET(
    request: Request,
    { params }: { params: { uuid: string } }
) {
    try {
        const { uuid } = params;

        // Find user by minecraftUuid OR discordId
        const users = await db.users.find({});
        const user = users.find((u: any) => u.minecraftUuid === uuid || u.discordId === uuid);

        if (!user) {
            return NextResponse.json(
                { error: 'Jugador no encontrado' },
                { status: 404 }
            );
        }

        const pokemonParty = (user as any).pokemonParty || [];

        const profile: PlayerProfile = {
            uuid: (user as any).minecraftUuid || (user as any).discordId || uuid,
            username: (user as any).minecraftUsername || (user as any).nickname || (user as any).discordUsername || 'Desconocido',
            lastSync: (user as any).syncedAt || (user as any).minecraftLastSeen || new Date().toISOString(),
            party: pokemonParty,
            pc: [],
            stats: {
                totalPokemon: pokemonParty.length,
                uniqueSpecies: new Set(pokemonParty.map((p: any) => p.speciesId)).size,
                shinies: pokemonParty.filter((p: any) => p.shiny).length,
                avgLevel: pokemonParty.length > 0
                    ? Math.round(pokemonParty.reduce((sum: number, p: any) => sum + (p.level || 0), 0) / pokemonParty.length)
                    : 0,
                strongestPokemon: pokemonParty.sort((a: any, b: any) => (b.level || 0) - (a.level || 0))[0] || null,
            },
        };

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Get player profile error:', error);
        return NextResponse.json(
            { error: 'Error al obtener perfil del jugador' },
            { status: 500 }
        );
    }
}
