/**
 * Tipos de Torneos para el Frontend
 * Cobblemon Los Pitufos
 */

// Tipos de victoria
export type VictoryType = 'KO' | 'FORFEIT' | 'TIMEOUT' | 'DRAW' | 'ADMIN_DECISION' | 'BYE';

// Estados de match
export type MatchStatus = 'pending' | 'ready' | 'active' | 'completed' | 'requires_admin';

// Estados de participante
export type ParticipantStatus = 'registered' | 'active' | 'eliminated' | 'winner';

// Estados de torneo
export type TournamentStatus = 'draft' | 'registration' | 'upcoming' | 'active' | 'completed' | 'cancelled';

// Participante
export interface TournamentParticipant {
  id: string;
  username: string;
  minecraftUuid: string;
  discordId?: string;
  seed: number;
  status: ParticipantStatus;
  eliminated: boolean;
  eliminatedAt?: string;
  eliminatedBy?: string;
  finalPlacement?: number;
  registeredAt: string;
}

// Match
export interface TournamentMatch {
  id: string;
  tournamentId: string;
  roundNumber: number;
  matchNumber: number;
  bracketSide?: 'winners' | 'losers';
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  loserId: string | null;
  victoryType?: VictoryType;
  status: MatchStatus;
  isBye: boolean;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  nextMatchId: string | null;
  nextLoserMatchId?: string | null;
  adminOverride: boolean;
  adminId?: string;
}

// Ronda
export interface TournamentRound {
  roundNumber: number;
  name: string;
  matches: TournamentMatch[];
  isComplete: boolean;
}

// Estructura del bracket
export interface BracketStructure {
  type: 'single' | 'double';
  rounds: TournamentRound[];
  currentRound: number;
  totalRounds: number;
  winnerId: string | null;
  losersRounds?: TournamentRound[];
}

// Torneo completo
export interface Tournament {
  _id: string;
  code: string;
  name: string;
  title?: string;
  description: string;
  rules?: string;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
  maxParticipants: number;
  minParticipants?: number;
  bracketType: 'single' | 'double';
  format?: string;
  status: TournamentStatus;
  currentRound: number;
  participants: TournamentParticipant[];
  bracket: BracketStructure | null;
  winnerId?: string;
  winnerUsername?: string;
  prizes: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  version: number;
  imageUrl?: string;
}

// Helpers
export function getParticipantById(tournament: Tournament, id: string): TournamentParticipant | undefined {
  return tournament.participants.find(p => p.id === id);
}

export function getStatusColor(status: TournamentStatus): string {
  switch (status) {
    case 'registration':
    case 'upcoming':
      return 'text-blue-400';
    case 'active':
      return 'text-green-400';
    case 'completed':
      return 'text-gray-400';
    case 'cancelled':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

export function getStatusText(status: TournamentStatus): string {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'registration':
      return 'Inscripciones Abiertas';
    case 'upcoming':
      return 'Próximamente';
    case 'active':
      return 'En Curso';
    case 'completed':
      return 'Finalizado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
}

export function getMatchStatusColor(status: MatchStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-gray-600';
    case 'ready':
      return 'bg-yellow-600';
    case 'active':
      return 'bg-green-600 animate-pulse';
    case 'completed':
      return 'bg-blue-600';
    case 'requires_admin':
      return 'bg-red-600';
    default:
      return 'bg-gray-600';
  }
}
