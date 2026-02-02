/**
 * Pokemon Type Effectiveness System
 * Complete type chart with weaknesses, resistances, immunities, and counter suggestions
 */

// Type effectiveness multipliers
// 2 = super effective, 0.5 = not very effective, 0 = immune
export const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

export interface TypeEffectiveness {
  weaknesses4x: string[];
  weaknesses2x: string[];
  resistances4x: string[];
  resistances2x: string[];
  immunities: string[];
}

/**
 * Calculate type effectiveness for a Pokemon with one or two types
 */
export function calculateTypeEffectiveness(types: string[]): TypeEffectiveness {
  const effectiveness: Record<string, number> = {};
  
  // Initialize all types with 1x effectiveness
  ALL_TYPES.forEach(type => { effectiveness[type] = 1; });
  
  // Calculate defensive effectiveness for each attacking type
  for (const attackingType of ALL_TYPES) {
    let multiplier = 1;
    
    for (const defendingType of types) {
      const defType = defendingType.toLowerCase();
      const atkType = attackingType.toLowerCase();
      
      // Check what the attacking type does against this defending type
      const chart = TYPE_CHART[atkType];
      if (chart && chart[defType] !== undefined) {
        multiplier *= chart[defType];
      }
    }
    
    effectiveness[attackingType] = multiplier;
  }
  
  // Categorize
  const result: TypeEffectiveness = {
    weaknesses4x: [],
    weaknesses2x: [],
    resistances4x: [],
    resistances2x: [],
    immunities: [],
  };
  
  for (const [type, mult] of Object.entries(effectiveness)) {
    if (mult === 0) result.immunities.push(type);
    else if (mult >= 4) result.weaknesses4x.push(type);
    else if (mult >= 2) result.weaknesses2x.push(type);
    else if (mult <= 0.25) result.resistances4x.push(type);
    else if (mult <= 0.5) result.resistances2x.push(type);
  }
  
  return result;
}

/**
 * Get suggested counter types for a Pokemon
 */
export function getSuggestedCounterTypes(types: string[]): string[] {
  const effectiveness = calculateTypeEffectiveness(types);
  // Prioritize 4x weaknesses, then 2x
  return [...effectiveness.weaknesses4x, ...effectiveness.weaknesses2x].slice(0, 4);
}

/**
 * Common Pokemon by type for counter suggestions
 */
export const POKEMON_BY_TYPE: Record<string, string[]> = {
  normal: ['Snorlax', 'Blissey', 'Porygon-Z', 'Staraptor'],
  fire: ['Charizard', 'Arcanine', 'Blaziken', 'Volcarona', 'Cinderace'],
  water: ['Blastoise', 'Gyarados', 'Swampert', 'Greninja', 'Dracovish'],
  electric: ['Pikachu', 'Raichu', 'Jolteon', 'Luxray', 'Zeraora'],
  grass: ['Venusaur', 'Sceptile', 'Roserade', 'Rillaboom', 'Kartana'],
  ice: ['Lapras', 'Weavile', 'Mamoswine', 'Kyurem', 'Glaceon'],
  fighting: ['Machamp', 'Lucario', 'Conkeldurr', 'Urshifu', 'Blaziken'],
  poison: ['Gengar', 'Toxapex', 'Nidoking', 'Salazzle', 'Eternatus'],
  ground: ['Garchomp', 'Excadrill', 'Landorus', 'Hippowdon', 'Swampert'],
  flying: ['Dragonite', 'Salamence', 'Corviknight', 'Togekiss', 'Talonflame'],
  psychic: ['Alakazam', 'Mewtwo', 'Gardevoir', 'Espeon', 'Reuniclus'],
  bug: ['Scizor', 'Volcarona', 'Heracross', 'Pheromosa', 'Golisopod'],
  rock: ['Tyranitar', 'Rhyperior', 'Terrakion', 'Aerodactyl', 'Gigalith'],
  ghost: ['Gengar', 'Dragapult', 'Mimikyu', 'Aegislash', 'Chandelure'],
  dragon: ['Dragonite', 'Garchomp', 'Salamence', 'Hydreigon', 'Dragapult'],
  dark: ['Tyranitar', 'Hydreigon', 'Weavile', 'Grimmsnarl', 'Umbreon'],
  steel: ['Metagross', 'Scizor', 'Aegislash', 'Corviknight', 'Ferrothorn'],
  fairy: ['Clefable', 'Togekiss', 'Sylveon', 'Mimikyu', 'Gardevoir'],
};

/**
 * Get counter Pokemon suggestions based on weaknesses
 */
export function getCounterSuggestions(types: string[]): { type: string; pokemon: string[] }[] {
  const counterTypes = getSuggestedCounterTypes(types);
  return counterTypes.map(type => ({
    type,
    pokemon: POKEMON_BY_TYPE[type]?.slice(0, 3) || [],
  }));
}

/**
 * Type icons/emojis for display
 */
export const TYPE_ICONS: Record<string, string> = {
  normal: '⚪',
  fire: '🔥',
  water: '💧',
  electric: '⚡',
  grass: '🌿',
  ice: '❄️',
  fighting: '👊',
  poison: '☠️',
  ground: '🏔️',
  flying: '🦅',
  psychic: '🔮',
  bug: '🐛',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '✨',
};

/**
 * Get type icon
 */
export function getTypeIcon(type: string): string {
  return TYPE_ICONS[type.toLowerCase()] || '❓';
}

/**
 * Nature stat modifiers
 */
export const NATURE_MODIFIERS: Record<string, { boost: string; nerf: string } | null> = {
  hardy: null,
  lonely: { boost: 'attack', nerf: 'defense' },
  brave: { boost: 'attack', nerf: 'speed' },
  adamant: { boost: 'attack', nerf: 'specialAttack' },
  naughty: { boost: 'attack', nerf: 'specialDefense' },
  bold: { boost: 'defense', nerf: 'attack' },
  docile: null,
  relaxed: { boost: 'defense', nerf: 'speed' },
  impish: { boost: 'defense', nerf: 'specialAttack' },
  lax: { boost: 'defense', nerf: 'specialDefense' },
  timid: { boost: 'speed', nerf: 'attack' },
  hasty: { boost: 'speed', nerf: 'defense' },
  serious: null,
  jolly: { boost: 'speed', nerf: 'specialAttack' },
  naive: { boost: 'speed', nerf: 'specialDefense' },
  modest: { boost: 'specialAttack', nerf: 'attack' },
  mild: { boost: 'specialAttack', nerf: 'defense' },
  quiet: { boost: 'specialAttack', nerf: 'speed' },
  bashful: null,
  rash: { boost: 'specialAttack', nerf: 'specialDefense' },
  calm: { boost: 'specialDefense', nerf: 'attack' },
  gentle: { boost: 'specialDefense', nerf: 'defense' },
  sassy: { boost: 'specialDefense', nerf: 'speed' },
  careful: { boost: 'specialDefense', nerf: 'specialAttack' },
  quirky: null,
};

/**
 * Get nature effect description
 */
export function getNatureEffect(nature: string): string {
  const mod = NATURE_MODIFIERS[nature.toLowerCase()];
  if (!mod) return 'Neutral';
  
  const statNames: Record<string, string> = {
    attack: 'Atk',
    defense: 'Def',
    specialAttack: 'SpA',
    specialDefense: 'SpD',
    speed: 'Spe',
  };
  
  return `+${statNames[mod.boost]} / -${statNames[mod.nerf]}`;
}
