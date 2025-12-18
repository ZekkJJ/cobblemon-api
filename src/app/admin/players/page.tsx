'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPlayersPage() {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadPlayers();
    }, []);

    async function loadPlayers() {
        setLoading(true);
        try {
            const res = await fetch('/api/players/sync'); // Reusing sync GET endpoint which lists all
            const data = await res.json();
            setPlayers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    }

    const filtered = players.filter(p =>
        p.username?.toLowerCase().includes(search.toLowerCase()) ||
        p.discordUsername?.toLowerCase().includes(search.toLowerCase()) ||
        p.uuid?.includes(search)
    );

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Gestión de Jugadores</h2>

            {/* Search */}
            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre, discord o UUID..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-4 py-2 text-white"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-400">
                        <tr>
                            <th className="p-4">Usuario</th>
                            <th className="p-4">Discord</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filtered.map(p => (
                            <tr key={p._id || p.uuid} className="hover:bg-slate-800/50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`https://minotar.net/avatar/${p.username}/32`}
                                            alt={p.username}
                                            className="w-8 h-8 rounded"
                                        />
                                        <div>
                                            <div className="font-bold">{p.username}</div>
                                            <div className="text-xs text-slate-500">{p.uuid}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-300">{p.discordUsername || 'No vinculado'}</td>
                                <td className="p-4">
                                    {p.banned ? (
                                        <span className="px-2 py-1 bg-red-900 text-red-300 rounded text-xs font-bold">BANEADO</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs font-bold">ACTIVO</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <Link
                                        href={`/admin/players/${p.uuid || p._id}`}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white"
                                    >
                                        Inspeccionar
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && !loading && (
                    <div className="p-8 text-center text-slate-500">No se encontraron jugadores</div>
                )}
            </div>
        </div>
    );
}
