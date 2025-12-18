'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ServerStatusData {
    online: boolean;
    players: {
        online: number;
        max: number;
    };
}

export default function ServerIndicator() {
    const [status, setStatus] = useState<ServerStatusData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/server-status');
                const data = await res.json();
                setStatus(data);
            } catch (e) {
                console.error('Failed to fetch server status:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 60000); // Every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <Link
            href="/servidor"
            className="flex items-center gap-1.5 sm:gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-emerald-500/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all group"
            title="Ver estado del servidor"
        >
            {/* Status Dot */}
            <div className={`w-2 h-2 rounded-full ${loading
                    ? 'bg-yellow-500 animate-pulse'
                    : status?.online
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                }`}></div>

            {/* Player Count or Status */}
            <span className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                {loading ? (
                    '...'
                ) : status?.online ? (
                    <>
                        <span className="text-emerald-400 font-bold">{status.players.online}</span>
                        <span className="text-gray-500 hidden xs:inline">/{status.players.max}</span>
                    </>
                ) : (
                    <span className="text-red-400">OFF</span>
                )}
            </span>

            {/* Server Icon */}
            <i className="fas fa-server text-[10px] sm:text-xs text-gray-500 group-hover:text-emerald-400 transition-colors hidden sm:inline"></i>
        </Link>
    );
}
