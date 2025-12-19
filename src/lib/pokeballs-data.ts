export interface Pokeball {
    id: string;
    name: string;
    type: 'standard' | 'special' | 'apricorn' | 'ancient';
    catchRate: number;
    basePrice: number;
    description: string;
    sprite: string;
    minStock: number;
    maxStock: number;
}

export const POKEBALLS: Pokeball[] = [
    {
        id: 'poke_ball',
        name: 'Poké Ball',
        type: 'standard',
        catchRate: 1.0,
        basePrice: 200,
        description: 'La Pokébola básica para capturar Pokémon salvajes.',
        sprite: '🔴',
        minStock: 3,
        maxStock: 8
    },
    {
        id: 'great_ball',
        name: 'Great Ball',
        type: 'standard',
        catchRate: 1.5,
        basePrice: 600,
        description: 'Una Pokébola mejorada con mayor tasa de captura.',
        sprite: '🔵',
        minStock: 2,
        maxStock: 5
    },
    {
        id: 'ultra_ball',
        name: 'Ultra Ball',
        type: 'standard',
        catchRate: 2.0,
        basePrice: 1200,
        description: 'Una Pokébola de alto rendimiento para capturas difíciles.',
        sprite: '⚫',
        minStock: 1,
        maxStock: 3
    },
    {
        id: 'master_ball',
        name: 'Master Ball',
        type: 'special',
        catchRate: 255.0,
        basePrice: 50000,
        description: '¡Captura CUALQUIER Pokémon sin fallar! Extremadamente rara.',
        sprite: '🟣',
        minStock: 0,
        maxStock: 1
    },
    {
        id: 'luxury_ball',
        name: 'Luxury Ball',
        type: 'special',
        catchRate: 1.0,
        basePrice: 3000,
        description: 'Los Pokémon capturados se vuelven más amigables rápidamente.',
        sprite: '🟡',
        minStock: 1,
        maxStock: 4
    }
];

export function getRandomStock(ball: Pokeball): number {
    return Math.floor(Math.random() * (ball.maxStock - ball.minStock + 1)) + ball.minStock;
}

export function getPriceWithStock(basePrice: number, stock: number, maxStock: number): number {
    const stockRatio = stock / maxStock;
    if (stockRatio < 0.1) return Math.floor(basePrice * 3.0);
    if (stockRatio < 0.25) return Math.floor(basePrice * 2.0);
    if (stockRatio < 0.5) return Math.floor(basePrice * 1.5);
    return basePrice;
}
