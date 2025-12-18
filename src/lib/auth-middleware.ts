import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/mongodb';

/**
 * Centralized admin authentication middleware
 * Checks if user is authenticated and has admin privileges from database
 */
export async function requireAdmin(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json(
            { error: 'No autenticado. Inicia sesión primero.' },
            { status: 401 }
        );
    }

    // Fetch user from database to check admin status
    const user = await db.users.findOne({ discordId: (session.user as any).id });

    if (!user || !user.isAdmin) {
        return NextResponse.json(
            { error: 'No autorizado. Requieres permisos de administrador.' },
            { status: 403 }
        );
    }

    return null; // No error, user is admin
}

/**
 * Helper to get current authenticated user
 */
export async function getCurrentUser(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return null;
    }

    return await db.users.findOne({ discordId: (session.user as any).id });
}
