import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import type { TimeBasedLevelCapRule, EffectiveCapsResponse } from '@/lib/types/level-caps';

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic';

// Función para evaluar una fórmula simple
function evaluateFormula(formula: string, player: any): number {
    try {
        // Variables disponibles
        const badges = player.badges || 0;
        const playtime = player.playtime || 0; // en minutos
        const level = player.level || 1;

        // Reemplazar variables en la fórmula
        let evaluated = formula
            .replace(/badges/g, String(badges))
            .replace(/playtime/g, String(playtime))
            .replace(/level/g, String(level));

        // Evaluar matemáticamente (solo operaciones seguras)
        // eslint-disable-next-line no-eval
        const result = eval(evaluated);

        return typeof result === 'number' && !isNaN(result) ? Math.floor(result) : Infinity;
    } catch {
        return Infinity;
    }
}

// Función para calcular cap de regla temporal
function calculateTimeBasedCap(rule: TimeBasedLevelCapRule): number {
    const now = new Date();
    const daysPassed = Math.floor(
        (now.getTime() - new Date(rule.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    let cap = rule.startCap;

    if (rule.progression.type === 'daily') {
        cap += daysPassed * (rule.progression.dailyIncrease || 0);
    } else if (rule.progression.type === 'interval') {
        const intervals = Math.floor(daysPassed / (rule.progression.intervalDays || 1));
        cap += intervals * (rule.progression.intervalIncrease || 0);
    } else if (rule.progression.type === 'schedule') {
        const applicableSchedules = (rule.progression.schedule || [])
            .filter(s => new Date(s.date) <= now)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (applicableSchedules.length > 0) {
            cap = applicableSchedules[0].setCap;
        }
    }

    // Aplicar max cap si existe
    if (rule.maxCap) {
        cap = Math.min(cap, rule.maxCap);
    }

    return cap;
}

// Función para verificar si las condiciones se cumplen
function matchesConditions(conditions: any, player: any): boolean {
    if (!conditions) return true;

    // Check player groups
    if (conditions.playerGroups && conditions.playerGroups.length > 0) {
        const playerGroups = player.groups || [];
        if (!conditions.playerGroups.some((g: string) => playerGroups.includes(g))) {
            return false;
        }
    }

    // Check specific players
    if (conditions.specificPlayers && conditions.specificPlayers.length > 0) {
        if (!conditions.specificPlayers.includes(player.minecraftUuid)) {
            return false;
        }
    }

    // Check badges
    if (conditions.badges) {
        const playerBadges = player.badges || 0;
        if (conditions.badges.min !== undefined && playerBadges < conditions.badges.min) return false;
        if (conditions.badges.max !== undefined && playerBadges > conditions.badges.max) return false;
    }

    // Check playtime
    if (conditions.playtime) {
        const playerPlaytime = player.playtime || 0;
        if (conditions.playtime.min !== undefined && playerPlaytime < conditions.playtime.min) return false;
        if (conditions.playtime.max !== undefined && playerPlaytime > conditions.playtime.max) return false;
    }

    return true;
}

// Calcular caps efectivos para un jugador
async function getEffectiveCaps(uuid: string): Promise<EffectiveCapsResponse> {
    const player = await db.users.findOne({ minecraftUuid: uuid });
    const config = await db.level_caps.findOne({});

    if (!config || !player) {
        return {
            captureCap: Infinity,
            ownershipCap: Infinity,
            appliedRules: [],
            calculatedAt: new Date()
        };
    }

    let captureCap = Infinity;
    let ownershipCap = Infinity;
    const appliedRules: string[] = [];

    // 1. Evaluar fórmula por defecto si está habilitado
    if (config.globalConfig.captureCapEnabled && config.globalConfig.defaultCaptureCapFormula) {
        captureCap = evaluateFormula(config.globalConfig.defaultCaptureCapFormula, player);
    }

    if (config.globalConfig.ownershipCapEnabled && config.globalConfig.defaultOwnershipCapFormula) {
        ownershipCap = evaluateFormula(config.globalConfig.defaultOwnershipCapFormula, player);
    }

    // 2. Aplicar reglas estáticas (por prioridad)
    const staticRules = (config.staticRules || [])
        .filter((r: any) => r.active && matchesConditions(r.conditions, player))
        .sort((a: any, b: any) => b.priority - a.priority);

    for (const rule of staticRules) {
        if (rule.captureCap !== null && rule.captureCap !== undefined) {
            captureCap = Math.min(captureCap, rule.captureCap);
            appliedRules.push(rule.id);
        }
        if (rule.ownershipCap !== null && rule.ownershipCap !== undefined) {
            ownershipCap = Math.min(ownershipCap, rule.ownershipCap);
            appliedRules.push(rule.id);
        }
    }

    // 3. Aplicar reglas temporales activas
    const now = new Date();
    const timeRules = (config.timeBasedRules || []).filter((r: any) =>
        r.active &&
        new Date(r.startDate) <= now &&
        (!r.endDate || new Date(r.endDate) >= now)
    );

    for (const rule of timeRules) {
        const currentCap = calculateTimeBasedCap(rule);

        if (rule.targetCap === 'capture' || rule.targetCap === 'both') {
            captureCap = Math.min(captureCap, currentCap);
            appliedRules.push(rule.id);
        }
        if (rule.targetCap === 'ownership' || rule.targetCap === 'both') {
            ownershipCap = Math.min(ownershipCap, currentCap);
            appliedRules.push(rule.id);
        }
    }

    // 4. Asegurar relación lógica (capture cap no puede ser mayor que ownership cap)
    captureCap = Math.min(captureCap, ownershipCap);

    // Convertir Infinity a un número grande pero razonable
    if (captureCap === Infinity) captureCap = 100;
    if (ownershipCap === Infinity) ownershipCap = 100;

    return {
        captureCap,
        ownershipCap,
        appliedRules,
        calculatedAt: new Date()
    };
}

// GET /api/level-caps/effective?uuid=<player-uuid>
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const uuid = searchParams.get('uuid');

        if (!uuid) {
            return NextResponse.json(
                { success: false, error: 'UUID requerido' },
                { status: 400 }
            );
        }

        const caps = await getEffectiveCaps(uuid);

        return NextResponse.json({
            success: true,
            ...caps
        });
    } catch (error) {
        console.error('Error calculating effective caps:', error);
        return NextResponse.json(
            { success: false, error: 'Error al calcular caps' },
            { status: 500 }
        );
    }
}
