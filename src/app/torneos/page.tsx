'use client';
import { useEffect, useState } from 'react';
import { tournamentsAPI } from '@/lib/api-client';

export default function PublicTournamentsPage() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        tournamentsAPI.getAll()
            .then(data => {
                if (data && Array.isArray(data.tournaments)) {
                    setTournaments(data.tournaments);
                } else {
                    console.error('Tournaments API returned invalid data:', data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Tournaments fetch error:', err);
                setLoading(false);
            });
    }, []);

    const active = tournaments.filter(t => t.status === 'active');
    const upcoming = tournaments.filter(t => t.status === 'upcoming');
    const completed = tournaments.filter(t => t.status === 'completed');

    return (
        <div className="min-h-screen pt-20 px-8 pb-12 overflow-y-auto">
            <h1 className="text-4xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                Torneos y Eventos
            </h1>

            {/* Active */}
            {active.length > 0 && (
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        En Curso
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {active.map(t => <TournamentCard key={t._id} tournament={t} />)}
                    </div>
                </section>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 && (
                <section className="mb-16">
                    <h2 className="text-2xl font-bold mb-6 text-blue-400">Próximamente</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcoming.map(t => <TournamentCard key={t._id} tournament={t} />)}
                    </div>
                </section>
            )}

            {/* Completed */}
            <section>
                <h2 className="text-2xl font-bold mb-6 text-slate-500">Historial</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                    {completed.map(t => <TournamentCard key={t._id} tournament={t} />)}
                </div>
            </section>

            {!loading && tournaments.length === 0 && (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <p className="text-slate-400">No hay torneos programados por el momento.</p>
                </div>
            )}
        </div>
    );
}

function TournamentCard({ tournament }: { tournament: any }) {
    return (
        <div className={`
            rounded-xl p-6 border transition-all duration-300 hover:scale-105
            ${tournament.status === 'active'
                ? 'bg-gradient-to-br from-slate-900 to-green-900/20 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]'
                : tournament.status === 'upcoming'
                    ? 'bg-slate-900 border-blue-500/30'
                    : 'bg-slate-950 border-slate-800 grayscale'}
        `}>
            <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${tournament.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    tournament.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-700 text-slate-400'
                    }`}>
                    {tournament.status === 'active' ? 'Live' : tournament.status}
                </span>
                <span className="text-sm text-slate-400">
                    {new Date(tournament.startDate).toLocaleDateString()}
                </span>
            </div>

            <h3 className="text-xl font-bold mb-2">{tournament.title}</h3>
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>

            <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Participantes</span>
                    <span className="text-slate-300">{tournament.participants?.length || 0} / {tournament.maxParticipants}</span>
                </div>
                {tournament.prizes && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Premios</span>
                        <span className="text-yellow-400 truncate max-w-[60%]">{tournament.prizes}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
