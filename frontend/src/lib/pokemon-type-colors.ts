/**
 * Pokemon Type Colors Utility
 * Standard Pokemon type colors for UI display
 */

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

/**
 * Get the color for a Pokemon type
 * @param type - The Pokemon type (case-insensitive)
 * @returns Hex color string, defaults to normal type color if not found
 */
export function getTypeColor(type: string): string {
  const normalizedType = type.toLowerCase().trim();
  return TYPE_COLORS[normalizedType] || TYPE_COLORS.normal;
}

/**
 * Get a CSS gradient for dual-type Pokemon
 * @param type1 - Primary type
 * @param type2 - Secondary type (optional)
 * @returns CSS linear-gradient string
 */
export function getTypeGradient(type1: string, type2?: string): string {
  const color1 = getTypeColor(type1);
  if (!type2) {
    return color1;
  }
  const color2 = getTypeColor(type2);
  return `linear-gradient(135deg, ${color1} 0%, ${color1} 50%, ${color2} 50%, ${color2} 100%)`;
}

/**
 * Get IV color based on value (0-31)
 * Red (0) -> Yellow (15) -> Green (31)
 * @param value - IV value between 0 and 31
 * @returns Hex color string
 */
export function getIVColor(value: number): string {
  const clampedValue = Math.max(0, Math.min(31, value));
  const percentage = clampedValue / 31;
  
  if (percentage < 0.5) {
    // Red to Yellow (0-15)
    const r = 239;
    const g = Math.round(68 + (187 * (percentage * 2)));
    const b = 68;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to Green (16-31)
    const adjustedPercentage = (percentage - 0.5) * 2;
    const r = Math.round(239 - (205 * adjustedPercentage));
    const g = Math.round(187 + (10 * adjustedPercentage));
    const b = Math.round(68 + (10 * adjustedPercentage));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Calculate total IV percentage
 * @param ivs - Object with HP, Attack, Defense, SpAtk, SpDef, Speed
 * @returns Percentage (0-100)
 */
export function getIVPercentage(ivs: {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}): number {
  const total = ivs.hp + ivs.attack + ivs.defense + ivs.specialAttack + ivs.specialDefense + ivs.speed;
  const maxTotal = 31 * 6; // 186
  return Math.round((total / maxTotal) * 100);
}

/**
 * Result colors for victory/defeat
 */
export const RESULT_COLORS = {
  victory: '#22c55e',
  defeat: '#ef4444',
  draw: '#f59e0b',
};
