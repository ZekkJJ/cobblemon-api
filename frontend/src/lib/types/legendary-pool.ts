/**
 * Tipos para el sistema de Legendary Pool
 * Cobblemon Los Pitufos
 */

// Estado del pool actual
export interface LegendaryPool {
  _id: string;
  targetPokemon: string;
  targetLevel: number;
  goalAmount: number;
  currentAmount: number;
  status: 'active' | 'completed' | 'spawned' | 'expired';
  contributors: PoolContributor[];
  topContributor?: PoolContributor;
  spawnLocation?: string;
  spawnedAt?: string;
  createdAt: string;
  expiresAt?: string;
  rewards: PoolRewards;
  progress?: string;
  timeRemaining?: number;
}

// Contribuidor al pool
export interface PoolContributor {
  minecraftUuid: string;
  username: string;
  discordId?: string;
  totalContributed: number;
  contributions: Contribution[];
  rank: number;
  percentage: number | string;
  contributionCount?: number;
}

// Contribución individual
export interface Contribution {
  id: string;
  amount: number;
  timestamp: string;
}

// Recompensas del pool
export interface PoolRewards {
  topContributorBonus: number; // % extra de probabilidad de captura
  participationReward: string; // Item o beneficio para todos
  participationAmount: number;
  milestoneRewards: MilestoneReward[];
}

// Recompensa por milestone
export interface MilestoneReward {
  percentage: number; // 25%, 50%, 75%, 100%
  reward: string;
  claimed: boolean;
}

// Historial de pools
export interface PoolHistory {
  _id: string;
  targetPokemon: string;
  goalAmount: number;
  finalAmount: number;
  status: 'completed' | 'expired' | 'spawned';
  winnerId?: string;
  winnerUsername?: string;
  topContributorId: string;
  topContributorUsername: string;
  topContributorAmount?: number;
  totalContributors: number;
  completedAt?: string;
  spawnedAt?: string;
  expiredAt?: string;
  refundPercentage?: number;
}

// Request para contribuir
export interface ContributeRequest {
  minecraftUuid: string;
  amount: number;
  username?: string;
}

// Response de contribución
export interface ContributeResponse {
  success: boolean;
  message: string;
  newTotal: number;
  poolProgress: string;
  yourTotal: number;
  yourRank: number;
  isTopContributor: boolean;
  poolCompleted?: boolean;
  error?: string;
}

// Mi contribución
export interface MyContribution {
  minecraftUuid: string;
  username: string;
  totalContributed: number;
  contributions: Contribution[];
  lockedAmount: number;
  lastContribution: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  username: string;
  minecraftUuid: string;
  totalContributed: number;
  percentage: string;
  contributionCount: number;
}

// Legendary config
export interface LegendaryConfig {
  name: string;
  sprite: string;
  goalMultiplier: number;
  rarity: 'legendary' | 'mythical';
  dexId: number;
}

// FAQ Item
export interface PoolFAQ {
  question: string;
  answer: string;
  icon: string;
}

// Legendarios disponibles para el pool
export const POOL_LEGENDARIES: LegendaryConfig[] = [
  { name: 'Rayquaza', sprite: 'rayquaza', goalMultiplier: 1.0, rarity: 'legendary', dexId: 384 },
  { name: 'Mewtwo', sprite: 'mewtwo', goalMultiplier: 1.2, rarity: 'legendary', dexId: 150 },
  { name: 'Giratina', sprite: 'giratina', goalMultiplier: 1.1, rarity: 'legendary', dexId: 487 },
  { name: 'Dialga', sprite: 'dialga', goalMultiplier: 1.0, rarity: 'legendary', dexId: 483 },
  { name: 'Palkia', sprite: 'palkia', goalMultiplier: 1.0, rarity: 'legendary', dexId: 484 },
  { name: 'Arceus', sprite: 'arceus', goalMultiplier: 2.0, rarity: 'mythical', dexId: 493 },
  { name: 'Lugia', sprite: 'lugia', goalMultiplier: 0.9, rarity: 'legendary', dexId: 249 },
  { name: 'Ho-Oh', sprite: 'ho-oh', goalMultiplier: 0.9, rarity: 'legendary', dexId: 250 },
  { name: 'Kyogre', sprite: 'kyogre', goalMultiplier: 1.0, rarity: 'legendary', dexId: 382 },
  { name: 'Groudon', sprite: 'groudon', goalMultiplier: 1.0, rarity: 'legendary', dexId: 383 },
  { name: 'Zekrom', sprite: 'zekrom', goalMultiplier: 1.0, rarity: 'legendary', dexId: 644 },
  { name: 'Reshiram', sprite: 'reshiram', goalMultiplier: 1.0, rarity: 'legendary', dexId: 643 },
  { name: 'Kyurem', sprite: 'kyurem', goalMultiplier: 1.1, rarity: 'legendary', dexId: 646 },
  { name: 'Xerneas', sprite: 'xerneas', goalMultiplier: 0.95, rarity: 'legendary', dexId: 716 },
  { name: 'Yveltal', sprite: 'yveltal', goalMultiplier: 0.95, rarity: 'legendary', dexId: 717 },
  { name: 'Necrozma', sprite: 'necrozma', goalMultiplier: 1.3, rarity: 'legendary', dexId: 800 },
  { name: 'Eternatus', sprite: 'eternatus', goalMultiplier: 1.5, rarity: 'legendary', dexId: 890 },
];

// FAQs predefinidas
export const POOL_FAQS: PoolFAQ[] = [
  {
    question: '¿Qué pasa cuando se alcanza la meta?',
    answer: 'El legendario aparecerá en el Estadio del servidor. ¡Todos los jugadores online podrán intentar capturarlo! El que lo capture, se lo queda.',
    icon: 'fa-bolt',
  },
  {
    question: '¿Pierdo mi dinero si no lo capturo?',
    answer: 'No exactamente. Tu contribución te da beneficios: el TOP contribuidor tiene +25% de probabilidad de captura, y TODOS los participantes reciben recompensas de participación (Ultra Balls).',
    icon: 'fa-coins',
  },
  {
    question: '¿Qué gana el que más contribuye?',
    answer: 'El TOP contribuidor recibe: +25% probabilidad de captura, una Master Ball gratis, y reconocimiento en el servidor. ¡Vale la pena ser el #1!',
    icon: 'fa-trophy',
  },
  {
    question: '¿Hay recompensas por participar?',
    answer: 'Sí! Todos los que contribuyan reciben: Ultra Balls según su contribución, puntos de experiencia bonus, y acceso prioritario al área de spawn.',
    icon: 'fa-gift',
  },
  {
    question: '¿Cuánto tiempo tengo para contribuir?',
    answer: 'Cada pool tiene un tiempo límite (generalmente 7 días). Si no se alcanza la meta, se devuelve el 80% del dinero a cada contribuidor.',
    icon: 'fa-clock',
  },
  {
    question: '¿Puedo contribuir varias veces?',
    answer: '¡Sí! Puedes contribuir tantas veces como quieras. Todas tus contribuciones se suman para tu ranking.',
    icon: 'fa-plus-circle',
  },
  {
    question: '¿Qué pasa si hago /syncnow después de contribuir?',
    answer: 'Tu contribución está protegida. El dinero se descuenta inmediatamente y queda "bloqueado" en el pool. No puedes recuperarlo con sync.',
    icon: 'fa-shield-alt',
  },
  {
    question: '¿Cuál es la contribución mínima?',
    answer: 'La contribución mínima es de 1,000 CobbleDollars. Puedes contribuir cualquier cantidad por encima de eso.',
    icon: 'fa-hand-holding-usd',
  },
];

// Helper para obtener sprite URL
export function getLegendarySprite(pokemon: string): string {
  const legendary = POOL_LEGENDARIES.find(
    l => l.name.toLowerCase() === pokemon.toLowerCase()
  );
  if (legendary) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${legendary.dexId}.png`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png`;
}

// Helper para obtener animated sprite
export function getLegendaryAnimatedSprite(pokemon: string): string {
  const legendary = POOL_LEGENDARIES.find(
    l => l.name.toLowerCase() === pokemon.toLowerCase()
  );
  if (legendary) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${legendary.dexId}.gif`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/384.gif`;
}

// Formatear cantidad de dinero
export function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toLocaleString();
}

// Formatear tiempo restante
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Expirado';
  
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
