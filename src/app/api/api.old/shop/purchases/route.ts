import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uuid = searchParams.get('uuid');

        if (!uuid) {
            return NextResponse.json(
                { error: 'UUID is required' },
                { status: 400 }
            );
        }

        const purchaseData = await db.shop_purchases.findOne({ uuid });

        if (!purchaseData || !purchaseData.pending || purchaseData.pending.length === 0) {
            return NextResponse.json({
                uuid,
                purchases: []
            });
        }

        const unclaimedPurchases = purchaseData.pending.filter((p: any) => !p.claimed);

        return NextResponse.json({
            uuid,
            purchases: unclaimedPurchases
        });
    } catch (error) {
        console.error('[SHOP PURCHASES] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch purchases' },
            { status: 500 }
        );
    }
}
