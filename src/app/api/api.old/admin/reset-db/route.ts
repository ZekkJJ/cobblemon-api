import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// SUPER NUCLEAR RESET - Delete EVERYTHING from MongoDB
export async function POST(request: NextRequest) {
    try {
        // Get session
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const discordId = (session.user as any).id || (session.user as any).discordId;

        // HARDCODED ADMIN CHECK
        const HARDCODED_ADMINS = ['478742167557505034'];

        if (!HARDCODED_ADMINS.includes(discordId)) {
            return NextResponse.json(
                { error: 'No autorizado. Requieres permisos de administrador.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { confirmReset } = body;

        if (confirmReset !== 'RESET_ALL_DATA') {
            return NextResponse.json(
                { error: 'Debes confirmar con "RESET_ALL_DATA"' },
                { status: 400 }
            );
        }

        console.log('[RESET] === MONGODB RESET STARTING ===');

        // Delete ALL documents from all collections
        const usersDeleted = await db.users.deleteMany({});
        const startersDeleted = await db.starters.deleteMany({});
        const tournamentsDeleted = await db.tournaments.deleteMany({});

        console.log('[RESET] Deleted:', {
            users: usersDeleted,
            starters: startersDeleted,
            tournaments: tournamentsDeleted
        });

        console.log('[RESET] === RESET COMPLETE ===');

        return NextResponse.json({
            success: true,
            message: 'Base de datos COMPLETAMENTE reseteada',
            deleted: {
                users: usersDeleted,
                starters: startersDeleted,
                tournaments: tournamentsDeleted
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[RESET] CRITICAL ERROR:', error);
        return NextResponse.json(
            { error: 'Error al resetear: ' + error.message },
            { status: 500 }
        );
    }
}
