'use client';
import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Plus, Users, Trophy, Play, CheckCircle, Edit } from 'lucide-react';

interface Player {
    _id: string;
    nickname: string;
    discordUsername: string;
    minecraftUsername?: string;
}

interface Tournament {
    _id: string;
    name: string;
    status: 'draft' | 'active' | 'completed';
    participants: Array<{ visitorId: string; seed: number; }>;
    rounds: any[];
    bracketType: string;
    createdAt: string;
    winnerId?: string;
}

function PlayerCard({ player, onRemove }: { player: Player; onRemove?: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: player._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between group hover:border-blue-500/50 transition-all cursor-move"
        >
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div>
                    <p className="font-semibold text-white">{player.nickname || player.discordUsername}</p>
                    <p className="text-xs text-slate-400">{player.minecraftUsername || 'No conectado'}</p>
                </div>
            </div>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                >
                    <Trash2 className="w-4 h-4 text-red-400" />
                </button>
            )}
        </div>
    );
}

export default function AdminTournamentsPage() {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bracketType: 'single' as 'single' | 'double',
    });

    useEffect(() => {
        loadTournaments();
        loadPlayers();
    }, []);

    async function loadTournaments() {
        try {
            const res = await fetch('/api/tournament');
            const data = await res.json();
            setTournaments(data.tournaments || []);
        } catch (error) {
            console.error('Error loading tournaments:', error);
        }
    }

    async function loadPlayers() {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setAllPlayers(data.users || []);
        } catch (error) {
            console.error('Error loading players:', error);
        }
    }

    function togglePlayerSelection(player: Player) {
        if (selectedPlayers.find(p => p._id === player._id)) {
            setSelectedPlayers(selectedPlayers.filter(p => p._id !== player._id));
        } else {
            setSelectedPlayers([...selectedPlayers, player]);
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = selectedPlayers.findIndex(p => p._id === active.id);
        const newIndex = selectedPlayers.findIndex(p => p._id === over.id);

        const newOrder = [...selectedPlayers];
        const [movedItem] = newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, movedItem);
        setSelectedPlayers(newOrder);
    }

    async function createTournament() {
        if (!formData.name || selectedPlayers.length < 2) {
            alert('Necesitas un nombre y al menos 2 participantes');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/tournament', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    participantIds: selectedPlayers.map(p => p._id),
                    bracketType: formData.bracketType,
                    creatorId: 'admin'
                })
            });

            const data = await res.json();
            if (data.success) {
                alert('¡Torneo creado exitosamente!');
                setView('list');
                setFormData({ name: '', bracketType: 'single' });
                setSelectedPlayers([]);
                loadTournaments();
            } else {
                alert(data.error || 'Error al crear torneo');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear torneo');
        } finally {
            setLoading(false);
        }
    }

    async function updateTournamentStatus(id: string, status: string) {
        try {
            await fetch('/api/tournament', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: id,
                    action: 'updateStatus',
                    data: { status }
                })
            });
            loadTournaments();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    const filteredPlayers = allPlayers.filter(p =>
        (p.nickname || p.discordUsername || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.minecraftUsername || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (view === 'create') {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Crear Nuevo Torneo
                        </h2>
                        <p className="text-slate-400 mt-1">Configura tu torneo y selecciona participantes</p>
                    </div>
                    <button
                        onClick={() => setView('list')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Configuration Panel */}
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Configuración
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Nombre del Torneo</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ej: Copa de Campeones 2025"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Bracket</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setFormData({ ...formData, bracketType: 'single' })}
                                            className={`p-3 rounded-lg border-2 transition-all ${formData.bracketType === 'single'
                                                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                                : 'border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            Single Elimination
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, bracketType: 'double' })}
                                            className={`p-3 rounded-lg border-2 transition-all ${formData.bracketType === 'double'
                                                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                                : 'border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            Double Elimination
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-400">Participantes Seleccionados</span>
                                        <span className="text-2xl font-bold text-blue-400">{selectedPlayers.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                                style={{ width: `${Math.min((selectedPlayers.length / 32) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                        <span>Máx: 64</span>
                                    </div>
                                </div>

                                <button
                                    onClick={createTournament}
                                    disabled={loading || !formData.name || selectedPlayers.length < 2}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Creando...
                                        </>
                                    ) : (
                                        <>
                                            <Trophy className="w-5 h-5" />
                                            Crear Torneo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Selected Players (Draggable) */}
                        {selectedPlayers.length > 0 && (
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-green-500" />
                                        Orden de Seeds
                                    </span>
                                    <span className="text-sm text-slate-400">Arrastra para reordenar</span>
                                </h3>
                                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={selectedPlayers.map(p => p._id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                            {selectedPlayers.map((player, idx) => (
                                                <div key={player._id} className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-500 w-6">#{idx + 1}</span>
                                                    <div className="flex-1">
                                                        <PlayerCard
                                                            player={player}
                                                            onRemove={() => togglePlayerSelection(player)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}
                    </div>

                    {/* Player Selection Panel */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                Seleccionar Jugadores
                            </h3>
                            <span className="text-sm text-slate-400">{filteredPlayers.length} disponibles</span>
                        </div>

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 mb-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />

                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredPlayers.map(player => {
                                const isSelected = selectedPlayers.some(p => p._id === player._id);
                                return (
                                    <label
                                        key={player._id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => togglePlayerSelection(player)}
                                            className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">{player.nickname || player.discordUsername}</p>
                                            <p className="text-xs text-slate-400">{player.minecraftUsername || 'Sin Minecraft'}</p>
                                        </div>
                                    </label>
                                );
                            })}
                            {filteredPlayers.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    No se encontraron jugadores
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Torneos
                    </h2>
                    <p className="text-slate-400 mt-1">Gestiona y crea torneos competitivos</p>
                </div>
                <button
                    onClick={() => setView('create')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Crear Torneo
                </button>
            </div>

            <div className="grid gap-4">
                {tournaments.map(t => (
                    <div
                        key={t._id}
                        className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${t.status === 'active'
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                        : t.status === 'completed'
                                            ? 'bg-slate-700/50 text-slate-400'
                                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                        }`}>
                                        {t.status}
                                    </span>
                                    <h3 className="text-2xl font-bold text-white">{t.name}</h3>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {t.participants?.length || 0} participantes
                                    </span>
                                    <span>{t.rounds?.length || 0} rondas</span>
                                    <span className="capitalize">{t.bracketType} elimination</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {t.status === 'draft' && (
                                    <button
                                        onClick={() => updateTournamentStatus(t._id, 'active')}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Play className="w-4 h-4" />
                                        Iniciar
                                    </button>
                                )}
                                {t.status === 'active' && (
                                    <button
                                        onClick={() => updateTournamentStatus(t._id, 'completed')}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Finalizar
                                    </button>
                                )}
                                <button
                                    onClick={() => window.location.href = `/admin/tournaments/${t._id}`}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Trophy className="w-4 h-4" />
                                    Ver Bracket
                                </button>
                                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {tournaments.length === 0 && (
                    <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-slate-800">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-700" />
                        <h3 className="text-xl font-bold text-slate-400 mb-2">No hay torneos creados</h3>
                        <p className="text-slate-500 mb-6">Crea tu primer torneo para empezar</p>
                        <button
                            onClick={() => setView('create')}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-bold transition-all inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Crear Primer Torneo
                        </button>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(71, 85, 105, 0.5);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(71, 85, 105, 0.8);
                }
            `}</style>
        </div>
    );
}
