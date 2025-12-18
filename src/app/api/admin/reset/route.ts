import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { confirmToken } = body;

        // Simple security check - you should use a better auth method
        if (confirmToken !== 'RESET_EVERYTHING_NOW') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
        }

        // Delete all blobs
        const { blobs } = await list();
        
        let deletedCount = 0;
        for (const blob of blobs) {
            try {
                await del(blob.url);
                deletedCount++;
            } catch (e) {
                console.error('Error deleting blob:', e);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Database reset complete. Deleted ${deletedCount} blobs.`,
            deletedCount
        });
    } catch (error) {
        console.error('Reset error:', error);
        return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
    }
}
