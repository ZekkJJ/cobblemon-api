// ============================================================================
// Service Types
// ============================================================================
export type ServiceType = 'BATTLE_ANALYSIS' | 'AI_TUTOR' | 'BREED_ADVISOR';

export interface ServiceCooldowns {
  battleAnalysis: number | null;
  aiTutor: number | null;
  breedAdvisor: number | null;
}

export interface ServicePricing {
  battleAnalysis: number;
  aiTutor: number;
  breedAdvisor: number;
  cooldowns: {
    battleAnalysis: number;
    aiTutor: number;
    breedAdvisor: number;
  };
  dailyLimits: {
    battleAnalysis: number;
    aiTutor: number;
    breedAdvisor: number;
  };
}

// ============================================================================
// Battle Analysis Types
// ============================================================================
export interface BattleSummary {
  id: string;
  date: string;
  opponent: string;
  opponentUuid: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  duration: number;
  turns: number;
  analyzed: boolean;
}

export interface MoveAction {
  move: string;
  pokemon: string;
  damage?: number;
  effectiveness?: string;
}

export interface TurnAnalysis {
  turn: number;
  playerMove: MoveAction;
  opponentMove: MoveAction;
  analysis: string;
  alternativePlay?: string;
}

export interface KeyMoment {
  turn: number;
  description: string;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface BattleAnalysisResponse {
  battleId: string;
  summary: string;
  turnByTurn: TurnAnalysis[];
  keyMoments: KeyMoment[];
  recommendations: string[];
  overallRating: number;
}

// ============================================================================
// AI Tutor Types
// ============================================================================
export interface AITutorRequest {
  question: string;
  includeTeamData: boolean;
}

export interface TeamAnalysis {
  strengths: string[];
  weaknesses: string[];
  typeChart: {
    offensive: Record<string, number>;
    defensive: Record<string, number>;
  };
}

export interface Suggestion {
  type: 'MOVESET' | 'POKEMON' | 'ITEM' | 'EV_SPREAD' | 'NATURE';
  target: string;
  suggestion: string;
  reasoning: string;
}

export interface AITutorResponse {
  answer: string;
  teamAnalysis?: TeamAnalysis;
  suggestions: Suggestion[];
}

export interface AITutorHistoryItem {
  _id: string;
  question: string;
  answer: string;
  teamAnalysis?: TeamAnalysis;
  suggestions: Suggestion[];
  cost: number;
  createdAt: string;
}

// ============================================================================
// Breed Advisor Types
// ============================================================================
export interface BreedAdvisorRequest {
  targetSpecies?: string;
  targetIVs?: Partial<PokemonStats>;
  targetNature?: string;
  targetAbility?: string;
  includeShinyAdvice: boolean;
}

export interface PokemonSummary {
  uuid: string;
  species: string;
  gender: string;
  nature: string;
  ability: string;
  ivs: PokemonStats;
  shiny: boolean;
}

export interface BreedingPair {
  parent1: PokemonSummary;
  parent2: PokemonSummary;
  compatibility: number;
  eggGroup: string;
  expectedIVs: PokemonStats;
}

export interface BreedingStep {
  step: number;
  parents: [string, string];
  expectedResult: string;
  itemsNeeded: string[];
  notes: string;
}

export interface ShinyOddsInfo {
  baseOdds: string;
  masudaBonus: boolean;
  crystalBonus: number;
  finalOdds: string;
  expectedEggs: number;
}

export interface BreedAdvisorResponse {
  breedingPairs: BreedingPair[];
  breedingChain: BreedingStep[];
  ivInheritance: {
    guaranteedIVs: number;
    destinyKnotEffect: string;
    powerItemEffect: string;
  };
  abilityInheritance: {
    motherAbility: string;
    inheritanceChance: number;
    hiddenAbilityChance?: number;
  };
  shinyOdds?: ShinyOddsInfo;
  estimatedEggs: number;
}

// ============================================================================
// PokéBox Types
// ============================================================================
export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokeBoxFilters {
  species?: string;
  types?: string[];
  shiny?: boolean;
  ivMin?: number;
  ivMax?: number;
  evMin?: number;
  evMax?: number;
  nature?: string;
  ability?: string;
  levelMin?: number;
  levelMax?: number;
}

export interface PokemonWithCalculations {
  uuid: string;
  species: string;
  nickname?: string;
  level: number;
  nature: string;
  ability: string;
  moves: string[];
  ivs: PokemonStats;
  evs: PokemonStats;
  shiny: boolean;
  ivPercentage: number;
  evRemaining: number;
  isProtected: boolean;
}

export interface DuplicateGroup {
  species: string;
  speciesId: number;
  pokemon: PokemonWithCalculations[];
  suggestedKeep: string;
}

// ============================================================================
// Stat Planner Types
// ============================================================================
export interface EVPlan {
  pokemonUuid: string;
  pokemonSpecies: string;
  evDistribution: PokemonStats;
  projectedStats50: PokemonStats;
  projectedStats100: PokemonStats;
  savedAt: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================
export interface TutoriasPageData {
  userBalance: number;
  cooldowns: ServiceCooldowns;
  pricing: ServicePricing;
  dailyUsage: {
    battleAnalysis: number;
    aiTutor: number;
    breedAdvisor: number;
  };
}

// ============================================================================
// API Response Types
// ============================================================================
export interface TutoriasApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  newBalance?: number;
}
