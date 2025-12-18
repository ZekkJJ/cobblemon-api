'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trophy, Award, ArrowRight, Trash2 } from 'lucide-react';

interface Match {
    matchId: string;
    position: { x: number; y: number };
    player1Id: string | null;
    player2Id: string | null;
    player1Score: number;
    player2Score: number;
    winnerId: string | null;
    isBye: boolean;
    status: 'pending' | 'active' | 'completed';
    nextMatchId: string | null;
}

interface Round {
    roundNumber: number;
    name: string;
    matches: Match[];
}

interface Tournament {
    _id: string;
    name: string;
    status: string;
    participants: Array<{ visitorId: string; seed: number; eliminated: boolean }>;
    rounds: Round[];
    bracketType: string;
    winnerId?: string;
}

interface Player {
    _id: string;
    nickname: string;
    discordUsername: string;
}

export default function TournamentBracketPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [players, setPlayers] = useState<{ [key: string]: Player }>({});
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [matchForm, setMatchForm] = useState({ p1Score: 0, p2Score: 0, winnerId: '' });

    useEffect(() => {
        loadTournament();
    }, [params.id]);

    async function loadTournament() {
        try {
            const [tournamentRes, playersRes] = await Promise.all([
                fetch(`/api/tournaments/${params.id}`),
                fetch('/api/users')
            ]);

            if (!tournamentRes.ok) {
                console.error('Tournament not found');
                setTournament(null);
                setLoading(false);
                return;
            }

            const tournamentData = await tournamentRes.json();
            const playersData = await playersRes.json();

            // Ensure rounds array exists
            if (!tournamentData.rounds) {
                tournamentData.rounds = [];
            }

            setTournament(tournamentData);

            // Create player lookup map
            const playerMap: { [key: string]: Player } = {};
            (playersData.users || []).forEach((p: Player) => {
                playerMap[p._id] = p;
            });
            setPlayers(playerMap);
        } catch (error) {
            console.error('Error loading tournament:', error);
        } finally {
            setLoading(false);
        }
    }

    function getPlayerName(id: string | null) {
        if (!id) return 'TBD';
        const player = players[id];
        return player ? (player.nickname || player.discordUsername) : 'Desconocido';
    }

    function openMatchModal(match: Match) {
        if (match.status === 'completed' || !match.player1Id || !match.player2Id) return;
        setSelectedMatch(match);
        setMatchForm({
            p1Score: match.player1Score,
            p2Score: match.player2Score,
            winnerId: match.winnerId || ''
        });
    }

    async function submitMatchResult() {
        if (!selectedMatch || !tournament) return;

        try {
            const res = await fetch('/api/tournament', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId: tournament._id,
                    action: 'setMatchResult',
                    data: {
                        matchId: selectedMatch.matchId,
                        winnerId: matchForm.winnerId,
                        player1Score: matchForm.p1Score,
                        player2Score: matchForm.p2Score
                    }
                })
            });

            if (res.ok) {
                setSelectedMatch(null);
                loadTournament();
            }
        } catch (error) {
            console.error('Error submitting result:', error);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-400">Torneo no encontrado</h2>
                <button
                    onClick={() => router.push('/admin/tournaments')}
                    className="mt-4 px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            {tournament.name}
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                            <span className={`px-3 py-1 rounded-full uppercase font-bold ${tournament.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                tournament.status === 'completed' ? 'bg-slate-700 text-slate-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {tournament.status}
                            </span>
                            <span>{tournament.participants.length} Participantes</span>
                            <span className="capitalize">{tournament.bracketType} Elimination</span>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/admin/tournaments')}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </div>

            {/* Bracket Visualization */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-8 overflow-x-auto">
                {!tournament.rounds || tournament.rounds.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🏆</div>
                        <h3 className="text-xl font-bold text-white mb-2">Bracket no generado</h3>
                        <p className="text-slate-400">
                            Este torneo aún no tiene un bracket creado.
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-12 min-w-max">
                        {tournament.rounds.map((round, roundIdx) => (
                        <div key={round.roundNumber} className="space-y-6">
                            {/* Round Header */}
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-bold text-white mb-1">{round.name}</h3>
                                <p className="text-sm text-slate-400">
                                    {round.matches.filter(m => m.status === 'completed').length}/{round.matches.length} Completados
                                </p>
                            </div>

                            {/* Matches */}
                            <div className="space-y-8">
                                {round.matches.map((match, matchIdx) => (
                                    <div
                                        key={match.matchId}
                                        className="relative"
                                        style={{
                                            marginTop: roundIdx > 0 ? `${matchIdx * (300 / round.matches.length)}px` : '0'
                                        }}
                                    >
                                        {/* Connector Line to Next Match */}
                                        {match.nextMatchId && roundIdx < tournament.rounds.length - 1 && (
                                            <div className="absolute left-full top-1/2 w-12 h-0.5 bg-slate-700">
                                                <ArrowRight className="absolute right-0 -top-2 w-5 h-5 text-slate-600" />
                                            </div>
                                        )}

                                        {/* Match Card */}
                                        <div
                                            onClick={() => openMatchModal(match)}
                                            className={`group border-2 rounded-xl overflow-hidden transition-all ${match.status === 'completed'
                                                ? 'border-green-500/30 bg-green-500/5'
                                                : match.player1Id && match.player2Id
                                                    ? 'border-blue-500/30 bg-blue-500/5 cursor-pointer hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20'
                                                    : 'border-slate-700 bg-slate-900/50'
                                                } w-80`}
                                        >
                                            {/* Player 1 */}
                                            <div className={`flex items-center justify-between p-4 border-b ${match.winnerId === match.player1Id
                                                ? 'bg-gradient-to-r from-green-500/20 to-transparent border-green-500/30'
                                                : 'border-slate-700'
                                                }`}>
                                                <div className="flex items-center gap-3 flex-1">
                                                    {match.winnerId === match.player1Id && (
                                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                                    )}
                                                    <span className={`font-semibold ${match.player1Id ? 'text-white' : 'text-slate-600'
                                                        }`}>
                                                        {getPlayerName(match.player1Id)}
                                                    </span>
                                                </div>
                                                {match.status === 'completed' && (
                                                    <span className="text-2xl font-bold text-white ml-2">
                                                        {match.player1Score}
                                                    </span>
                                                )}
                                            </div>

                                            {/* VS Divider */}
                                            <div className="bg-slate-800 py-1 text-center">
                                                <span className="text-xs font-bold text-slate-500">
                                                    {match.isBye ? 'BYE' : match.status === 'completed' ? 'FINAL' : 'VS'}
                                                </span>
                                            </div>

                                            {/* Player 2 */}
                                            <div className={`flex items-center justify-between p-4 ${match.winnerId === match.player2Id
                                                ? 'bg-gradient-to-r from-green-500/20 to-transparent'
                                                : ''
                                                }`}>
                                                <div className="flex items-center gap-3 flex-1">
                                                    {match.winnerId === match.player2Id && (
                                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                                    )}
                                                    <span className={`font-semibold ${match.player2Id ? 'text-white' : 'text-slate-600'
                                                        }`}>
                                                        {getPlayerName(match.player2Id)}
                                                    </span>
                                                </div>
                                                {match.status === 'completed' && (
                                                    <span className="text-2xl font-bold text-white ml-2">
                                                        {match.player2Score}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Match Status Indicator */}
                                        {!match.isBye && match.player1Id && match.player2Id && match.status !== 'completed' && (
                                            <div className="mt-2 text-xs text-center text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Click para registrar resultado
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    </div>
                )}

                {/* Final Winner */}
                {tournament.rounds && tournament.rounds.length > 0 && tournament.winnerId && (
                    <div className="mt-12 text-center p-8 bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border-2 border-yellow-500/50 rounded-xl">
                        <Award className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                        <h2 className="text-3xl font-bold text-white mb-2">¡Campeón!</h2>
                        <p className="text-xl text-yellow-400 font-bold">
                            {getPlayerName(tournament.winnerId)}
                        </p>
                    </div>
                )}
            </div>

            {/* Match Result Modal */}
            {selectedMatch && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Registrar Resultado</h3>
                            <button
                                onClick={() => setSelectedMatch(null)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Player 1 */}
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                <label className="block text-sm text-slate-400 mb-2">
                                    {getPlayerName(selectedMatch.player1Id)}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={matchForm.p1Score}
                                    onChange={(e) => setMatchForm({ ...matchForm, p1Score: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-2xl font-bold text-white text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            {/* Player 2 */}
                            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                <label className="block text-sm text-slate-400 mb-2">
                                    {getPlayerName(selectedMatch.player2Id)}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={matchForm.p2Score}
                                    onChange={(e) => setMatchForm({ ...matchForm, p2Score: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-2xl font-bold text-white text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            {/* Winner Selection */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Ganador</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setMatchForm({ ...matchForm, winnerId: selectedMatch.player1Id! })}
                                        className={`p-3 rounded-lg border-2 transition-all ${matchForm.winnerId === selectedMatch.player1Id
                                            ? 'border-green-500 bg-green-500/20 text-green-400'
                                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {getPlayerName(selectedMatch.player1Id)}
                                    </button>
                                    <button
                                        onClick={() => setMatchForm({ ...matchForm, winnerId: selectedMatch.player2Id! })}
                                        className={`p-3 rounded-lg border-2 transition-all ${matchForm.winnerId === selectedMatch.player2Id
                                            ? 'border-green-500 bg-green-500/20 text-green-400'
                                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {getPlayerName(selectedMatch.player2Id)}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={submitMatchResult}
                                disabled={!matchForm.winnerId}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-3 rounded-lg transition-all disabled:cursor-not-allowed"
                            >
                                Guardar Resultado
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
