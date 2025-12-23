import { NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';
import crypto from 'crypto';

// GET /api/level-caps/version
export async function GET() {
    try {
        const doc = await db.level_caps.findOne({});

        if (!doc) {
            return NextResponse.json({
                success: true,
                version: '0',
                timestamp: new Date().toISOString()
            });
        }

        // Generate version hash based on configuration
        const versionData = {
            globalConfig: doc.globalConfig,
            staticRules: doc.staticRules,
            timeBasedRules: doc.timeBasedRules,
            updatedAt: doc.updatedAt
        };

        const version = crypto
            .createHash('md5')
            .update(JSON.stringify(versionData))
            .digest('hex')
            .substring(0, 8);

        return NextResponse.json({
            success: true,
            version,
            timestamp: doc.updatedAt || new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting level caps version:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener versión' },
            { status: 500 }
        );
    }
}
