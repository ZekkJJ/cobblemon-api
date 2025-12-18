import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

// GET user data by minecraftUuid for the mod
export async function GET(request: NextRequest, { params }: { params: { uuid: string } }) {
    try {
        const { uuid } = params;

        console.log('[API] Fetching user data for UUID:', uuid);

        const users = await db.users.find({});
        const user = users.find((u: any) => u.minecraftUuid === uuid);

        if (!user) {
            console.log('[API] User not found for UUID:', uuid);
            return NextResponse.json({
                error: 'User not found',
                starterId: null,
                starterIsShiny: false
            }, { status: 404 });
        }

        console.log('[API] User found:', {
            uuid: (user as any).minecraftUuid,
            starterId: (user as any).starterId,
            starterIsShiny: (user as any).starterIsShiny
        });

        // Return user data including starter info
        return NextResponse.json({
            minecraftUuid: (user as any).minecraftUuid,
            minecraftUsername: (user as any).minecraftUsername,
            discordId: (user as any).discordId,
            discordUsername: (user as any).discordUsername,
            nickname: (user as any).nickname,
            starterId: (user as any).starterId,
            starterIsShiny: (user as any).starterIsShiny || false,
            rolledAt: (user as any).rolledAt,
            verified: (user as any).verified || false
        });
    } catch (error) {
        console.error('[API] Error fetching user:', error);
        return NextResponse.json({
            error: 'Error fetching user data',
            starterId: null,
            starterIsShiny: false
        }, { status: 500 });
    }
}
