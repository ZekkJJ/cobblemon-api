import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import { POKEBALLS, getRandomStock, getPriceWithStock } from '@/lib/pokeballs-data';

export const runtime = 'nodejs';

const STOCK_REFRESH_INTERVAL = 3600000;

async function generateStocks() {
    const stocks: any = {};
    const now = Date.now();

    POKEBALLS.forEach(ball => {
        const stock = getRandomStock(ball);
        const price = getPriceWithStock(ball.basePrice, stock, ball.maxStock);
        
        stocks[ball.id] = {
            ballId: ball.id,
            stock,
            price,
            maxStock: ball.maxStock,
            lastRefresh: now
        };
    });

    return stocks;
}

export async function GET(request: NextRequest) {
    try {
        let stockData = await db.shop_stock.findOne({ id: 'current' });

        if (!stockData || Date.now() - stockData.lastRefresh > STOCK_REFRESH_INTERVAL) {
            const newStocks = await generateStocks();
            
            await db.shop_stock.upsert(
                { id: 'current' },
                {
                    id: 'current',
                    stocks: newStocks,
                    lastRefresh: Date.now()
                }
            );

            stockData = {
                id: 'current',
                stocks: newStocks,
                lastRefresh: Date.now()
            };
        }

        const ballsWithStock = POKEBALLS.map(ball => {
            const stock = stockData.stocks[ball.id];
            return {
                ...ball,
                currentStock: stock.stock,
                currentPrice: stock.price,
                nextRefresh: stockData.lastRefresh + STOCK_REFRESH_INTERVAL
            };
        });

        return NextResponse.json({
            balls: ballsWithStock,
            nextRefresh: stockData.lastRefresh + STOCK_REFRESH_INTERVAL
        });
    } catch (error) {
        console.error('[SHOP STOCK] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock' },
            { status: 500 }
        );
    }
}
