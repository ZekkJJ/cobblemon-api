import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import { STARTERS_DATA, getStarterSprites } from '@/lib/starters-data';
import { sendStarterWebhook } from '@/lib/discord-webhook';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const discordId = searchParams.get('discordId');

        // Check user status
        if (discordId) {
            const user = await db.users.findOne({ discordId });
            const claimedStarters = await db.starters.find({ isClaimed: true });

            if (user && user.starterId) {
                // User already rolled
                const starterData = STARTERS_DATA.find(s => s.pokemonId === user.starterId);
                if (starterData) {
                    const sprites = getStarterSprites(starterData.pokemonId, user.starterIsShiny);
                    return NextResponse.json({
                        canRoll: false,
                        reason: 'already_rolled',
                        nickname: user.nickname,
                        starter: {
                            ...starterData,
                            isShiny: user.starterIsShiny,
                            sprites,
                        },
                        totalStarters: STARTERS_DATA.length,
                        availableCount: STARTERS_DATA.length - claimedStarters.length,
                    });
                }
            }

            return NextResponse.json({
                canRoll: true,
                nickname: user?.nickname || '',
                totalStarters: STARTERS_DATA.length,
                availableCount: STARTERS_DATA.length - claimedStarters.length,
            });
        }

        return NextResponse.json({ error: 'No discordId provided' }, { status: 400 });
    } catch (error) {
        console.error('Roll GET error:', error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { discordId, discordUsername } = body;

        if (!discordId) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Find or create user
        let user = await db.users.findOne({ discordId });

        if (!user) {
            user = await db.users.insertOne({
                discordId,
                discordUsername: discordUsername || 'Unknown',
                nickname: discordUsername || '',
                starterId: null,
                starterIsShiny: false,
                rolledAt: null,
                isAdmin: false,
            });
        }

        // At this point user is guaranteed to exist
        if (!user) {
            return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
        }

        // Check if already rolled
        if (user.starterId !== null) {
            return NextResponse.json(
                { error: '¡Ya has hecho tu tirada!', alreadyRolled: true },
                { status: 400 }
            );
        }

        // Get available starters
        const claimedStarters = await db.starters.find({ isClaimed: true });
        const claimedIds = new Set(claimedStarters.map((s: any) => s.pokemonId));
        const availableStarters = STARTERS_DATA.filter(s => !claimedIds.has(s.pokemonId));

        if (availableStarters.length === 0) {
            return NextResponse.json(
                { error: 'No hay starters disponibles' },
                { status: 400 }
            );
        }

        // Random selection
        const randomIndex = Math.floor(Math.random() * availableStarters.length);
        const selectedStarter = availableStarters[randomIndex];

        // 1% shiny chance
        const isShiny = Math.random() < 0.01;

        // CRITICAL: Use try-catch with rollback to prevent starter loss
        let userUpdated = false;
        let starterClaimed = false;

        try {
            // Step 1: Update user first
            const updateSuccess = await db.users.updateOne(
                { discordId },
                {
                    starterId: selectedStarter.pokemonId,
                    starterIsShiny: isShiny,
                    rolledAt: new Date().toISOString(),
                }
            );

            if (!updateSuccess) {
                throw new Error('Failed to update user record');
            }
            userUpdated = true;

            // Step 2: Mark starter as claimed (only if user update succeeded)
            const nickname = discordUsername || 
                           (user as any).nickname || 
                           (user as any).minecraftUsername || 
                           (user as any).discordUsername || 
                           'Desconocido';
            
            await db.starters.upsert(
                { pokemonId: selectedStarter.pokemonId },
                {
                    pokemonId: selectedStarter.pokemonId,
                    name: selectedStarter.name,
                    isClaimed: true,
                    claimedBy: discordId,
                    claimedByNickname: nickname,
                    minecraftUsername: (user as any).minecraftUsername,
                    claimedAt: new Date().toISOString(),
                    starterIsShiny: isShiny,
                }
            );
            starterClaimed = true;

        } catch (error) {
            console.error('Gacha transaction failed:', error);

            // ROLLBACK: If user was updated but starter claim failed
            if (userUpdated && !starterClaimed) {
                try {
                    await db.users.updateOne(
                        { discordId },
                        {
                            starterId: null,
                            starterIsShiny: false,
                            rolledAt: null,
                        }
                    );
                    console.log('Rollback successful: user data reverted');
                } catch (rollbackError) {
                    console.error('CRITICAL: Rollback failed!', rollbackError);
                }
            }

            // ROLLBACK: If starter was claimed but shouldn't be
            if (starterClaimed && !userUpdated) {
                try {
                    await db.starters.updateOne(
                        { pokemonId: selectedStarter.pokemonId },
                        {
                            isClaimed: false,
                            claimedBy: undefined,
                            claimedByNickname: undefined,
                            claimedAt: undefined
                        }
                    );
                    console.log('Rollback successful: starter unclaimed');
                } catch (rollbackError) {
                    console.error('CRITICAL: Rollback failed!', rollbackError);
                }
            }

            return NextResponse.json(
                { error: 'Error durante la tirada. Por favor intenta de nuevo.' },
                { status: 500 }
            );
        }

        // Get sprites
        const sprites = getStarterSprites(selectedStarter.pokemonId, isShiny);

        // Send Discord webhook notification (non-blocking, errors logged but don't affect response)
        try {
            await sendStarterWebhook(discordId, user.nickname || user.discordUsername || 'Trainer', {
                ...selectedStarter,
                isShiny,
                sprites,
            });
        } catch (webhookError) {
            console.error('Webhook error (non-blocking):', webhookError);
        }

        return NextResponse.json({
            success: true,
            starter: {
                ...selectedStarter,
                isShiny,
                sprites,
            },
            message: isShiny
                ? '🌟 ¡INCREÍBLE! ¡Has obtenido un SHINY!'
                : `¡Felicidades! Has obtenido a ${selectedStarter.name}!`,
        });
    } catch (error) {
        console.error('Roll POST error:', error);
        return NextResponse.json({ error: 'Error en la tirada' }, { status: 500 });
    }
}
