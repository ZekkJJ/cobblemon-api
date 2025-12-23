import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

// Helper: Generate bracket structure
function generateBracket(participantIds: string[], settings: { allowByes: boolean }) {
    const count = participantIds.length;
    if (count < 2) return { rounds: [], error: 'Need at least 2 participants' };

    // Find next power of 2
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(count)));
    const byesNeeded = nextPow2 - count;

    // Shuffle participants
    const shuffled = [...participantIds].sort(() => Math.random() - 0.5);

    // Calculate rounds needed
    const totalRounds = Math.ceil(Math.log2(nextPow2));
    const rounds: any[] = [];

    // Generate first round with byes
    const firstRoundMatches: any[] = [];
    let pIdx = 0;

    for (let i = 0; i < nextPow2 / 2; i++) {
        const matchId = `r1-m${i}`;
        const player1 = shuffled[pIdx++] || null;
        const player2 = shuffled[pIdx++] || null;
        const isBye = !player1 || !player2;

        firstRoundMatches.push({
            matchId,
            position: { x: 50, y: 100 + i * 150 },
            player1Id: player1,
            player2Id: player2,
            player1Score: 0,
            player2Score: 0,
            winnerId: isBye ? (player1 || player2) : null,
            isBye,
            status: isBye ? 'completed' : 'pending',
            nextMatchId: `r2-m${Math.floor(i / 2)}`,
        });
    }

    rounds.push({
        roundNumber: 1,
        name: totalRounds === 1 ? 'Final' : totalRounds === 2 ? 'Semifinal' : `Ronda 1`,
        matches: firstRoundMatches,
    });

    // Generate subsequent rounds
    for (let r = 2; r <= totalRounds; r++) {
        const prevRound = rounds[r - 2];
        const matchCount = prevRound.matches.length / 2;
        const matches: any[] = [];

        for (let i = 0; i < matchCount; i++) {
            const matchId = `r${r}-m${i}`;
            matches.push({
                matchId,
                position: { x: 50 + (r - 1) * 300, y: 175 + i * 300 },
                player1Id: null,
                player2Id: null,
                player1Score: 0,
                player2Score: 0,
                winnerId: null,
                isBye: false,
                status: 'pending',
                nextMatchId: r < totalRounds ? `r${r + 1}-m${Math.floor(i / 2)}` : null,
            });
        }

        let roundName = 'Ronda ' + r;
        if (r === totalRounds) roundName = 'Final';
        else if (r === totalRounds - 1) roundName = 'Semifinal';
        else if (r === totalRounds - 2) roundName = 'Cuartos';

        rounds.push({
            roundNumber: r,
            name: roundName,
            matches,
        });
    }

    return { rounds };
}

// GET: List tournaments
export async function GET(request: NextRequest) {
    try {
        const tournaments = await db.tournaments.find({});
        return NextResponse.json({ tournaments });
    } catch (error) {
        console.error('Tournament list error:', error);
        return NextResponse.json({ error: 'Error al obtener torneos' }, { status: 500 });
    }
}

// POST: Create tournament
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, participantIds, bracketType = 'single', creatorId } = body;

        if (!name || !participantIds || participantIds.length < 2) {
            return NextResponse.json(
                { error: 'Se necesita nombre y al menos 2 participantes' },
                { status: 400 }
            );
        }

        // Generate bracket
        const { rounds, error } = generateBracket(participantIds, { allowByes: true });
        if (error) {
            return NextResponse.json({ error }, { status: 400 });
        }

        const tournament = await db.tournaments.insertOne({
            name,
            createdBy: creatorId || 'unknown',
            status: 'draft',
            participants: participantIds.map((id: string, i: number) => ({
                visitorId: id,
                seed: i + 1,
                eliminated: false,
            })),
            rounds,
            bracketType,
        });

        return NextResponse.json({
            success: true,
            tournamentId: (tournament as any)._id,
            tournament,
        });
    } catch (error) {
        console.error('Tournament create error:', error);
        return NextResponse.json({ error: 'Error al crear torneo' }, { status: 500 });
    }
}

// PATCH: Update tournament
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { tournamentId, action, data } = body;

        if (!tournamentId) {
            return NextResponse.json({ error: 'ID de torneo requerido' }, { status: 400 });
        }

        const tournament = await db.tournaments.findOne({ _id: tournamentId });

        if (!tournament) {
            return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
        }

        let updateData: any = {};

        switch (action) {
            case 'updateMatchPosition':
                const { matchId, position } = data;
                updateData = {
                    rounds: (tournament as any).rounds.map((round: any) => ({
                        ...round,
                        matches: round.matches.map((match: any) =>
                            match.matchId === matchId ? { ...match, position } : match
                        ),
                    })),
                };
                break;

            case 'setMatchResult':
                const { matchId: mId, winnerId, player1Score, player2Score } = data;
                updateData = {
                    rounds: (tournament as any).rounds.map((round: any) => ({
                        ...round,
                        matches: round.matches.map((match: any) => {
                            if (match.matchId === mId) {
                                return {
                                    ...match,
                                    winnerId,
                                    player1Score,
                                    player2Score,
                                    status: 'completed',
                                };
                            }
                            // Update next match with winner
                            const completedMatch = (tournament as any).rounds
                                .flatMap((r: any) => r.matches)
                                .find((m: any) => m.matchId === mId);
                            if (completedMatch && match.matchId === completedMatch.nextMatchId) {
                                if (!match.player1Id) {
                                    return { ...match, player1Id: winnerId };
                                } else if (!match.player2Id) {
                                    return { ...match, player2Id: winnerId };
                                }
                            }
                            return match;
                        }),
                    })),
                };
                break;

            case 'updateStatus':
                updateData = { status: data.status };
                break;

            case 'setWinner':
                updateData = { winnerId: data.winnerId, status: 'completed' };
                break;

            default:
                return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }

        await db.tournaments.updateOne({ _id: tournamentId }, updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Tournament update error:', error);
        return NextResponse.json({ error: 'Error al actualizar torneo' }, { status: 500 });
    }
}
