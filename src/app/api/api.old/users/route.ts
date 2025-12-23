import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

// GET: Get all users (for tournament participant selection)
export async function GET(request: NextRequest) {
    try {
        // Get users who have rolled
        const allUsers = await db.users.find({});
        const usersWithStarters = allUsers.filter((u: any) => u.starterId !== null);

        return NextResponse.json({ users: usersWithStarters });
    } catch (error) {
        console.error('Users fetch error:', error);
        return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
    }
}
