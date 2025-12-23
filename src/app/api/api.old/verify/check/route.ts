import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

// GET: Check if a verification code has been validated
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json(
                { error: 'Code is required' },
                { status: 400 }
            );
        }

        // Find user with this code OR who had this code before (for verified users)
        const users = await db.users.find({});
        const user = users.find((u: any) => 
            u.verificationCode === code || 
            (u.verified && u.lastVerificationCode === code)
        );

        if (!user) {
            return NextResponse.json({ verified: false, error: 'Code not found' });
        }

        return NextResponse.json({
            verified: (user as any).verified === true,
            discordLinked: !!(user as any).discordId,
        });
    } catch (error) {
        console.error('Check verification error:', error);
        return NextResponse.json(
            { verified: false, error: 'Error checking verification' },
            { status: 500 }
        );
    }
}

// POST: Submit verification code from website
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, discordId, discordUsername } = body;

        if (!code || !discordId) {
            return NextResponse.json(
                { error: 'Código y Discord ID requeridos' },
                { status: 400 }
            );
        }

        // Find user with this code (Minecraft user)
        const users = await db.users.find({});
        const minecraftUser = users.find((u: any) => u.verificationCode === code);

        if (!minecraftUser) {
            return NextResponse.json(
                { error: 'Código no válido. Asegúrate de escribirlo correctamente.' },
                { status: 404 }
            );
        }

        // Check if this Discord ID already has a user (from web login/gacha)
        const existingDiscordUser = users.find((u: any) =>
            u.discordId === discordId && u.minecraftUuid !== (minecraftUser as any).minecraftUuid
        );

        if (existingDiscordUser) {
            // MERGE: Discord user already exists with potential starter data
            // Update the Minecraft user record with Discord data + merge starter
            await db.users.updateOne(
                { minecraftUuid: (minecraftUser as any).minecraftUuid } as any,
                {
                    discordId,
                    discordUsername: discordUsername || (existingDiscordUser as any).discordUsername || '',
                    nickname: (existingDiscordUser as any).nickname || (minecraftUser as any).nickname || '',
                    starterId: (existingDiscordUser as any).starterId || null,
                    starterIsShiny: (existingDiscordUser as any).starterIsShiny || false,
                    rolledAt: (existingDiscordUser as any).rolledAt || null,
                    isAdmin: (existingDiscordUser as any).isAdmin || false,
                    verified: true,
                    verifiedAt: new Date().toISOString(),
                    lastVerificationCode: code,
                    verificationCode: undefined,
                } as any
            );

            // Delete the old Discord-only user to prevent duplicates
            await db.users.deleteOne({ discordId: discordId, minecraftUuid: null } as any);

            console.log(`[VERIFY] Merged Discord user ${discordId} into Minecraft user ${(minecraftUser as any).minecraftUuid}`);
        } else {
            // No existing Discord user - simple link
            await db.users.updateOne(
                { minecraftUuid: (minecraftUser as any).minecraftUuid } as any,
                {
                    discordId,
                    discordUsername: discordUsername || '',
                    verified: true,
                    verifiedAt: new Date().toISOString(),
                    lastVerificationCode: code,
                    verificationCode: undefined,
                } as any
            );
        }

        return NextResponse.json({
            success: true,
            message: '¡Verificación exitosa! Ya puedes moverte en el servidor.',
            minecraftUsername: (minecraftUser as any).minecraftUsername,
        });
    } catch (error) {
        console.error('Submit verification error:', error);
        return NextResponse.json(
            { error: 'Error al verificar' },
            { status: 500 }
        );
    }
}
