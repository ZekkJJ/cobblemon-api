import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth-middleware';

// GET specific tournament by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const tournament = await db.tournaments.findOne({ _id: params.id });
        if (!tournament) {
            return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
        }
        return NextResponse.json(tournament);
    } catch (error) {
        console.error('Get tournament error:', error);
        return NextResponse.json({ error: 'Error al obtener torneo' }, { status: 500 });
    }
}

// PUT - Update tournament
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const body = await request.json();
        const success = await db.tournaments.updateOne({ _id: params.id }, body);

        if (!success) {
            return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update tournament error:', error);
        return NextResponse.json({ error: 'Error al actualizar torneo' }, { status: 500 });
    }
}

// DELETE tournament
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Check admin authentication
        const authError = await requireAdmin(request);
        if (authError) return authError;

        const success = await db.tournaments.deleteOne({ _id: params.id });
        if (!success) {
            return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete tournament error:', error);
        return NextResponse.json({ error: 'Error al eliminar torneo' }, { status: 500 });
    }
}
