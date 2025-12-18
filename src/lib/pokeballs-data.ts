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
        description: 'A device for catching wild Pokémon.',
        sprite: '/sprites/pokeballs/poke_ball.png',
        minStock: 50,
        maxStock: 200
    },
    {
        id: 'great_ball',
        name: 'Great Ball',
        type: 'standard',
        catchRate: 1.5,
        basePrice: 600,
        description: 'A good, high-performance ball.',
        sprite: '/sprites/pokeballs/great_ball.png',
        minStock: 30,
        maxStock: 100
    },
    {
        id: 'ultra_ball',
        name: 'Ultra Ball',
        type: 'standard',
        catchRate: 2.0,
        basePrice: 1200,
        description: 'An ultra-high-performance ball.',
        sprite: '/sprites/pokeballs/ultra_ball.png',
        minStock: 15,
        maxStock: 50
    },
    {
        id: 'premier_ball',
        name: 'Premier Ball',
        type: 'standard',
        catchRate: 1.0,
        basePrice: 400,
        description: 'A rare ball made in commemoration of some event.',
        sprite: '/sprites/pokeballs/premier_ball.png',
        minStock: 20,
        maxStock: 80
    },
    {
        id: 'safari_ball',
        name: 'Safari Ball',
        type: 'special',
        catchRate: 1.5,
        basePrice: 3000,
        description: 'A special ball used in Safari Zone.',
        sprite: '/sprites/pokeballs/safari_ball.png',
        minStock: 5,
        maxStock: 15
    },
    {
        id: 'fast_ball',
        name: 'Fast Ball',
        type: 'apricorn',
        catchRate: 4.0,
        basePrice: 2500,
        description: 'Works well on fast Pokémon.',
        sprite: '/sprites/pokeballs/fast_ball.png',
        minStock: 8,
        maxStock: 25
    },
    {
        id: 'level_ball',
        name: 'Level Ball',
        type: 'apricorn',
        catchRate: 8.0,
        basePrice: 2800,
        description: 'Works better on lower-level Pokémon.',
        sprite: '/sprites/pokeballs/level_ball.png',
        minStock: 8,
        maxStock: 25
    },
    {
        id: 'lure_ball',
        name: 'Lure Ball',
        type: 'apricorn',
        catchRate: 5.0,
        basePrice: 2200,
        description: 'Works well on water Pokémon.',
        sprite: '/sprites/pokeballs/lure_ball.png',
        minStock: 8,
        maxStock: 25
    },
    {
        id: 'heavy_ball',
        name: 'Heavy Ball',
        type: 'apricorn',
        catchRate: 1.0,
        basePrice: 2600,
        description: 'Works well on heavy Pokémon.',
        sprite: '/sprites/pokeballs/heavy_ball.png',
        minStock: 8,
        maxStock: 25
    },
    {
        id: 'love_ball',
        name: 'Love Ball',
        type: 'apricorn',
        catchRate: 8.0,
        basePrice: 3200,
        description: 'Works on opposite gender Pokémon.',
        sprite: '/sprites/pokeballs/love_ball.png',
        minStock: 5,
        maxStock: 20
    },
    {
        id: 'friend_ball',
        name: 'Friend Ball',
        type: 'apricorn',
        catchRate: 1.0,
        basePrice: 1800,
        description: 'Makes caught Pokémon friendly faster.',
        sprite: '/sprites/pokeballs/friend_ball.png',
        minStock: 10,
        maxStock: 30
    },
    {
        id: 'moon_ball',
        name: 'Moon Ball',
        type: 'apricorn',
        catchRate: 4.0,
        basePrice: 3500,
        description: 'Works on Moon Stone evolution Pokémon.',
        sprite: '/sprites/pokeballs/moon_ball.png',
        minStock: 5,
        maxStock: 18
    },
    {
        id: 'sport_ball',
        name: 'Sport Ball',
        type: 'special',
        catchRate: 1.5,
        basePrice: 2000,
        description: 'A special ball used in Bug-Catching Contest.',
        sprite: '/sprites/pokeballs/sport_ball.png',
        minStock: 10,
        maxStock: 30
    },
    {
        id: 'net_ball',
        name: 'Net Ball',
        type: 'special',
        catchRate: 3.5,
        basePrice: 1800,
        description: 'Works well on Water and Bug-type Pokémon.',
        sprite: '/sprites/pokeballs/net_ball.png',
        minStock: 15,
        maxStock: 40
    },
    {
        id: 'dive_ball',
        name: 'Dive Ball',
        type: 'special',
        catchRate: 3.5,
        basePrice: 1900,
        description: 'Works well on Pokémon underwater.',
        sprite: '/sprites/pokeballs/dive_ball.png',
        minStock: 15,
        maxStock: 40
    },
    {
        id: 'nest_ball',
        name: 'Nest Ball',
        type: 'special',
        catchRate: 8.0,
        basePrice: 1600,
        description: 'Works better on weaker Pokémon.',
        sprite: '/sprites/pokeballs/nest_ball.png',
        minStock: 20,
        maxStock: 50
    },
    {
        id: 'repeat_ball',
        name: 'Repeat Ball',
        type: 'special',
        catchRate: 3.5,
        basePrice: 1700,
        description: 'Works better on caught species.',
        sprite: '/sprites/pokeballs/repeat_ball.png',
        minStock: 18,
        maxStock: 45
    },
    {
        id: 'timer_ball',
        name: 'Timer Ball',
        type: 'special',
        catchRate: 4.0,
        basePrice: 2100,
        description: 'More effective as turns pass.',
        sprite: '/sprites/pokeballs/timer_ball.png',
        minStock: 12,
        maxStock: 35
    },
    {
        id: 'luxury_ball',
        name: 'Luxury Ball',
        type: 'special',
        catchRate: 1.0,
        basePrice: 5000,
        description: 'Makes caught Pokémon friendlier.',
        sprite: '/sprites/pokeballs/luxury_ball.png',
        minStock: 3,
        maxStock: 10
    },
    {
        id: 'dusk_ball',
        name: 'Dusk Ball',
        type: 'special',
        catchRate: 3.5,
        basePrice: 2400,
        description: 'Works well at night or in caves.',
        sprite: '/sprites/pokeballs/dusk_ball.png',
        minStock: 10,
        maxStock: 30
    },
    {
        id: 'heal_ball',
        name: 'Heal Ball',
        type: 'special',
        catchRate: 1.0,
        basePrice: 1500,
        description: 'Restores caught Pokémon HP and status.',
        sprite: '/sprites/pokeballs/heal_ball.png',
        minStock: 20,
        maxStock: 50
    },
    {
        id: 'quick_ball',
        name: 'Quick Ball',
        type: 'special',
        catchRate: 5.0,
        basePrice: 2800,
        description: 'Works best on first turn.',
        sprite: '/sprites/pokeballs/quick_ball.png',
        minStock: 10,
        maxStock: 28
    },
    {
        id: 'dream_ball',
        name: 'Dream Ball',
        type: 'special',
        catchRate: 4.0,
        basePrice: 4500,
        description: 'Works well on sleeping Pokémon.',
        sprite: '/sprites/pokeballs/dream_ball.png',
        minStock: 4,
        maxStock: 12
    },
    {
        id: 'beast_ball',
        name: 'Beast Ball',
        type: 'special',
        catchRate: 5.0,
        basePrice: 8000,
        description: 'Designed to catch Ultra Beasts.',
        sprite: '/sprites/pokeballs/beast_ball.png',
        minStock: 1,
        maxStock: 5
    },
    {
        id: 'citrine_ball',
        name: 'Citrine Ball',
        type: 'apricorn',
        catchRate: 1.0,
        basePrice: 250,
        description: 'Made from Yellow Apricorns.',
        sprite: '/sprites/pokeballs/citrine_ball.png',
        minStock: 30,
        maxStock: 100
    },
    {
        id: 'verdant_ball',
        name: 'Verdant Ball',
        type: 'apricorn',
        catchRate: 1.0,
        basePrice: 250,
        description: 'Made from Green Apricorns.',
        sprite: '/sprites/pokeballs/verdant_ball.png',
        minStock: 30,
        maxStock: 100
    },
    {
        id: 'azure_ball',
        name: 'Azure Ball',
        type: 'apricorn',
        catchRate: 1.0,
        basePrice: 250,
        description: 'Made from Blue Apricorns.',
        sprite: '/sprites/pokeballs/azure_ball.png',
        minStock: 30,
        maxStock: 100
    },
    {
        id: 'roseate_ball',
        name: 'Roseate Ball',
        type: 'apricorn',
        catchRate: 1.0,
        basePrice: 250,
        description: 'Made from Pink Apricorns.',
        sprite: '/sprites/pokeballs/roseate_ball.png',
        minStock: 30,
        maxStock: 100
    },
    {
        id: 'slate_ball',
        name: 'Slate Ball',
        type: 'apricorn',
        catchRate: 1.0,
        basePrice: 250,
        description: 'Made from Black Apricorns.',
        sprite: '/sprites/pokeballs/slate_ball.png',
        minStock: 30,
        maxStock: 100
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
