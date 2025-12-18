import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/mongodb';

const ADMIN_IDS = ["478742167557505034", "687753572095623190"];

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !ADMIN_IDS.includes((session.user as any).id)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { uuid, banned } = body;

        if (!uuid) {
            return NextResponse.json({ error: 'Missing UUID' }, { status: 400 });
        }

        // Find user by UUID
        const users = await db.users.find({});
        const user = users.find((u: any) => u.uuid === uuid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update ban status
        await db.users.updateOne(
            { minecraftUuid: uuid } as any,
            { banned: banned === true } as any
        );

        return NextResponse.json({ success: true, banned: banned === true });
    } catch (error) {
        console.error('Ban error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
