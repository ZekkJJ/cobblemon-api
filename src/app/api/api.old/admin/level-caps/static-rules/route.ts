import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import type { StaticLevelCapRule } from '@/lib/types/level-caps';
import { randomUUID } from 'crypto';

// GET /api/admin/level-caps/static-rules
export async function GET() {
    try {
        const doc = await db.level_caps.findOne({});

        if (!doc) {
            return NextResponse.json({ success: true, rules: [] });
        }

        return NextResponse.json({
            success: true,
            rules: doc.staticRules || []
        });
    } catch (error) {
        console.error('Error fetching static rules:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener reglas' },
            { status: 500 }
        );
    }
}

// POST /api/admin/level-caps/static-rules
export async function POST(req: Request) {
    try {
        const ruleData: Omit<StaticLevelCapRule, 'id' | 'createdAt' | 'createdBy'> = await req.json();

        // TODO: Get actual admin from auth
        const adminUser = 'admin';

        const newRule: StaticLevelCapRule = {
            ...ruleData,
            id: randomUUID(),
            createdBy: adminUser,
            createdAt: new Date()
        };

        const change = {
            timestamp: new Date(),
            admin: adminUser,
            action: 'create_static_rule',
            before: null,
            after: newRule,
            reason: `Created rule: ${newRule.name}`
        };

        await db.level_caps.updateOne(
            {},
            {
                $push: {
                    staticRules: newRule,
                    changeHistory: change
                },
                $set: {
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        // Clear cache when rules change
        await db.level_caps.updateOne(
            {},
            {
                $set: { playerCapCache: [] }
            }
        );

        return NextResponse.json({
            success: true,
            rule: newRule
        });
    } catch (error) {
        console.error('Error creating static rule:', error);
        return NextResponse.json(
            { success: false, error: 'Error al crear regla' },
            { status: 500 }
        );
    }
}
