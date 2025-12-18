import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import type { TimeBasedLevelCapRule } from '@/lib/types/level-caps';
import { randomUUID } from 'crypto';

// GET /api/admin/level-caps/time-rules
export async function GET() {
    try {
        const doc = await db.level_caps.findOne({});

        if (!doc) {
            return NextResponse.json({ success: true, rules: [] });
        }

        return NextResponse.json({
            success: true,
            rules: doc.timeBasedRules || []
        });
    } catch (error) {
        console.error('Error fetching time rules:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener reglas temporales' },
            { status: 500 }
        );
    }
}

// POST /api/admin/level-caps/time-rules
export async function POST(req: Request) {
    try {
        const ruleData: Omit<TimeBasedLevelCapRule, 'id' | 'createdAt' | 'createdBy' | 'currentCap' | 'lastUpdate'> = await req.json();

        const adminUser = 'admin'; // TODO: Get from auth

        const newRule: TimeBasedLevelCapRule = {
            ...ruleData,
            id: randomUUID(),
            createdBy: adminUser,
            createdAt: new Date(),
            currentCap: ruleData.startCap,
            lastUpdate: new Date()
        };

        const change = {
            timestamp: new Date(),
            admin: adminUser,
            action: 'create_time_rule',
            before: null,
            after: newRule,
            reason: `Created time-based rule: ${newRule.name}`
        };

        await db.level_caps.updateOne(
            {},
            {
                $push: {
                    timeBasedRules: newRule,
                    changeHistory: change
                },
                $set: {
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        // Clear cache
        await db.level_caps.updateOne({}, { $set: { playerCapCache: [] } });

        return NextResponse.json({
            success: true,
            rule: newRule
        });
    } catch (error) {
        console.error('Error creating time rule:', error);
        return NextResponse.json(
            { success: false, error: 'Error al crear regla temporal' },
            { status: 500 }
        );
    }
}
