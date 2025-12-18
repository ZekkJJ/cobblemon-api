import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uuid = searchParams.get('uuid');

        if (!uuid) {
            return NextResponse.json(
                { error: 'UUID is required' },
                { status: 400 }
            );
        }

        const user = await db.users.findOne({ minecraftUuid: uuid });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            uuid,
            balance: user.cobbleDollarsBalance || 0,
            username: user.minecraftUsername || 'Unknown'
        });
    } catch (error) {
        console.error('[SHOP BALANCE] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch balance' },
            { status: 500 }
        );
    }
}
