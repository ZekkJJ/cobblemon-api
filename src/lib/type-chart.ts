// Type effectiveness chart
export const TYPE_CHART: Record<string, Record<string, number>> = {
    Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
    Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
    Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
    Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
    Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
    Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
    Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
    Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
    Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
    Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
    Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
    Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
    Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
    Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
    Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
    Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
    Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
    Fairy: { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
};

// Spanish type names
export const TYPE_NAMES_ES: Record<string, string> = {
    Normal: 'Normal',
    Fire: 'Fuego',
    Water: 'Agua',
    Electric: 'Eléctrico',
    Grass: 'Planta',
    Ice: 'Hielo',
    Fighting: 'Lucha',
    Poison: 'Veneno',
    Ground: 'Tierra',
    Flying: 'Volador',
    Psychic: 'Psíquico',
    Bug: 'Bicho',
    Rock: 'Roca',
    Ghost: 'Fantasma',
    Dragon: 'Dragón',
    Dark: 'Siniestro',
    Steel: 'Acero',
    Fairy: 'Hada',
};

// Calculate type effectiveness for a Pokemon
export function getTypeWeaknesses(types: string[]): { weaknesses: string[]; resistances: string[]; immunities: string[] } {
    const effectiveness: Record<string, number> = {};

    const allTypes = Object.keys(TYPE_CHART);

    for (const attackType of allTypes) {
        let multiplier = 1;
        for (const defenseType of types) {
            const chart = TYPE_CHART[attackType];
            if (chart && chart[defenseType] !== undefined) {
                multiplier *= chart[defenseType];
            }
        }
        effectiveness[attackType] = multiplier;
    }

    const weaknesses = Object.entries(effectiveness)
        .filter(([_, mult]) => mult > 1)
        .map(([type]) => type);

    const resistances = Object.entries(effectiveness)
        .filter(([_, mult]) => mult > 0 && mult < 1)
        .map(([type]) => type);

    const immunities = Object.entries(effectiveness)
        .filter(([_, mult]) => mult === 0)
        .map(([type]) => type);

    return { weaknesses, resistances, immunities };
}

// Defensive type chart (what types are weak to this Pokemon's types)
export function getTypeAdvantages(types: string[]): { strongAgainst: string[]; weakAgainst: string[] } {
    const strongAgainst = new Set<string>();
    const weakAgainst = new Set<string>();

    for (const attackType of types) {
        const chart = TYPE_CHART[attackType];
        if (chart) {
            for (const [defenseType, mult] of Object.entries(chart)) {
                if (mult > 1) strongAgainst.add(defenseType);
                if (mult < 1 && mult > 0) weakAgainst.add(defenseType);
            }
        }
    }

    return {
        strongAgainst: Array.from(strongAgainst),
        weakAgainst: Array.from(weakAgainst),
    };
}

// Evolution data with levels
export interface EvolutionStage {
    pokemonId: number;
    name: string;
    nameEs: string;
    level: number | null;
    method: string;
    sprite: string;
}

// Moves learned by level
export interface LearnedMove {
    level: number;
    name: string;
    nameEs: string;
    type: string;
    power: number | null;
    accuracy: number | null;
    category: 'Físico' | 'Especial' | 'Estado';
    description: string;
}
