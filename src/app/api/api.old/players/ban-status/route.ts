import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';

// GET: Check ban status for a player
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
            // Player doesn't exist - not banned
            return NextResponse.json({ 
                banned: false
            });
        }

        return NextResponse.json({ 
            banned: (user as any).banned || false,
            banReason: (user as any).banReason || null,
            bannedAt: (user as any).bannedAt || null
        });
    } catch (error) {
        console.error('[BAN STATUS] Error:', error);
        return NextResponse.json(
            { error: 'Error checking ban status' },
            { status: 500 }
        );
    }
}
