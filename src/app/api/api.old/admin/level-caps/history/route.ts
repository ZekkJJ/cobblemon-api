import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

// GET /api/admin/level-caps/history
export async function GET() {
    try {
        const doc = await db.level_caps.findOne({});

        if (!doc || !doc.changeHistory) {
            return NextResponse.json({
                success: true,
                history: []
            });
        }

        // Return last 50 changes
        const history = (doc.changeHistory || [])
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 50);

        return NextResponse.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Error getting history:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener historial' },
            { status: 500 }
        );
    }
}
