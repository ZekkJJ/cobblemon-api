import { NextRequest, NextResponse } from 'next/server';
import { seedFakeUsers, clearFakeUsers } from '@/lib/seed-data';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'seed') {
            const users = seedFakeUsers();
            return NextResponse.json({
                success: true,
                message: 'Usuarios de prueba creados',
                users,
            });
        }

        if (action === 'clear') {
            clearFakeUsers();
            return NextResponse.json({
                success: true,
                message: 'Usuarios de prueba eliminados',
            });
        }

        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Error en seed' }, { status: 500 });
    }
}
