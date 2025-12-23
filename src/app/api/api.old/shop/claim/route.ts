import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uuid, purchaseId } = body;

        if (!uuid || !purchaseId) {
            return NextResponse.json(
                { error: 'UUID and purchaseId are required' },
                { status: 400 }
            );
        }

        const purchaseData = await db.shop_purchases.findOne({ uuid });

        if (!purchaseData) {
            return NextResponse.json(
                { error: 'No purchases found for this player' },
                { status: 404 }
            );
        }

        const updatedPending = purchaseData.pending.map((p: any) => {
            if (p._id && p._id.toString() === purchaseId) {
                return { ...p, claimed: true, claimedAt: new Date().toISOString() };
            }
            if (p.purchasedAt === purchaseId) {
                return { ...p, claimed: true, claimedAt: new Date().toISOString() };
            }
            return p;
        });

        await db.shop_purchases.updateOne(
            { uuid },
            { pending: updatedPending }
        );

        return NextResponse.json({
            success: true,
            message: 'Purchase marked as claimed'
        });
    } catch (error) {
        console.error('[SHOP CLAIM] Error:', error);
        return NextResponse.json(
            { error: 'Failed to claim purchase' },
            { status: 500 }
        );
    }
}
