export interface User {
    _id?: string;
    discordId: string | null;
    discordUsername: string;
    discordAvatar?: string;
    nickname: string;
    starterId: number | null;
    starterIsShiny: boolean;
    rolledAt: Date | null;
    isAdmin: boolean;
    verifiedViaBot: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface StarterStats {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
}

export interface Ability {
    name: string;
    nameEs: string;
    isHidden: boolean;
    description: string;
}

export interface Move {
    name: string;
    type: string;
    category: 'physical' | 'special' | 'status';
    power: number | null;
    accuracy: number | null;
}

export interface Evolution {
    to: number;
    toName: string;
    method: string;
}

export interface Starter {
    _id?: string;
    pokemonId: number;
    name: string;
    nameEs: string;
    generation: number;
    types: string[];
    stats: StarterStats;
    abilities: Ability[];
    signatureMoves: Move[];
    evolutions: Evolution[];
    description: string;
    height: number;
    weight: number;
    isClaimed: boolean;
    claimedBy: string | null;
    claimedByNickname: string | null;
    claimedAt: Date | null;
}

export interface TournamentParticipant {
    visitorId: string;
    seed: number;
    eliminated: boolean;
}

export interface TournamentMatch {
    matchId: string;
    position: { x: number; y: number };
    player1Id: string | null;
    player2Id: string | null;
    player1Score: number;
    player2Score: number;
    winnerId: string | null;
    isBye: boolean;
    status: 'pending' | 'active' | 'completed';
    nextMatchId: string | null;
}

export interface TournamentRound {
    roundNumber: number;
    name: string;
    matches: TournamentMatch[];
}

export interface Tournament {
    _id?: string;
    name: string;
    createdBy: string;
    createdAt: Date;
    status: 'draft' | 'active' | 'completed';
    participants: TournamentParticipant[];
    rounds: TournamentRound[];
    bracketType: 'single' | 'double';
    winnerId?: string;
}
