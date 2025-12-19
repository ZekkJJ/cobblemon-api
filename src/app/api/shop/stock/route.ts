import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import { POKEBALLS, getRandomStock, getPriceWithStock } from '@/lib/pokeballs-data';

export const runtime = 'nodejs';

const STOCK_REFRESH_INTERVAL = 3600000;

async function generateStocks() {
    const stocks: any = {};
    const now = Date.now();

    // Siempre incluir las 3 básicas
    const basicBalls = POKEBALLS.filter(b => b.type === 'standard');
    
    // Pool de bolas especiales (sin Master Ball)
    const specialBalls = POKEBALLS.filter(b => b.type === 'special' && b.id !== 'master_ball');
    
    // Seleccionar 2 bolas especiales aleatorias
    const shuffled = specialBalls.sort(() => Math.random() - 0.5);
    const selectedSpecial = shuffled.slice(0, 2);
    
    // 5% de probabilidad de que aparezca Master Ball
    const hasMasterBall = Math.random() < 0.05;
    const masterBall = POKEBALLS.find(b => b.id === 'master_ball');
    
    // Combinar las bolas seleccionadas
    const selectedBalls = [...basicBalls, ...selectedSpecial];
    if (hasMasterBall && masterBall) {
        selectedBalls.push(masterBall);
    }

    selectedBalls.forEach(ball => {
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
            const timestamp = Date.now();
            
            await db.shop_stock.upsert(
                { id: 'current' },
                {
                    id: 'current',
                    stocks: newStocks,
                    lastRefresh: timestamp
                }
            );

            stockData = await db.shop_stock.findOne({ id: 'current' });
            if (!stockData) {
                throw new Error('Failed to create stock data');
            }
        }

        const ballsWithStock = POKEBALLS.map(ball => {
            const stock = stockData!.stocks[ball.id];
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
