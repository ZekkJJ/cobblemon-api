import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/auth-middleware';

// GET /api/tournaments - List all tournaments
// POST /api/tournaments - Create new tournament (Admin only)
export async function GET() {
    try {
        const tournaments = await db.tournaments.find({});
        // Sort by start date, newest first
        tournaments.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        return NextResponse.json(tournaments);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching tournaments' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Check admin authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const body = await request.json();
        const { title, description, startDate, maxParticipants, prizes } = body;

        if (!title || !startDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate start date is in the future
        const start = new Date(startDate);
        if (start < new Date()) {
            return NextResponse.json(
                { error: 'La fecha de inicio debe ser en el futuro' },
                { status: 400 }
            );
        }

        const session = await getServerSession(authOptions);
        const newTournament = await db.tournaments.insertOne({
            title,
            description: description || '',
            startDate,
            maxParticipants: maxParticipants || 32,
            prizes: prizes || '',
            status: 'upcoming', // upcoming, active, completed
            participants: [],
            winner: null,
            createdBy: session?.user?.name || 'Admin'
        });

        // Send webhook announcement if requested (could be a separate action)

        return NextResponse.json(newTournament);
    } catch (error) {
        console.error('Create tournament error:', error);
        return NextResponse.json({ error: 'Error creating tournament' }, { status: 500 });
    }
}
