import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';

// GET: Check if player has pending starter
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uuid = searchParams.get('uuid');

        if (!uuid) {
            return NextResponse.json({ pending: false }, { status: 400 });
        }

        const user = await db.users.findOne({ minecraftUuid: uuid });

        if (!user || !(user as any).starterId) {
            return NextResponse.json({ pending: false });
        }

        // Check if starter was already given
        if ((user as any).starterGiven) {
            return NextResponse.json({ pending: false });
        }

        return NextResponse.json({
            pending: true,
            pokemonId: (user as any).starterId,
            isShiny: (user as any).starterIsShiny || false
        });
    } catch (error) {
        console.error('[STARTER GET] Error:', error);
        return NextResponse.json({ pending: false });
    }
}
