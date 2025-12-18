import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';

// POST: Generate verification code from Minecraft plugin
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { minecraftUuid, minecraftUsername, code } = body;

        console.log('[VERIFICATION GENERATE] Received:', { minecraftUuid, minecraftUsername, code });

        if (!minecraftUuid || !minecraftUsername || !code) {
            console.error('[VERIFICATION GENERATE] Missing fields');
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find or create user
        const users = await db.users.find({});
        const existing = users.find((u: any) => u.minecraftUuid === minecraftUuid);

        if (existing) {
            // Update existing user with new verification code
            await db.users.updateOne(
                { minecraftUuid } as any,
                {
                    minecraftUsername,
                    verificationCode: code,
                    verified: false,
                    updatedAt: new Date().toISOString()
                } as any
            );
            console.log('[VERIFICATION GENERATE] Updated existing user');
        } else {
            // Create new user
            await db.users.insertOne({
                discordId: null,
                discordUsername: '',
                nickname: minecraftUsername,
                starterId: null,
                starterIsShiny: false,
                rolledAt: null,
                isAdmin: false,
                banned: false,
                minecraftUuid,
                minecraftUsername,
                verificationCode: code,
                verified: false,
                createdAt: new Date().toISOString()
            } as any);
            console.log('[VERIFICATION GENERATE] Created new user');
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[VERIFICATION GENERATE] Error:', error);
        return NextResponse.json(
            { error: 'Error generating verification code' },
            { status: 500 }
        );
    }
}
