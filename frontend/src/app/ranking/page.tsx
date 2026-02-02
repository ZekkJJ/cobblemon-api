'use client';

import { useState, useEffect, useCallback } from 'react';

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

interface StrongestPokemonEntry {
  rank: number;
  ownerUsername: string;
  ownerTotalPokemon: number;
  powerScoreDisplay: number;
  realStats: {
    level: number;
    ivs: {
      hp: number;
      attack: number;
      defense: number;
      spAttack: number;
      spDefense: number;
      speed: number;
      total: number;
    };
    evs: {
      hp: number;
      attack: number;
      defense: number;
      spAttack: number;
      spDefense: number;
      speed: number;
      total: number;
    };
    nature: string;
    shiny: boolean;
    friendship: number;
  };
  calculatedAt: string;
}

interface StrongestPokemonData {
  rankings: StrongestPokemonEntry[];
  totalAnalyzed: number;
  totalPlayers: number;
  lastCalculated: string;
  nextUpdate: string;
  grokAnalysis: string;
  calculationPrecision: string;
  currentLevelCap: number;
  timeUntilNextUpdate: {
    minutes: number;
    seconds: number;
  };
}

type TabType = 'cobbleDollars' | 'avgLevel' | 'shinies' | 'strongestPokemon';

export default function RankingPage() {
  const [leaderboards, setLeaderboards] = useState<Leaderboards | null>(null);
  const [strongestPokemon, setStrongestPokemon] = useState<StrongestPokemonData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('strongestPokemon');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [countdown, setCountdown] = useState({ minutes: 0, seconds: 0 });

  const loadLeaderboards = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
      if (!response.ok) throw new Error('Error loading rankings');

      const data = await response.json();
      setLeaderboards(data.leaderboards);
      setTotalPlayers(data.totalPlayers || 0);
    } catch (err) {
      console.error('Error loading leaderboards:', err);
    }
  }, []);

  const loadStrongestPokemon = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rankings/strongest-pokemon`);
      if (!response.ok) throw new Error('Error loading strongest Pokémon ranking');

      const data = await response.json();
      if (data.success) {
        setStrongestPokemon(data.data);
        setCountdown(data.data.timeUntilNextUpdate);
      }
    } catch (err) {
      console.error('Error loading strongest pokemon:', err);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadLeaderboards(), loadStrongestPokemon()]);
      setLoading(false);
    };
    loadAll();

    // Polling every 30 seconds for real-time data
    const pollInterval = setInterval(() => {
      loadLeaderboards();
      loadStrongestPokemon();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [loadLeaderboards, loadStrongestPokemon]);

  // Countdown timer
  useEffect(() => {
    if (activeTab !== 'strongestPokemon') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev.minutes === 0 && prev.seconds === 0) {
          loadStrongestPokemon();
          return prev;
        }

        if (prev.seconds === 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTab, loadStrongestPokemon]);

  const tabs = [
    { id: 'strongestPokemon' as TabType, label: 'Strongest Pokémon', icon: 'fa-bolt', color: 'text-poke-red' },
    { id: 'cobbleDollars' as TabType, label: 'Top CobbleDollars', icon: 'fa-coins', color: 'text-poke-yellow' },
    { id: 'avgLevel' as TabType, label: 'Top Avg Level', icon: 'fa-chart-line', color: 'text-poke-blue' },
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
            Level {entry.avgLevel}
          </span>
        );
      case 'shinies':
        return (
          <span className="text-purple-400 font-bold">
            <i className="fas fa-star mr-1"></i>
            {entry.shinyCount} shinies
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-blue border-t-transparent"></div>
          <p className="mt-4 text-xl">Loading rankings...</p>
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
          <button
            onClick={() => {
              loadLeaderboards();
              loadStrongestPokemon();
            }}
            className="btn-primary"
          >
            <i className="fas fa-redo mr-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  const currentLeaderboard = leaderboards?.[activeTab as keyof Leaderboards] || [];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-yellow">
            <i className="fas fa-trophy mr-3"></i>
            RANKING
          </h1>
          <p className="text-xl text-slate-300">The best trainers on the server</p>
          <p className="text-sm text-slate-400 mt-2">{totalPlayers} verified players</p>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-lg font-medium transition-all text-sm md:text-base ${activeTab === tab.id
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

        {/* Strongest Pokemon Tab */}
        {activeTab === 'strongestPokemon' && strongestPokemon && (
          <div className="max-w-4xl mx-auto">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                    <i className="fas fa-shield-alt"></i>
                    One Pokémon per Trainer
                  </h3>
                  <p className="text-sm text-slate-300 mt-1">
                    The strongest Pokémon of each player is shown. Species remains hidden.
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-xs text-slate-400">Next update in</div>
                  <div className="text-2xl font-mono font-bold text-poke-yellow">
                    {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>

            {/* Precision Badge */}
            <div className="text-center mb-6 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/30 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-bold">
                <i className="fas fa-level-up-alt"></i>
                Level Cap: {strongestPokemon.currentLevelCap}
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded-full text-emerald-400 text-sm">
                <i className="fas fa-calculator"></i>
                {strongestPokemon.calculationPrecision}
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-full text-blue-400 text-sm">
                <i className="fas fa-database"></i>
                {strongestPokemon.totalAnalyzed.toLocaleString()} Pokémon analyzed
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-full text-purple-400 text-sm">
                <i className="fas fa-users"></i>
                {strongestPokemon.totalPlayers} trainers
              </span>
            </div>

            {/* Grok AI Analysis */}
            {strongestPokemon.grokAnalysis && (
              <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-lg p-5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-robot text-purple-400"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-400 mb-2 flex items-center gap-2">
                      <span>Grok AI Analysis</span>
                      <span className="text-xs bg-purple-600/30 px-2 py-0.5 rounded">Updated every 5min</span>
                    </h3>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {strongestPokemon.grokAnalysis}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rankings List */}
            <div className="space-y-3">
              {strongestPokemon.rankings.map((entry) => {
                // Validate that realStats exists
                const stats = entry.realStats || {
                  level: 0,
                  ivs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, total: 0 },
                  evs: { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, total: 0 },
                  nature: 'Unknown',
                  shiny: false,
                  friendship: 0,
                };

                return (
                  <div
                    key={`${entry.ownerUsername}-${entry.rank}`}
                    className={`p-4 rounded-lg border ${getRankClass(entry.rank)} transition-all hover:scale-[1.01]`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="text-2xl font-bold w-12 text-center flex-shrink-0">{getRankIcon(entry.rank)}</div>

                      {/* Mystery Pokemon Silhouette */}
                      <div className="relative flex-shrink-0 w-16 h-16 flex items-center justify-center">
                        <div className="text-4xl text-slate-600">
                          <i className="fas fa-question"></i>
                        </div>
                        {stats.shiny && (
                          <div className="absolute -top-1 -right-1 text-yellow-400 text-xs">
                            <i className="fas fa-star"></i>
                          </div>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg truncate">{entry.ownerUsername}</span>
                          <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 text-xs rounded-full">
                            {entry.ownerTotalPokemon} Pokémon
                          </span>
                        </div>

                        {/* Real Stats */}
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="bg-slate-900/50 rounded px-2 py-1">
                            <span className="text-slate-400">Level:</span>
                            <span className="ml-1 text-white font-bold">{stats.level}</span>
                          </div>
                          <div className="bg-slate-900/50 rounded px-2 py-1">
                            <span className="text-green-400">IVs:</span>
                            <span className="ml-1 text-white font-bold">{stats.ivs.total}/186</span>
                          </div>
                          <div className="bg-slate-900/50 rounded px-2 py-1">
                            <span className="text-orange-400">EVs:</span>
                            <span className="ml-1 text-white font-bold">{stats.evs.total}/510</span>
                          </div>
                          <div className="bg-slate-900/50 rounded px-2 py-1">
                            <span className="text-purple-400">Nature:</span>
                            <span className="ml-1 text-white font-bold capitalize">{stats.nature}</span>
                          </div>
                        </div>

                        {/* Detailed IVs */}
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-500">
                          <span>HP:{stats.ivs.hp}</span>
                          <span>ATK:{stats.ivs.attack}</span>
                          <span>DEF:{stats.ivs.defense}</span>
                          <span>SPA:{stats.ivs.spAttack}</span>
                          <span>SPD:{stats.ivs.spDefense}</span>
                          <span>SPE:{stats.ivs.speed}</span>
                        </div>
                      </div>

                      {/* Power Score */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-slate-400 mb-1">Power Score</div>
                        <div className="text-xl font-bold text-poke-red">
                          <i className="fas fa-bolt mr-1"></i>
                          {entry.powerScoreDisplay.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 text-center text-xs text-slate-500">
              <i className="fas fa-info-circle mr-1"></i>
              Calculations use Decimal128 precision (18 decimals). Ranking updates every 5 minutes.
              Real-time data polling every 30 seconds.
            </div>
          </div>
        )}

        {/* Other Leaderboards */}
        {activeTab !== 'strongestPokemon' && (
          <div className="max-w-2xl mx-auto">
            {currentLeaderboard.length === 0 ? (
              <div className="card text-center py-12">
                <i className="fas fa-users-slash text-6xl text-slate-600 mb-4"></i>
                <p className="text-xl text-slate-400">No data available</p>
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
                      <div className="text-2xl font-bold w-12 text-center">{getRankIcon(entry.rank)}</div>

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
                        <div className="text-sm text-slate-400">{entry.totalPokemon} Pokémon captured</div>
                      </div>

                      {/* Stat Value */}
                      <div className="text-right">{getStatValue(entry, activeTab)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => {
              loadLeaderboards();
              loadStrongestPokemon();
            }}
            className="btn-secondary"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Rankings
          </button>
        </div>
      </div>
    </div>
  );
}
