'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface LeaderboardEntry {
  rank: number;
  uuid: string;
  username: string;
  cobbleDollars: number;
  avgLevel: number;
  shinyCount: number;
  totalPokemon: number;
  online: boolean;
}

interface Leaderboards {
  cobbleDollars: LeaderboardEntry[];
  avgLevel: LeaderboardEntry[];
  shinies: LeaderboardEntry[];
}

type TabType = 'cobbleDollars' | 'avgLevel' | 'shinies';

export default function RankingPage() {
  const [leaderboards, setLeaderboards] = useState<Leaderboards | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('cobbleDollars');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
      if (!response.ok) throw new Error('Error al cargar rankings');
      
      const data = await response.json();
      setLeaderboards(data.leaderboards);
      setTotalPlayers(data.totalPlayers || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'cobbleDollars' as TabType, label: 'Top CobbleDollars', icon: 'fa-coins', color: 'text-poke-yellow' },
    { id: 'avgLevel' as TabType, label: 'Top Nivel Promedio', icon: 'fa-chart-line', color: 'text-poke-blue' },
    { id: 'shinies' as TabType, label: 'Top Shinies', icon: 'fa-star', color: 'text-purple-400' },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-600/30 to-yellow-500/10 border-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-slate-400/30 to-slate-300/10 border-slate-400/50';
    if (rank === 3) return 'bg-gradient-to-r from-amber-700/30 to-amber-600/10 border-amber-600/50';
    return 'bg-slate-800/50 border-slate-700/50';
  };

  const getStatValue = (entry: LeaderboardEntry, tab: TabType) => {
    switch (tab) {
      case 'cobbleDollars':
        return (
          <span className="text-poke-yellow font-bold">
            <i className="fas fa-coins mr-1"></i>
            {entry.cobbleDollars.toLocaleString()}
          </span>
        );
      case 'avgLevel':
        return (
          <span className="text-poke-blue font-bold">
            <i className="fas fa-chart-line mr-1"></i>
            Nivel {entry.avgLevel}
          </span>
        );
      case 'shinies':
        return (
          <span className="text-purple-400 font-bold">
            <i className="fas fa-star mr-1"></i>
            {entry.shinyCount} shinies
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-blue border-t-transparent"></div>
          <p className="mt-4 text-xl">Cargando rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-poke-red mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button onClick={loadLeaderboards} className="btn-primary">
            <i className="fas fa-redo mr-2"></i>Reintentar
          </button>
        </div>
      </div>
    );
  }

  const currentLeaderboard = leaderboards?.[activeTab] || [];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-yellow">
            <i className="fas fa-trophy mr-3"></i>
            RANKING
          </h1>
          <p className="text-xl text-slate-300">
            Los mejores entrenadores del servidor
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {totalPlayers} jugadores verificados
          </p>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? `bg-slate-700 ${tab.color} border-2 border-current`
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="max-w-2xl mx-auto">
          {currentLeaderboard.length === 0 ? (
            <div className="card text-center py-12">
              <i className="fas fa-users-slash text-6xl text-slate-600 mb-4"></i>
              <p className="text-xl text-slate-400">No hay datos disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentLeaderboard.map((entry) => (
                <div
                  key={entry.uuid}
                  className={`p-4 rounded-lg border ${getRankClass(entry.rank)} transition-all hover:scale-[1.02]`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="text-2xl font-bold w-12 text-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{entry.username}</span>
                        {entry.online && (
                          <span className="px-2 py-0.5 bg-poke-green/20 text-poke-green text-xs rounded-full">
                            <i className="fas fa-circle text-[8px] mr-1"></i>
                            Online
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {entry.totalPokemon} Pokémon capturados
                      </div>
                    </div>

                    {/* Stat Value */}
                    <div className="text-right">
                      {getStatValue(entry, activeTab)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={loadLeaderboards}
            className="btn-secondary"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Actualizar Rankings
          </button>
        </div>
      </div>
    </div>
  );
}
