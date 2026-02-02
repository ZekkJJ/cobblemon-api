/**
 * Move Data Cache Utility
 * Fetches and caches Pokemon move data from PokeAPI
 */

export interface MoveData {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  effectShort: string;
  damageClass: 'physical' | 'special' | 'status';
}

// In-memory cache for move data
const moveCache = new Map<string, MoveData>();

// Fallback data for common moves when API fails
const FALLBACK_MOVES: Record<string, MoveData> = {
  tackle: { name: 'Tackle', type: 'normal', power: 40, accuracy: 100, pp: 35, effectShort: 'A physical attack.', damageClass: 'physical' },
  scratch: { name: 'Scratch', type: 'normal', power: 40, accuracy: 100, pp: 35, effectShort: 'Scratches with sharp claws.', damageClass: 'physical' },
  ember: { name: 'Ember', type: 'fire', power: 40, accuracy: 100, pp: 25, effectShort: 'May burn the target.', damageClass: 'special' },
  'water-gun': { name: 'Water Gun', type: 'water', power: 40, accuracy: 100, pp: 25, effectShort: 'Shoots water at the target.', damageClass: 'special' },
  thunderbolt: { name: 'Thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15, effectShort: 'May paralyze the target.', damageClass: 'special' },
  earthquake: { name: 'Earthquake', type: 'ground', power: 100, accuracy: 100, pp: 10, effectShort: 'Hits all adjacent Pokemon.', damageClass: 'physical' },
  flamethrower: { name: 'Flamethrower', type: 'fire', power: 90, accuracy: 100, pp: 15, effectShort: 'May burn the target.', damageClass: 'special' },
  'ice-beam': { name: 'Ice Beam', type: 'ice', power: 90, accuracy: 100, pp: 10, effectShort: 'May freeze the target.', damageClass: 'special' },
  psychic: { name: 'Psychic', type: 'psychic', power: 90, accuracy: 100, pp: 10, effectShort: 'May lower Sp. Def.', damageClass: 'special' },
  'shadow-ball': { name: 'Shadow Ball', type: 'ghost', power: 80, accuracy: 100, pp: 15, effectShort: 'May lower Sp. Def.', damageClass: 'special' },
  'dragon-claw': { name: 'Dragon Claw', type: 'dragon', power: 80, accuracy: 100, pp: 15, effectShort: 'A slashing attack.', damageClass: 'physical' },
  'close-combat': { name: 'Close Combat', type: 'fighting', power: 120, accuracy: 100, pp: 5, effectShort: 'Lowers user Def/Sp.Def.', damageClass: 'physical' },
  protect: { name: 'Protect', type: 'normal', power: null, accuracy: null, pp: 10, effectShort: 'Protects from attacks.', damageClass: 'status' },
  'swords-dance': { name: 'Swords Dance', type: 'normal', power: null, accuracy: null, pp: 20, effectShort: 'Sharply raises Attack.', damageClass: 'status' },
  roost: { name: 'Roost', type: 'flying', power: null, accuracy: null, pp: 10, effectShort: 'Restores HP by half.', damageClass: 'status' },
};

/**
 * Normalize move name for API lookup
 */
function normalizeMoveNameForApi(moveName: string): string {
  return moveName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Format move name for display
 */
function formatMoveName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetch move data from PokeAPI
 */
async function fetchMoveFromApi(moveName: string): Promise<MoveData | null> {
  const apiName = normalizeMoveNameForApi(moveName);
  
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/move/${apiName}`, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Get English effect text
    const effectEntry = data.effect_entries?.find(
      (e: { language: { name: string } }) => e.language.name === 'en'
    );
    const shortEffect = effectEntry?.short_effect || data.flavor_text_entries?.find(
      (e: { language: { name: string } }) => e.language.name === 'en'
    )?.flavor_text || 'No description available.';
    
    return {
      name: formatMoveName(data.name),
      type: data.type.name,
      power: data.power,
      accuracy: data.accuracy,
      pp: data.pp,
      effectShort: shortEffect.replace(/\n/g, ' ').substring(0, 150),
      damageClass: data.damage_class.name,
    };
  } catch (error) {
    console.error(`Failed to fetch move data for ${moveName}:`, error);
    return null;
  }
}

/**
 * Get move data with caching
 * @param moveName - The move name (any format)
 * @returns MoveData object
 */
export async function getMoveData(moveName: string): Promise<MoveData> {
  const normalizedName = normalizeMoveNameForApi(moveName);
  
  // Check cache first
  if (moveCache.has(normalizedName)) {
    return moveCache.get(normalizedName)!;
  }
  
  // Check fallback data
  if (FALLBACK_MOVES[normalizedName]) {
    moveCache.set(normalizedName, FALLBACK_MOVES[normalizedName]);
    return FALLBACK_MOVES[normalizedName];
  }
  
  // Fetch from API
  const apiData = await fetchMoveFromApi(moveName);
  
  if (apiData) {
    moveCache.set(normalizedName, apiData);
    return apiData;
  }
  
  // Return generic fallback
  const fallback: MoveData = {
    name: formatMoveName(moveName),
    type: 'normal',
    power: null,
    accuracy: null,
    pp: 0,
    effectShort: 'Move data unavailable.',
    damageClass: 'physical',
  };
  
  moveCache.set(normalizedName, fallback);
  return fallback;
}

/**
 * Preload multiple moves into cache
 */
export async function preloadMoves(moveNames: string[]): Promise<void> {
  const uniqueMoves = Array.from(new Set(moveNames.map(normalizeMoveNameForApi)));
  const uncachedMoves = uniqueMoves.filter(name => !moveCache.has(name));
  
  await Promise.all(uncachedMoves.map(name => getMoveData(name)));
}

/**
 * Clear the move cache
 */
export function clearMoveCache(): void {
  moveCache.clear();
}
