import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uuid, ballId, quantity } = body;

        if (!uuid || !ballId || !quantity || quantity < 1) {
            return NextResponse.json(
                { error: 'Invalid request data' },
                { status: 400 }
            );
        }

        const stockData = await db.shop_stock.findOne({ id: 'current' });
        if (!stockData || !stockData.stocks[ballId]) {
            return NextResponse.json(
                { error: 'Ball not found in stock' },
                { status: 404 }
            );
        }

        const ballStock = stockData.stocks[ballId];
        
        if (ballStock.stock < quantity) {
            return NextResponse.json(
                { error: `Only ${ballStock.stock} in stock`, available: ballStock.stock },
                { status: 400 }
            );
        }

        const user = await db.users.findOne({ minecraftUuid: uuid });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const totalCost = ballStock.price * quantity;
        const currentBalance = user.cobbleDollarsBalance || 0;

        if (currentBalance < totalCost) {
            return NextResponse.json(
                { 
                    error: 'Insufficient funds', 
                    required: totalCost, 
                    balance: currentBalance 
                },
                { status: 400 }
            );
        }

        ballStock.stock -= quantity;
        await db.shop_stock.updateOne(
            { id: 'current' },
            { [`stocks.${ballId}.stock`]: ballStock.stock }
        );

        const newBalance = currentBalance - totalCost;
        await db.users.updateOne(
            { minecraftUuid: uuid },
            { cobbleDollarsBalance: newBalance }
        );

        const purchases = await db.shop_purchases.findOne({ uuid });
        const pending = purchases?.pending || [];
        
        pending.push({
            ballId,
            quantity,
            purchasedAt: new Date().toISOString(),
            claimed: false
        });

        await db.shop_purchases.upsert(
            { uuid },
            {
                uuid,
                username: user.minecraftUsername || 'Unknown',
                pending
            }
        );

        return NextResponse.json({
            success: true,
            newBalance,
            totalCost,
            quantity,
            ballId,
            message: `Purchased ${quantity}x ${ballId}. Claim in-game with /claimshop`
        });
    } catch (error) {
        console.error('[SHOP PURCHASE] Error:', error);
        return NextResponse.json(
            { error: 'Purchase failed' },
            { status: 500 }
        );
    }
}
