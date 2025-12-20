import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Uses request.url

// GET: Check verification status for a player
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
            // Player doesn't exist yet - not verified
            return NextResponse.json({
                verified: false,
                exists: false
            });
        }

        return NextResponse.json({
            verified: (user as any).verified === true,
            exists: true,
            discordLinked: !!(user as any).discordId,
            banned: (user as any).banned || false
        });
    } catch (error) {
        console.error('[VERIFICATION STATUS] Error:', error);
        return NextResponse.json(
            { error: 'Error checking verification status' },
            { status: 500 }
        );
    }
}
