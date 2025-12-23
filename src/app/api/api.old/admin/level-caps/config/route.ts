import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import type { LevelCapsDocument, GlobalLevelCapConfig } from '@/lib/types/level-caps';

// Initialize level caps document if it doesn't exist
async function ensureLevelCapsDocument() {
    const existing = await db.level_caps.findOne({});

    if (!existing) {
        const defaultDoc: Partial<LevelCapsDocument> = {
            globalConfig: {
                captureCapEnabled: true,
                ownershipCapEnabled: true,
                defaultCaptureCapFormula: '50', // Simple default: level 50
                defaultOwnershipCapFormula: '100', // Simple default: level 100
                enforcementMode: 'hard',
                customMessages: {
                    captureFailed: '§c¡El Pokémon es demasiado poderoso para capturarlo!',
                    expBlocked: '§eHa alcanzado el nivel máximo permitido.',
                    itemBlocked: '§cNo puedes usar este item. Tu Pokémon ya alcanzó el nivel máximo.',
                    tradeBlocked: '§cNo puedes recibir este Pokémon. Su nivel excede tu límite.'
                }
            },
            staticRules: [],
            timeBasedRules: [],
            changeHistory: [],
            playerCapCache: []
        };

        await db.level_caps.insertOne(defaultDoc);
        return defaultDoc;
    }

    return existing;
}

// GET /api/admin/level-caps/config
export async function GET() {
    try {
        const doc = await ensureLevelCapsDocument();

        return NextResponse.json({
            success: true,
            config: doc.globalConfig
        });
    } catch (error) {
        console.error('Error fetching level caps config:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener configuración' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/level-caps/config
export async function PUT(req: Request) {
    try {
        const newConfig: GlobalLevelCapConfig = await req.json();

        // TODO: Add authentication check here
        const adminUser = 'admin'; // Replace with actual auth

        const doc = await ensureLevelCapsDocument();

        // Save to history
        const change = {
            timestamp: new Date(),
            admin: adminUser,
            action: 'update_global_config',
            before: doc.globalConfig,
            after: newConfig,
            reason: 'Manual config update'
        };

        await db.level_caps.updateOne(
            {},
            {
                $set: {
                    globalConfig: newConfig,
                    updatedAt: new Date()
                },
                $push: {
                    changeHistory: change
                }
            }
        );

        return NextResponse.json({
            success: true,
            config: newConfig
        });
    } catch (error) {
        console.error('Error updating level caps config:', error);
        return NextResponse.json(
            { success: false, error: 'Error al actualizar configuración' },
            { status: 500 }
        );
    }
}
