'use client';

import { useState, useEffect } from 'react';

interface ServerStatusData {
    online: boolean;
    players: {
        online: number;
        max: number;
        list?: string[];
    };
    version?: string;
    motd?: string;
    icon?: string;
}

const SERVER_IP = 'cobblemon2.pals.army';

export default function ServerStatus() {
    const [status, setStatus] = useState<ServerStatusData | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPlayers, setShowPlayers] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/server-status');
                const data = await res.json();
                setStatus(data);
                setLastUpdate(new Date());
            } catch (e) {
                console.error('Failed to fetch server status:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const copyIP = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(SERVER_IP);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const playerPercentage = status?.players ? (status.players.online / status.players.max) * 100 : 0;

    return (
        <div className="w-full max-w-2xl mb-6">
            {/* Main Server Card */}
            <div className="relative group">
                {/* Glow effect behind card */}
                <div className={`absolute -inset-1 rounded-3xl blur-2xl opacity-50 transition-all duration-500 ${status?.online
                        ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 group-hover:opacity-75'
                        : 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500'
                    }`}></div>

                {/* Card */}
                <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 overflow-hidden backdrop-blur-sm shadow-2xl">

                    {/* Animated header bar */}
                    <div className={`h-2 ${status?.online
                            ? 'bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500'
                            : 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500'
                        }`}>
                        <div className="h-full w-1/3 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8">
                        {/* Header Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-6 mb-6">
                            <div className="flex items-center gap-5">
                                {/* Server Icon */}
                                <div className="relative">
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${status?.online
                                            ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30'
                                            : 'bg-gradient-to-br from-red-500/20 to-orange-600/20 border border-red-500/30'
                                        }`}>
                                        <img
                                            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                                            alt="Server"
                                            className="w-12 h-12 object-contain"
                                        />
                                    </div>
                                    {/* Status indicator */}
                                    <div className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-3 border-gray-900 flex items-center justify-center shadow-lg ${loading
                                            ? 'bg-yellow-500'
                                            : status?.online
                                                ? 'bg-emerald-500'
                                                : 'bg-red-500'
                                        }`}>
                                        {loading ? (
                                            <div className="w-2.5 h-2.5 border border-white/50 border-t-white rounded-full animate-spin"></div>
                                        ) : status?.online ? (
                                            <i className="fas fa-check text-[10px] text-white"></i>
                                        ) : (
                                            <i className="fas fa-times text-[10px] text-white"></i>
                                        )}
                                    </div>
                                </div>

                                {/* Server Info */}
                                <div>
                                    <h3 className="text-white font-bold text-2xl mb-1">Cobblemon</h3>
                                    <p className="text-gray-400 text-base mb-2">Los Pitufos</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${status?.online
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                            {loading ? 'Conectando...' : status?.online ? 'En línea' : 'Offline'}
                                        </span>
                                        {status?.version && (
                                            <span className="text-xs text-gray-500 font-mono">{status.version}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Live Player Count Badge */}
                            {status?.online && (
                                <button
                                    onClick={() => setShowPlayers(!showPlayers)}
                                    className="relative group/players w-full sm:w-auto"
                                >
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-50 blur group-hover/players:opacity-75 transition-opacity"></div>
                                    <div className="relative bg-gray-800 px-6 py-4 rounded-2xl border border-gray-600/50 flex items-center justify-center gap-3 hover:border-blue-500/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <i className="fas fa-users text-blue-400 text-lg"></i>
                                            <span className="text-white font-bold text-2xl">{status.players.online}</span>
                                        </div>
                                        <span className="text-gray-500 text-lg">/ {status.players.max}</span>
                                        {(status.players.list?.length || 0) > 0 && (
                                            <i className={`fas fa-chevron-down text-sm text-gray-400 transition-transform ${showPlayers ? 'rotate-180' : ''}`}></i>
                                        )}
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* Player Progress Bar */}
                        {status?.online && (
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-500 mb-2">
                                    <span className="font-medium">Capacidad del servidor</span>
                                    <span className="font-bold">{Math.round(playerPercentage)}%</span>
                                </div>
                                <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500 shadow-lg"
                                        style={{ width: `${Math.min(playerPercentage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Player List Dropdown */}
                        {showPlayers && status?.players?.list && status.players.list.length > 0 && (
                            <div className="mb-6 bg-gray-800/60 rounded-2xl p-5 border border-gray-700/50 animate-fadeIn">
                                <p className="text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 font-medium">
                                    <i className="fas fa-gamepad text-blue-400"></i>
                                    Jugadores conectados
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {status.players.list.map((player, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2.5 bg-gray-700/50 px-4 py-2.5 rounded-xl border border-gray-600/30 hover:border-purple-500/50 hover:bg-gray-700 transition-all"
                                        >
                                            <img
                                                src={`https://mc-heads.net/avatar/${player}/24`}
                                                alt={player}
                                                className="w-6 h-6 rounded"
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://mc-heads.net/avatar/steve/24'; }}
                                            />
                                            <span className="text-sm text-gray-200 font-medium">{player}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Server IP - Copyable */}
                        <button
                            onClick={copyIP}
                            className="w-full group/ip relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 opacity-0 group-hover/ip:opacity-100 transition-opacity rounded-2xl"></div>
                            <div className="relative bg-gray-800/80 hover:bg-transparent border border-gray-600/50 hover:border-emerald-400/50 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <i className="fas fa-network-wired text-emerald-400 text-lg"></i>
                                    </div>
                                    <div className="text-left min-w-0 flex-1">
                                        <p className="text-gray-400 group-hover/ip:text-emerald-100 text-xs uppercase tracking-wider transition-colors font-medium mb-1">IP del Servidor</p>
                                        <p className="text-white group-hover/ip:text-white font-mono font-bold text-lg sm:text-xl transition-colors truncate">{SERVER_IP}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-medium ${copied
                                        ? 'bg-emerald-500 text-white shadow-lg'
                                        : 'bg-gray-700/50 text-gray-400 group-hover/ip:bg-white/20 group-hover/ip:text-white'
                                    }`}>
                                    {copied ? (
                                        <>
                                            <i className="fas fa-check"></i>
                                            <span className="text-sm">¡Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-copy"></i>
                                            <span className="text-sm">Copiar</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </button>

                        {/* Last Update */}
                        {lastUpdate && (
                            <p className="text-center text-xs text-gray-600 mt-4">
                                <i className="fas fa-sync-alt mr-1.5"></i>
                                Actualizado: {lastUpdate.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Add shimmer animation */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
