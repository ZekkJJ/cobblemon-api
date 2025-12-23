import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

// PUT /api/admin/level-caps/time-rules/[id]
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const updates = await request.json();

        const doc = await db.level_caps.findOne({});

        if (!doc) {
            return NextResponse.json(
                { success: false, error: 'No se encontró configuración' },
                { status: 404 }
            );
        }

        const ruleIndex = (doc.timeBasedRules || []).findIndex((r: any) => r.id === id);

        if (ruleIndex === -1) {
            return NextResponse.json(
                { success: false, error: 'Regla no encontrada' },
                { status: 404 }
            );
        }

        // Update rule
        const updatedRule = { ...doc.timeBasedRules[ruleIndex], ...updates };
        doc.timeBasedRules[ruleIndex] = updatedRule;

        // Log change
        const change = {
            type: 'time_rule_updated',
            ruleId: id,
            changes: updates,
            timestamp: new Date().toISOString(),
            user: 'admin' // TODO: Get from session
        };

        if (!doc.changeHistory) doc.changeHistory = [];
        doc.changeHistory.push(change);

        // Clear cache
        if (!doc.playerCapCache) doc.playerCapCache = {};
        doc.playerCapCache = {};

        // Update timestamp
        doc.updatedAt = new Date().toISOString();

        await db.level_caps.updateOne(
            {},
            { $set: doc },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            rule: updatedRule
        });
    } catch (error) {
        console.error('Error updating time rule:', error);
        return NextResponse.json(
            { success: false, error: 'Error al actualizar regla' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/level-caps/time-rules/[id]
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        const doc = await db.level_caps.findOne({});

        if (!doc) {
            return NextResponse.json(
                { success: false, error: 'No se encontró configuración' },
                { status: 404 }
            );
        }

        const originalLength = (doc.timeBasedRules || []).length;
        doc.timeBasedRules = (doc.timeBasedRules || []).filter((r: any) => r.id !== id);

        if (doc.timeBasedRules.length === originalLength) {
            return NextResponse.json(
                { success: false, error: 'Regla no encontrada' },
                { status: 404 }
            );
        }

        // Log change
        const change = {
            type: 'time_rule_deleted',
            ruleId: id,
            timestamp: new Date().toISOString(),
            user: 'admin'
        };

        if (!doc.changeHistory) doc.changeHistory = [];
        doc.changeHistory.push(change);

        // Clear cache
        if (!doc.playerCapCache) doc.playerCapCache = {};
        doc.playerCapCache = {};

        doc.updatedAt = new Date().toISOString();

        await db.level_caps.updateOne(
            {},
            { $set: doc },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting time rule:', error);
        return NextResponse.json(
            { success: false, error: 'Error al eliminar regla' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/level-caps/time-rules/[id] - Toggle active
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        const doc = await db.level_caps.findOne({});

        if (!doc) {
            return NextResponse.json(
                { success: false, error: 'No se encontró configuración' },
                { status: 404 }
            );
        }

        const rule = (doc.timeBasedRules || []).find((r: any) => r.id === id);

        if (!rule) {
            return NextResponse.json(
                { success: false, error: 'Regla no encontrada' },
                { status: 404 }
            );
        }

        const newActiveState = !rule.active;
        rule.active = newActiveState;

        // Log change
        const change = {
            type: 'time_rule_toggled',
            ruleId: id,
            newState: newActiveState,
            timestamp: new Date().toISOString(),
            user: 'admin'
        };

        if (!doc.changeHistory) doc.changeHistory = [];
        doc.changeHistory.push(change);

        // Clear cache
        if (!doc.playerCapCache) doc.playerCapCache = {};
        doc.playerCapCache = {};

        doc.updatedAt = new Date().toISOString();

        await db.level_caps.updateOne(
            {},
            { $set: doc },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            active: newActiveState
        });
    } catch (error) {
        console.error('Error toggling time rule:', error);
        return NextResponse.json(
            { success: false, error: 'Error al cambiar estado' },
            { status: 500 }
        );
    }
}
