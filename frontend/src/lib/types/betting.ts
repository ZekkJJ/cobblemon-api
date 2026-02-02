/**
 * Tournament Betting Types
 * Cobblemon Los Pitufos
 */

export interface BetSlot {
  id: string | null;
  name: string | null;
  totalBets: number;
  odds: string;
}

export interface BettableMatch {
  matchId: string;
  tournamentId: string;
  tournamentName: string;
  tournamentCode: string;
  roundName: string;
  is2v2: boolean;
  slot1: BetSlot;
  slot2: BetSlot;
  totalPool: number;
  betCount: number;
  // User-specific restrictions
  restricted?: boolean;
  restrictionReason?: string | null;
  userBet?: {
    amount: number;
    betOn: 'slot1' | 'slot2';
  } | null;
}

export interface Bet {
  id: string;
  tournamentName: string;
  targetName: string;
  amount: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  payout?: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface UserBetStats {
  totalBets: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: string | number;
  totalWagered: number;
  totalWon: number;
  netProfit: number;
}

export interface MatchBetStats {
  slot1: {
    totalBets: number;
    totalAmount: number;
    odds: string;
  };
  slot2: {
    totalBets: number;
    totalAmount: number;
    odds: string;
  };
  totalPool: number;
  houseCut: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  totalWins: number;
  totalWon: number;
  totalWagered: number;
  profit: number;
}

export interface TournamentBetStats {
  totalBets: number;
  totalPool: number;
  mostBetTarget: {
    targetId: string;
    targetName: string;
    totalAmount: number;
    betCount: number;
  } | null;
  topTargets: Array<{
    targetId: string;
    targetName: string;
    totalAmount: number;
    betCount: number;
  }>;
}
