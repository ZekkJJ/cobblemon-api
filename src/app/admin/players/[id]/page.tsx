'use client';
import { useState, useEffect } from 'react';

export default function PlayerInspectorPage({ params }: { params: { id: string } }) {
    const [player, setPlayer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadPlayer();
        // Auto-refresh every 5 seconds for "Live" feel
        const interval = setInterval(() => {
            loadPlayer(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [params.id]);

    async function loadPlayer(isRefresh = false) {
        if (!isRefresh) setLoading(true);
        else setRefreshing(true);

        try {
            // Fetch all and find (inefficient but works for now as we don't have single get by UUID with sync data)
            // Ideally we should have GET /api/players/sync/[uuid]
            // But let's assume we can fetch list or just query DB.
            // Actually, let's try to fetch specific user if API supported it, but for now filtering from list is safer given current API state.
            // Wait, I can't filter from list efficiently if list is huge.
            // I'll assume I need to fetch the list and find.
            const res = await fetch('/api/players/sync');
            const data = await res.json();
            if (Array.isArray(data)) {
                const found = data.find(p => p.uuid === params.id || p._id === params.id);
                if (found) setPlayer(found);
            }
        } catch (error) {
            console.error(error);
        }

        if (!isRefresh) setLoading(false);
        else setRefreshing(false);
    }

    async function toggleBan() {
        if (!player) return;
        const confirmMsg = player.banned
            ? `¿Desbanear a ${player.username}?`
            : `¿BANEAR a ${player.username}?`;

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch('/api/admin/ban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: player.uuid,
                    banned: !player.banned
                })
            });
            if (res.ok) {
                loadPlayer(true);
            } else {
                alert('Error al actualizar ban');
            }
        } catch (e) {
            alert('Error de conexión');
        }
    }

    if (loading && !player) return <div className="p-8 text-center">Cargando...</div>;
    if (!player) return <div className="p-8 text-center text-red-400">Jugador no encontrado</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <div className="flex items-center gap-4">
                    <img
                        src={`https://minotar.net/avatar/${player.username}/64`}
                        alt={player.username}
                        className="w-16 h-16 rounded-lg"
                    />
                    <div>
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            {player.username}
                            {refreshing && <i className="fas fa-sync fa-spin text-xs text-slate-500"></i>}
                        </h2>
                        <div className="text-slate-400 font-mono text-sm">{player.uuid}</div>
                        <div className="text-blue-400 text-sm mt-1">Discord: {player.discordUsername || 'No vinculado'}</div>
                    </div>
                </div>

                <button
                    onClick={toggleBan}
                    className={`px-6 py-2 rounded-lg font-bold transition-colors ${player.banned
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                >
                    {player.banned ? 'DESBANEAR' : 'BANEAR'}
                </button>
            </div>

            {/* Live Inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Main Inventory */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold border-b border-slate-800 pb-2">Inventario</h3>
                    <InventoryGrid items={player.inventory || []} slots={36} />
                </div>

                {/* Ender Chest */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold border-b border-slate-800 pb-2">Ender Chest</h3>
                    <InventoryGrid items={player.enderChest || []} slots={27} />
                </div>
            </div>

            {/* Pokemon Party */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold border-b border-slate-800 pb-2">Equipo Pokémon Actual</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {player.party?.map((p: any, i: number) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 p-3 rounded flex items-center gap-3">
                            <img
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.shiny ? 'shiny/' : ''}${p.speciesId}.png`}
                                alt={p.species}
                                className="w-12 h-12 pixelated"
                            />
                            <div>
                                <div className="font-bold capitalize text-green-400">
                                    {p.species} {p.shiny && '✨'}
                                </div>
                                <div className="text-xs text-slate-400">Nvl {p.level} • {p.nickname || 'Sin mote'}</div>
                            </div>
                        </div>
                    ))}
                    {(!player.party || player.party.length === 0) && (
                        <p className="text-slate-500">Sin equipo.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function InventoryGrid({ items, slots }: { items: any[], slots: number }) {
    // Determine rows (9 cols per row)
    const rows = Math.ceil(slots / 9);

    const renderSlot = (index: number) => {
        const item = items.find(i => i.slot === index);
        if (!item) return <div key={index} className="aspect-square bg-slate-800/50 border border-slate-700 rounded"></div>;

        return (
            <div key={index} className="aspect-square bg-slate-800 border border-slate-600 rounded relative group cursor-help">
                <div className="flex items-center justify-center h-full">
                    {/* Placeholder item icon - ideally we map ID to sprite */}
                    <div className="text-[10px] text-center break-words leading-tight px-0.5 text-slate-300">
                        {item.name}
                    </div>
                </div>
                {item.count > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 font-bold text-xs bg-black/50 px-1 rounded text-white">
                        {item.count}
                    </span>
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-xs p-2 rounded hidden group-hover:block z-50 whitespace-nowrap border border-slate-600">
                    <p className="font-bold text-blue-300">{item.name}</p>
                    <p className="text-slate-400">{item.id}</p>
                    {item.nbt && <p className="text-emerald-400 text-[10px] mt-1 italic">NBT Data Present</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-9 gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800 w-fit">
            {Array.from({ length: slots }).map((_, i) => renderSlot(i))}
        </div>
    );
}
