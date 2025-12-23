import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import { STARTERS_DATA, getStarterSprites } from '@/lib/starters-data';
import { sendStarterWebhook } from '@/lib/discord-webhook';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { discordId, discordUsername, answers } = body;

        if (!discordId) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        if (!answers || answers.length !== 6) {
            return NextResponse.json({ error: 'Debes responder todas las preguntas' }, { status: 400 });
        }

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

        if (!user) {
            return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
        }

        if (user.starterId !== null) {
            return NextResponse.json(
                { error: '¡Ya has hecho tu tirada!', alreadyRolled: true },
                { status: 400 }
            );
        }

        const claimedStarters = await db.starters.find({ isClaimed: true });
        const claimedIds = new Set(claimedStarters.map((s: any) => s.pokemonId));
        const availableStarters = STARTERS_DATA.filter(s => !claimedIds.has(s.pokemonId));

        if (availableStarters.length === 0) {
            return NextResponse.json(
                { error: 'No hay starters disponibles' },
                { status: 400 }
            );
        }

        const availablePokemonList = availableStarters.map(p => 
            `${p.name} (${p.types.join('/')}) - ${p.description}`
        ).join('\n');

        const questionsAndAnswers = [
            { question: '¿Cuál es tu estilo de combate preferido?', answer: answers[0] },
            { question: '¿Qué ambiente te gusta más?', answer: answers[1] },
            { question: '¿Cómo describirías tu personalidad?', answer: answers[2] },
            { question: '¿Qué valoras más en un compañero?', answer: answers[3] },
            { question: 'Describe tu mayor fortaleza:', answer: answers[4] },
            { question: '¿Cuál es tu mayor sueño o meta?', answer: answers[5] }
        ].map((qa, i) => `${i + 1}. ${qa.question}\n   Respuesta: ${qa.answer}`).join('\n\n');

        const prompt = `Eres un psicólogo especializado en análisis de personalidad. Analiza el siguiente perfil:

${questionsAndAnswers}

Basándote en esta información, identifica los 5 rasgos de personalidad más dominantes de esta persona.

Para cada rasgo, relaciona qué criatura de esta lista sería más compatible con ese aspecto de su personalidad:

${availablePokemonList}

Responde ÚNICAMENTE en el formato exacto:
1. [Nombre del Pokemon]
2. [Nombre del Pokemon]
3. [Nombre del Pokemon]
4. [Nombre del Pokemon]
5. [Nombre del Pokemon]

Sin explicaciones, solo nombres. Usa SOLO los Pokémon listados arriba.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 150,
        });

        const aiResponse = completion.choices[0]?.message?.content?.trim() || '';
        console.log('AI Response:', aiResponse);
        
        const lines = aiResponse.split('\n').filter(l => l.trim());
        const suggestedPokemon: any[] = [];
        
        for (const line of lines) {
            const match = line.match(/^\d+\.\s*(.+)$/);
            if (match) {
                const pokemonName = match[1].trim();
                const found = availableStarters.find(s => 
                    s.name.toLowerCase() === pokemonName.toLowerCase() ||
                    pokemonName.toLowerCase().includes(s.name.toLowerCase())
                );
                if (found && !suggestedPokemon.includes(found)) {
                    suggestedPokemon.push(found);
                }
            }
        }

        if (suggestedPokemon.length === 0) {
            console.error('AI did not suggest any valid Pokemon, falling back to random');
            const fallbackIndex = Math.floor(Math.random() * availableStarters.length);
            return await processPokemonSelection(availableStarters[fallbackIndex], user, discordId, discordUsername);
        }

        const weights = [0.40, 0.25, 0.20, 0.10, 0.05];
        const random = Math.random();
        let cumulativeWeight = 0;
        let selectedIndex = 0;

        for (let i = 0; i < Math.min(suggestedPokemon.length, weights.length); i++) {
            cumulativeWeight += weights[i];
            if (random < cumulativeWeight) {
                selectedIndex = i;
                break;
            }
        }

        const selectedStarter = suggestedPokemon[selectedIndex];
        console.log('AI suggested:', suggestedPokemon.map(p => p.name).join(', '));
        console.log('Selected (weighted random):', selectedStarter.name);

        return await processPokemonSelection(selectedStarter, user, discordId, discordUsername);
    } catch (error) {
        console.error('Soul Driven roll error:', error);
        return NextResponse.json({ error: 'Error en la tirada Soul Driven' }, { status: 500 });
    }
}

async function processPokemonSelection(selectedStarter: any, user: any, discordId: string, discordUsername?: string) {
    const isShiny = Math.random() < 0.01;

    let userUpdated = false;
    let starterClaimed = false;

    try {
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

        await db.starters.upsert(
            { pokemonId: selectedStarter.pokemonId },
            {
                pokemonId: selectedStarter.pokemonId,
                name: selectedStarter.name,
                isClaimed: true,
                claimedBy: discordId,
                claimedByNickname: discordUsername || user.nickname || user.discordUsername || 'Unknown',
                claimedAt: new Date().toISOString(),
                starterIsShiny: isShiny,
            }
        );
        starterClaimed = true;

    } catch (error) {
        console.error('Gacha transaction failed:', error);

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

    const sprites = getStarterSprites(selectedStarter.pokemonId, isShiny);

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
            ? '🌟 ¡INCREÍBLE! ¡Tu alma ha atraído un SHINY!'
            : `¡Tu alma resuena con ${selectedStarter.name}!`,
    });
}
