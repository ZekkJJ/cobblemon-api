/**
 * Tipos del Sistema Pokemon Gacha - Frontend
 * Cobblemon Los Pitufos
 */

// Raridades
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// Colores por rareza
export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9CA3AF',      // gray-400
  uncommon: '#22C55E',    // green-500
  rare: '#3B82F6',        // blue-500
  epic: '#A855F7',        // purple-500
  legendary: '#F59E0B',   // amber-500
  mythic: '#EC4899',      // pink-500
};

export const RARITY_BG_COLORS: Record<Rarity, string> = {
  common: 'bg-gray-500/20',
  uncommon: 'bg-green-500/20',
  rare: 'bg-blue-500/20',
  epic: 'bg-purple-500/20',
  legendary: 'bg-amber-500/20',
  mythic: 'bg-pink-500/20',
};

export const RARITY_BORDER_COLORS: Record<Rarity, string> = {
  common: 'border-gray-500',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-amber-500',
  mythic: 'border-pink-500',
};

export const RARITY_NAMES: Record<Rarity, string> = {
  common: 'Común',
  uncommon: 'Poco Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
  mythic: 'Mítico',
};

// IVs de Pokémon
export interface PokemonIVs {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

// Datos de Pokémon en recompensa
export interface GachaPokemonData {
  pokemonId: number;
  name: string;
  nameEs: string;
  level: number;
  isShiny: boolean;
  ivs: PokemonIVs;
  nature: string;
  ability: string;
  types?: string[];
  sprite?: string;
  spriteShiny?: string;
}

// Datos de item en recompensa
export interface GachaItemData {
  itemId: string;
  name: string;
  nameEs?: string;
  quantity: number;
  sprite?: string;
}

// Recompensa del gacha
export interface GachaReward {
  rewardId: string;
  playerId: string;
  bannerId: string;
  bannerName: string;
  type: 'pokemon' | 'item';
  pokemon?: GachaPokemonData;
  item?: GachaItemData;
  rarity: Rarity;
  isShiny: boolean;
  isFeatured: boolean;
  status: 'pending' | 'claimed' | 'expired';
  pulledAt: string;
}

// Item destacado
export interface FeaturedItem {
  type: 'pokemon' | 'item';
  id: number | string;
  name: string;
  nameEs?: string;
  rarity: Rarity;
  sprite: string;
}

// Banner de gacha
export interface GachaBanner {
  bannerId: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs?: string;
  artwork: string;
  type: 'standard' | 'limited' | 'event';
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  featuredPokemon: FeaturedItem[];
  featuredItems: FeaturedItem[];
  rateUpMultiplier: number;
  singlePullCost: number;
  multiPullCost: number;
}

// Configuración de pity sincronizada con backend
// AJUSTADO: Hard pity subido a 400 tiradas
export const PITY_CONFIG = {
  softPityStart: 350,      // Soft pity empieza en 350
  hardPity: 400,           // Hard pity garantiza Epic+ en 400
  softPityIncrement: 0.02, // 2% por tirada después de soft pity
} as const;

// Estado de pity (campos del backend - sincronizado con pokemon-gacha.types.ts)
export interface PityStatus {
  // Campos principales del backend
  pullsSinceEpic: number;
  pullsSinceLegendary: number;
  lost5050: boolean;
  totalPulls: number;
  totalSpent: number;
  softPityActive: boolean;
  pullsUntilHardPity: number;
  currentEpicChance: number;
  // Campos adicionales para frontend (calculados o alias)
  currentPity?: number;      // Alias de pullsSinceEpic
  softPityStart?: number;    // Constante: 75
  hardPity?: number;         // Constante: 90
}

// Resultado de tirada simple
export interface GachaPullResult {
  success: true;
  reward: GachaReward;
  newBalance: number;
  pityStatus: PityStatus;
  message: string;
}

// Resultado de multi-pull
export interface GachaMultiPullResult {
  success: true;
  rewards: GachaReward[];
  newBalance: number;
  pityStatus: PityStatus;
  message: string;
  highlights: {
    epicOrBetter: number;
    shinies: number;
    featured: number;
  };
}

// Distribución de rareza
export interface RarityDistribution {
  common: number;
  uncommon: number;
  rare: number;
  epic: number;
  legendary: number;
  mythic: number;
}

// Estadísticas del jugador
export interface GachaStats {
  totalPulls: number;
  totalSpent: number;
  rarityDistribution: RarityDistribution;
  shinyCount: number;
  featuredCount: number;
  pokemonCount: number;
  itemCount: number;
  averagePityToEpic: number;
  luckRating: number;
}

// Entrada de historial
export interface GachaHistoryEntry {
  playerId: string;
  bannerId: string;
  bannerName: string;
  reward: GachaReward;
  rarity: Rarity;
  isShiny: boolean;
  isFeatured: boolean;
  pityAtPull: number;
  cost: number;
  pulledAt: string;
}
