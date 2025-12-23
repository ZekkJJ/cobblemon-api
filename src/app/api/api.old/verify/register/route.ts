import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

// POST: Register a pending verification from Minecraft
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uuid, username, code } = body;

        console.log('[VERIFY REGISTER] Received request:', { uuid, username, code });

        if (!uuid || !username || !code) {
            console.error('[VERIFY REGISTER] Missing fields:', { uuid: !!uuid, username: !!username, code: !!code });
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Store pending verification - use minecraftUuid as primary key
        const users = await db.users.find({});
        const existing = users.find((u: any) => u.minecraftUuid === uuid);

        console.log('[VERIFY REGISTER] Existing user found:', !!existing);

        if (existing) {
            // Update existing user - keep their real discordId if they have one
            const updateQuery = existing.discordId && !existing.discordId.startsWith('mc_')
                ? { minecraftUuid: uuid }
                : { minecraftUuid: uuid };

            console.log('[VERIFY REGISTER] Updating existing user');
            await db.users.updateOne(
                updateQuery as any,
                {
                    minecraftUsername: username,
                    verificationCode: code,
                    verified: false,
                    updatedAt: new Date().toISOString()
                } as any
            );
            console.log('[VERIFY REGISTER] ✓ Updated user with code:', code);
        } else {
            // Create new pending user - use placeholder discordId until verified
            console.log('[VERIFY REGISTER] Creating new user');
            await db.users.insertOne({
                discordId: null, // No Discord ID yet
                discordUsername: '',
                nickname: username,
                starterId: null,
                starterIsShiny: false,
                rolledAt: null,
                isAdmin: false,
                minecraftUuid: uuid,
                minecraftUsername: username,
                verificationCode: code,
                verified: false,
            } as any);
            console.log('[VERIFY REGISTER] ✓ Created new user with code:', code);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Register verification error:', error);
        return NextResponse.json(
            { error: 'Error registering verification' },
            { status: 500 }
        );
    }
}
