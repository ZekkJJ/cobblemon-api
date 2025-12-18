import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

// PUT /api/admin/level-caps/static-rules/[id]
export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const updates = await req.json();

        const adminUser = 'admin'; // TODO: Get from auth

        const doc = await db.level_caps.findOne({});
        if (!doc) {
            return NextResponse.json(
                { success: false, error: 'No se encontró configuración' },
                { status: 404 }
            );
        }

        const ruleIndex = doc.staticRules?.findIndex((r: any) => r.id === id);
        if (ruleIndex === -1 || ruleIndex === undefined) {
            return NextResponse.json(
                { success: false, error: 'Regla no encontrada' },
                { status: 404 }
            );
        }

        const oldRule = doc.staticRules[ruleIndex];
        const updatedRule = { ...oldRule, ...updates };

        doc.staticRules[ruleIndex] = updatedRule;

        const change = {
            timestamp: new Date(),
            admin: adminUser,
            action: 'update_static_rule',
            before: oldRule,
            after: updatedRule,
            reason: `Updated rule: ${updatedRule.name}`
        };

        await db.level_caps.updateOne(
            {},
            {
                $set: {
                    staticRules: doc.staticRules,
                    updatedAt: new Date(),
                    playerCapCache: [] // Clear cache
                },
                $push: {
                    changeHistory: change
                }
            }
        );

        return NextResponse.json({
            success: true,
            rule: updatedRule
        });
    } catch (error) {
        console.error('Error updating static rule:', error);
        return NextResponse.json(
            { success: false, error: 'Error al actualizar regla' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/level-caps/static-rules/[id]
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const adminUser = 'admin'; // TODO: Get from auth

        const doc = await db.level_caps.findOne({});
        if (!doc) {
            return NextResponse.json(
                { success: false, error: 'No se encontró configuración' },
                { status: 404 }
            );
        }

        const rule = doc.staticRules?.find((r: any) => r.id === id);
        if (!rule) {
            return NextResponse.json(
                { success: false, error: 'Regla no encontrada' },
                { status: 404 }
            );
        }

        const change = {
            timestamp: new Date(),
            admin: adminUser,
            action: 'delete_static_rule',
            before: rule,
            after: null,
            reason: `Deleted rule: ${rule.name}`
        };

        await db.level_caps.updateOne(
            {},
            {
                $pull: {
                    staticRules: { id }
                },
                $push: {
                    changeHistory: change
                },
                $set: {
                    updatedAt: new Date(),
                    playerCapCache: []
                }
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting static rule:', error);
        return NextResponse.json(
            { success: false, error: 'Error al eliminar regla' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/level-caps/static-rules/[id]/toggle
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const adminUser = 'admin'; // TODO: Get from auth

        const doc = await db.level_caps.findOne({});
        if (!doc) {
            return NextResponse.json(
                { success: false, error: 'No se encontró configuración' },
                { status: 404 }
            );
        }

        const ruleIndex = doc.staticRules?.findIndex((r: any) => r.id === id);
        if (ruleIndex === -1 || ruleIndex === undefined) {
            return NextResponse.json(
                { success: false, error: 'Regla no encontrada' },
                { status: 404 }
            );
        }

        doc.staticRules[ruleIndex].active = !doc.staticRules[ruleIndex].active;

        const change = {
            timestamp: new Date(),
            admin: adminUser,
            action: 'toggle_static_rule',
            before: { active: !doc.staticRules[ruleIndex].active },
            after: { active: doc.staticRules[ruleIndex].active },
            reason: `Toggled rule: ${doc.staticRules[ruleIndex].name}`
        };

        await db.level_caps.updateOne(
            {},
            {
                $set: {
                    staticRules: doc.staticRules,
                    updatedAt: new Date(),
                    playerCapCache: []
                },
                $push: {
                    changeHistory: change
                }
            }
        );

        return NextResponse.json({
            success: true,
            active: doc.staticRules[ruleIndex].active
        });
    } catch (error) {
        console.error('Error toggling static rule:', error);
        return NextResponse.json(
            { success: false, error: 'Error al cambiar estado de regla' },
            { status: 500 }
        );
    }
}
