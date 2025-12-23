import { NextResponse } from 'next/server';

// Force dynamic rendering - this route makes external API calls
export const dynamic = 'force-dynamic';

const MINECRAFT_SERVER = 'cobblemon2.pals.army';
const MINECRAFT_PORT = 25565;

interface ServerStatus {
    online: boolean;
    players: {
        online: number;
        max: number;
        list?: string[];
    };
    version?: string;
    motd?: string;
    icon?: string;
    error?: string;
    source?: string;
}

// Try multiple APIs for redundancy
async function tryMcSrvStat(): Promise<ServerStatus | null> {
    try {
        const response = await fetch(
            `https://api.mcsrvstat.us/3/${MINECRAFT_SERVER}`,
            {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' }
            }
        );

        if (!response.ok) return null;

        const data = await response.json();

        if (data.online) {
            return {
                online: true,
                players: {
                    online: data.players?.online || 0,
                    max: data.players?.max || 0,
                    list: data.players?.list || [],
                },
                version: data.version || 'Minecraft',
                motd: data.motd?.clean?.[0] || '',
                icon: data.icon || null,
                source: 'mcsrvstat',
            };
        }
        return null;
    } catch (e) {
        console.error('mcsrvstat error:', e);
        return null;
    }
}

async function tryMcStatus(): Promise<ServerStatus | null> {
    try {
        const response = await fetch(
            `https://api.mcstatus.io/v2/status/java/${MINECRAFT_SERVER}:${MINECRAFT_PORT}`,
            {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' }
            }
        );

        if (!response.ok) return null;

        const data = await response.json();

        if (data.online) {
            return {
                online: true,
                players: {
                    online: data.players?.online || 0,
                    max: data.players?.max || 0,
                    list: data.players?.list?.map((p: any) => p.name_clean || p.name_raw) || [],
                },
                version: data.version?.name_clean || data.version?.name_raw || 'Minecraft',
                motd: data.motd?.clean || '',
                icon: data.icon || null,
                source: 'mcstatus.io',
            };
        }
        return null;
    } catch (e) {
        console.error('mcstatus.io error:', e);
        return null;
    }
}

async function tryMinetools(): Promise<ServerStatus | null> {
    try {
        const response = await fetch(
            `https://api.minetools.eu/ping/${MINECRAFT_SERVER}/${MINECRAFT_PORT}`,
            {
                cache: 'no-store',
                headers: { 'Accept': 'application/json' }
            }
        );

        if (!response.ok) return null;

        const data = await response.json();

        if (data.players) {
            return {
                online: true,
                players: {
                    online: data.players?.online || 0,
                    max: data.players?.max || 0,
                    list: data.players?.sample?.map((p: any) => p.name) || [],
                },
                version: data.version?.name || 'Minecraft',
                motd: typeof data.description === 'string' ? data.description : (data.description?.text || ''),
                icon: data.favicon || null,
                source: 'minetools',
            };
        }
        return null;
    } catch (e) {
        console.error('minetools error:', e);
        return null;
    }
}

export async function GET() {
    try {
        // Try multiple APIs in parallel
        const results = await Promise.allSettled([
            tryMcStatus(),
            tryMcSrvStat(),
            tryMinetools(),
        ]);

        // Find first successful result
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value?.online) {
                return NextResponse.json(result.value);
            }
        }

        // All failed - return offline status
        return NextResponse.json({
            online: false,
            players: { online: 0, max: 0 },
            version: 'Cobblemon',
            motd: 'Los Pitufos',
            error: 'No se pudo verificar el estado del servidor',
        });
    } catch (error) {
        console.error('Server status error:', error);

        return NextResponse.json({
            online: false,
            players: { online: 0, max: 0 },
            error: 'Error de conexión',
        });
    }
}
