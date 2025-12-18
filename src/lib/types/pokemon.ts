// Cobblemon Pokemon Types

export interface PokemonStats {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
}

export interface CobblemonPokemon {
    uuid: string;
    species: string;
    speciesId: number;
    nickname?: string;
    level: number;
    experience: number;
    shiny: boolean;
    gender: 'male' | 'female' | 'genderless';
    nature: string;
    ability: string;
    heldItem?: string;
    friendship: number;
    ivs: PokemonStats;
    evs: PokemonStats;
    moves: string[];
    currentHp: number;
    status?: string;
    teraType?: string;
    form?: string;
    caughtBall?: string;
    originalTrainer?: string;
}

export interface PCBox {
    boxNumber: number;
    name?: string;
    pokemon: CobblemonPokemon[];
}

export interface PlayerProfile {
    uuid: string;
    username: string;
    lastSync: string;
    party: CobblemonPokemon[];
    pc: PCBox[];
    stats: {
        totalPokemon: number;
        uniqueSpecies: number;
        shinies: number;
        avgLevel: number;
        strongestPokemon?: CobblemonPokemon;
    };
}

export interface PlayerSummary {
    uuid: string;
    username: string;
    totalPokemon: number;
    shinies: number;
    partyPreview: Array<{
        species: string;
        speciesId: number;
        level: number;
        shiny: boolean;
    }>;
    starter?: {
        id: number;
        name: string;
        isShiny: boolean;
    } | null;
    lastSync: string;
}

// Type map for Pokemon species to Pokedex ID
export const COBBLEMON_TO_POKEDEX: Record<string, number> = {
    'bulbasaur': 1,
    'ivysaur': 2,
    'venusaur': 3,
    'charmander': 4,
    'charmeleon': 5,
    'charizard': 6,
    'squirtle': 7,
    'wartortle': 8,
    'blastoise': 9,
    'caterpie': 10,
    'pikachu': 25,
    'raichu': 26,
    'eevee': 133,
    'vaporeon': 134,
    'jolteon': 135,
    'flareon': 136,
    // Add more as needed - or fetch from PokeAPI
};

// Nature stat modifiers
export const NATURE_MODIFIERS: Record<string, { plus?: keyof PokemonStats; minus?: keyof PokemonStats }> = {
    'hardy': {},
    'lonely': { plus: 'atk', minus: 'def' },
    'brave': { plus: 'atk', minus: 'spe' },
    'adamant': { plus: 'atk', minus: 'spa' },
    'naughty': { plus: 'atk', minus: 'spd' },
    'bold': { plus: 'def', minus: 'atk' },
    'docile': {},
    'relaxed': { plus: 'def', minus: 'spe' },
    'impish': { plus: 'def', minus: 'spa' },
    'lax': { plus: 'def', minus: 'spd' },
    'timid': { plus: 'spe', minus: 'atk' },
    'hasty': { plus: 'spe', minus: 'def' },
    'serious': {},
    'jolly': { plus: 'spe', minus: 'spa' },
    'naive': { plus: 'spe', minus: 'spd' },
    'modest': { plus: 'spa', minus: 'atk' },
    'mild': { plus: 'spa', minus: 'def' },
    'quiet': { plus: 'spa', minus: 'spe' },
    'bashful': {},
    'rash': { plus: 'spa', minus: 'spd' },
    'calm': { plus: 'spd', minus: 'atk' },
    'gentle': { plus: 'spd', minus: 'def' },
    'sassy': { plus: 'spd', minus: 'spe' },
    'careful': { plus: 'spd', minus: 'spa' },
    'quirky': {},
};
