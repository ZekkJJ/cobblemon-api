// Level Caps System Types

export interface GlobalLevelCapConfig {
    captureCapEnabled: boolean;
    ownershipCapEnabled: boolean;
    defaultCaptureCapFormula: string;
    defaultOwnershipCapFormula: string;
    enforcementMode: 'hard' | 'soft';
    customMessages: {
        captureFailed: string;
        expBlocked: string;
        itemBlocked: string;
        tradeBlocked: string;
    };
}

export interface StaticRuleConditions {
    playerGroups?: string[];
    specificPlayers?: string[];
    badges?: { min?: number; max?: number };
    playtime?: { min?: number; max?: number };
}

export interface StaticLevelCapRule {
    id: string;
    name: string;
    priority: number;
    active: boolean;
    conditions: StaticRuleConditions;
    captureCap?: number | null;
    ownershipCap?: number | null;
    createdBy: string;
    createdAt: Date;
    notes: string;
}

export type ProgressionType = 'daily' | 'interval' | 'schedule';

export interface ProgressionConfig {
    type: ProgressionType;
    // Para type: 'daily'
    dailyIncrease?: number;
    // Para type: 'interval'
    intervalDays?: number;
    intervalIncrease?: number;
    // Para type: 'schedule'
    schedule?: Array<{
        date: Date;
        setCap: number;
    }>;
}

export interface TimeBasedLevelCapRule {
    id: string;
    name: string;
    active: boolean;
    targetCap: 'capture' | 'ownership' | 'both';
    progression: ProgressionConfig;
    startCap: number;
    maxCap?: number | null;
    startDate: Date;
    endDate?: Date | null;
    currentCap: number;
    lastUpdate: Date;
    createdBy: string;
    createdAt: Date;
}

export interface LevelCapChange {
    timestamp: Date;
    admin: string;
    action: string;
    before: any;
    after: any;
    reason: string;
}

export interface PlayerCapCache {
    uuid: string;
    effectiveCaptureCap: number;
    effectiveOwnershipCap: number;
    calculatedAt: Date;
    appliedRules: string[];
}

export interface LevelCapsDocument {
    _id?: string;
    globalConfig: GlobalLevelCapConfig;
    staticRules: StaticLevelCapRule[];
    timeBasedRules: TimeBasedLevelCapRule[];
    changeHistory: LevelCapChange[];
    playerCapCache: PlayerCapCache[];
    createdAt: Date;
    updatedAt: Date;
}

export interface EffectiveCapsResponse {
    captureCap: number;
    ownershipCap: number;
    appliedRules: string[];
    calculatedAt: Date;
}
