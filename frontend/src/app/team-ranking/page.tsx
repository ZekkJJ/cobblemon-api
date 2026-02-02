'use client';

import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface TeamMember {
  slot: number;
  speciesName: string;
  speciesId: number;
  spriteUrl: string;
  staticSpriteUrl: string;
  level: number;
  ivTotal: number;
  evTotal: number;
  ivs: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  evs: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  nature: string;
  shiny: boolean;
  gender: string;
  ability: string;
  estimatedRole: string;
  powerContribution: number;
}

interface TypeCoverage {
  offensive: string[];
  defensive: string[];
  weaknesses: string[];
}

interface RoleDistribution {
  sweepers: number;
  tanks: number;
  wallBreakers: number;
  supports: number;
  pivots: number;
}

interface SynergyMetrics {
  typeBalance: number;
  offensiveCoverage: number;
  defensiveCoverage: number;
  roleBalance: number;
  speedControl: number;
  teamComposition: number;
  immunityBonus: number;
  teamSizeBonus: number;
  weaknessStackPenalty: number;
  overallSynergy: number;
}

interface ScoreBreakdown {
  baseScore: number;
  synergyScore: number;
  coverageScore: number;
  balanceScore: number;
  ivQuality: number;
  evTraining: number;
  shinyBonus: number;
  multiplierEffect: number;
}

interface TeamEntry {
  rank: number;
  ownerUsername: string;
  teamSize: number;
  totalScoreDisplay: number;
  synergyMultiplier: number;
  scoreBreakdown: ScoreBreakdown;
  teamAnalysis: {
    members: TeamMember[];
    typeCoverage: TypeCoverage;
    roleDistribution: RoleDistribution;
    avgLevel: number;
    avgIvs: number;
    avgEvs: number;
    shinyCount: number;
  };
  synergyMetrics: SynergyMetrics;
  calculatedAt: string;
}

interface TeamRankingData {
  rankings: TeamEntry[];
  totalTeamsAnalyzed: number;
  totalPlayersChecked: number;
  lastCalculated: string;
  nextUpdate: string;
  grokAnalysis: string;
  currentLevelCap: number;
  minimumTeamSize: number;
  timeUntilNextUpdate: {
    minutes: number;
    seconds: number;
  };
}

export default function TeamRankingPage() {
  const [data, setData] = useState<TeamRankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ minutes: 0, seconds: 0 });
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);

  const loadTeamRanking = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rankings/team`);
      if (!response.ok) throw new Error('Error loading team ranking');

      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setCountdown(result.data.timeUntilNextUpdate);
        setError(null);
      }
    } catch (err) {
      console.error('Error loading team ranking:', err);
      setError('Could not load team ranking');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamRanking();
    const interval = setInterval(loadTeamRanking, 30000);
    return () => clearInterval(interval);
  }, [loadTeamRanking]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev.minutes === 0 && prev.seconds === 0) {
          loadTeamRanking();
          return prev;
        }
        if (prev.seconds === 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loadTeamRanking]);

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

  const getSynergyColor = (value: number) => {
    if (value >= 80) return 'text-emerald-400';
    if (value >= 60) return 'text-green-400';
    if (value >= 40) return 'text-yellow-400';
    if (value >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Sweeper': return '⚡';
      case 'Tank': return '🛡️';
      case 'Wall': return '🧱';
      case 'Wallbreaker': return '💥';
      case 'Pivot': return '🔄';
      case 'Utility': return '🔧';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          <p className="mt-4 text-xl">Analyzing teams...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-6xl text-poke-red mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button onClick={loadTeamRanking} className="btn-primary">
            <i className="fas fa-redo mr-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
            <i className="fas fa-users mr-3"></i>
            TEAM RANKING
          </h1>
          <p className="text-xl text-slate-300">The most synergistic teams on the server</p>
          <p className="text-sm text-slate-400 mt-2">
            Minimum {data.minimumTeamSize} Pokémon in party to qualify
          </p>
        </div>

        {/* Stats Banner */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded-full text-yellow-400 text-sm">
                  <i className="fas fa-level-up-alt"></i>
                  Level Cap: {data.currentLevelCap}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full text-purple-400 text-sm">
                  <i className="fas fa-users"></i>
                  {data.totalTeamsAnalyzed} teams
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full text-blue-400 text-sm">
                  <i className="fas fa-user-check"></i>
                  {data.totalPlayersChecked} players
                </span>
              </div>
              <div className="text-center md:text-right">
                <div className="text-xs text-slate-400">Next update</div>
                <div className="text-2xl font-mono font-bold text-purple-400">
                  {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grok AI Analysis */}
        {data.grokAnalysis && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-brain text-white text-xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-purple-400 mb-2 flex items-center gap-2">
                    <span>AI Strategic Analysis</span>
                    <span className="text-xs bg-purple-600/30 px-2 py-0.5 rounded">Grok AI</span>
                  </h3>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2">
                    {data.grokAnalysis}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rankings List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {data.rankings.map((team) => (
            <div
              key={`${team.ownerUsername}-${team.rank}`}
              className={`rounded-lg border ${getRankClass(team.rank)} transition-all`}
            >
              {/* Main Row */}
              <div
                className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedTeam(expandedTeam === team.rank ? null : team.rank)}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="text-3xl font-bold w-14 text-center flex-shrink-0">
                    {getRankIcon(team.rank)}
                  </div>

                  {/* Team Pokemon Sprites */}
                  <div className="flex -space-x-1 flex-shrink-0">
                    {team.teamAnalysis.members.slice(0, 6).map((member, i) => (
                      <div
                        key={i}
                        className={`w-12 h-12 rounded-full bg-slate-800/80 border-2 ${member.shiny ? 'border-yellow-400 shadow-yellow-400/30 shadow-lg' : 'border-slate-600'
                          } flex items-center justify-center overflow-hidden relative group`}
                        title={`${member.speciesName || 'Pokemon'} - Lv.${member.level} ${member.shiny ? '✨' : ''}`}
                      >
                        <img
                          src={member.spriteUrl || member.staticSpriteUrl}
                          alt={member.speciesName || 'Pokemon'}
                          className="w-10 h-10 object-contain pixelated"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = member.staticSpriteUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.speciesId || 1}.png`;
                          }}
                        />
                        {member.shiny && (
                          <div className="absolute -top-1 -right-1 text-xs">✨</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg truncate">{team.ownerUsername}</span>
                      <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded-full">
                        {team.teamSize} Pokémon
                      </span>
                      {team.teamAnalysis.shinyCount > 0 && (
                        <span className="px-2 py-0.5 bg-yellow-600/30 text-yellow-300 text-xs rounded-full">
                          ✨ {team.teamAnalysis.shinyCount}
                        </span>
                      )}
                    </div>

                    {/* Synergy Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-400">Synergy:</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-32">
                        <div
                          className={`h-full ${team.synergyMetrics.overallSynergy >= 70
                            ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                            : team.synergyMetrics.overallSynergy >= 50
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                              : 'bg-gradient-to-r from-red-500 to-orange-400'
                            }`}
                          style={{ width: `${team.synergyMetrics.overallSynergy}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold ${getSynergyColor(team.synergyMetrics.overallSynergy)}`}>
                        {team.synergyMetrics.overallSynergy}%
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-400 mb-1">Total Score</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {(team.totalScoreDisplay || 0).toLocaleString()}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="flex-shrink-0">
                    <i className={`fas fa-chevron-${expandedTeam === team.rank ? 'up' : 'down'} text-slate-400`}></i>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTeam === team.rank && (
                <div className="border-t border-slate-700/50 p-4 bg-slate-900/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Synergy Metrics */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-bold text-purple-400 mb-3 flex items-center gap-2">
                        <i className="fas fa-chart-radar"></i>
                        Synergy Metrics
                        <span className="text-xs bg-purple-600/30 px-2 py-0.5 rounded ml-auto">
                          x{team.synergyMultiplier || 1} mult
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: 'Type Balance', value: team.synergyMetrics.typeBalance },
                          { label: 'Offensive Coverage', value: team.synergyMetrics.offensiveCoverage },
                          { label: 'Defensive Coverage', value: team.synergyMetrics.defensiveCoverage },
                          { label: 'Role Balance', value: team.synergyMetrics.roleBalance },
                          { label: 'Speed Control', value: team.synergyMetrics.speedControl || 0 },
                          { label: 'Composition', value: team.synergyMetrics.teamComposition || 0 },
                          { label: 'Immunities', value: team.synergyMetrics.immunityBonus || 0 },
                        ].map((metric) => (
                          <div key={metric.label} className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-32">{metric.label}</span>
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                style={{ width: `${metric.value}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-10 text-right ${getSynergyColor(metric.value)}`}>
                              {metric.value}%
                            </span>
                          </div>
                        ))}
                        {(team.synergyMetrics.weaknessStackPenalty || 0) < 0 && (
                          <div className="flex items-center gap-2 text-red-400">
                            <span className="text-xs w-32">⚠️ Penalty</span>
                            <span className="text-xs font-bold">{team.synergyMetrics.weaknessStackPenalty}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-bold text-pink-400 mb-3 flex items-center gap-2">
                        <i className="fas fa-calculator"></i>
                        Score Breakdown
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-900/50 rounded p-2">
                          <span className="text-slate-400">Base (30%)</span>
                          <div className="font-bold text-white">{(team.scoreBreakdown?.baseScore || 0).toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <span className="text-purple-400">+ Synergy</span>
                          <div className="font-bold text-purple-300">+{(team.scoreBreakdown?.synergyScore || 0).toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <span className="text-blue-400">+ Coverage</span>
                          <div className="font-bold text-blue-300">+{team.scoreBreakdown?.coverageScore || 0}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <span className="text-green-400">+ Balance</span>
                          <div className="font-bold text-green-300">+{team.scoreBreakdown?.balanceScore || 0}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <span className="text-emerald-400">+ IVs</span>
                          <div className="font-bold text-emerald-300">+{team.scoreBreakdown?.ivQuality || 0}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <span className="text-orange-400">+ EVs</span>
                          <div className="font-bold text-orange-300">+{team.scoreBreakdown?.evTraining || 0}</div>
                        </div>
                        {(team.scoreBreakdown?.shinyBonus || 0) > 0 && (
                          <div className="bg-yellow-900/30 rounded p-2">
                            <span className="text-yellow-400">✨ Shiny</span>
                            <div className="font-bold text-yellow-300">+{team.scoreBreakdown?.shinyBonus || 0}</div>
                          </div>
                        )}
                        {(team.scoreBreakdown?.multiplierEffect || 0) > 0 && (
                          <div className="bg-purple-900/30 rounded p-2">
                            <span className="text-purple-400">🚀 Multiplier</span>
                            <div className="font-bold text-purple-300">+{(team.scoreBreakdown?.multiplierEffect || 0).toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Role Distribution */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                        <i className="fas fa-users-cog"></i>
                        Role Distribution
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {team.teamAnalysis.roleDistribution.sweepers > 0 && (
                          <span className="px-3 py-1 bg-red-900/30 text-red-300 rounded-full text-sm">
                            ⚡ {team.teamAnalysis.roleDistribution.sweepers} Sweeper{team.teamAnalysis.roleDistribution.sweepers > 1 ? 's' : ''}
                          </span>
                        )}
                        {team.teamAnalysis.roleDistribution.tanks > 0 && (
                          <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-sm">
                            🛡️ {team.teamAnalysis.roleDistribution.tanks} Tank{team.teamAnalysis.roleDistribution.tanks > 1 ? 's' : ''}
                          </span>
                        )}
                        {team.teamAnalysis.roleDistribution.wallBreakers > 0 && (
                          <span className="px-3 py-1 bg-orange-900/30 text-orange-300 rounded-full text-sm">
                            💥 {team.teamAnalysis.roleDistribution.wallBreakers} Wallbreaker{team.teamAnalysis.roleDistribution.wallBreakers > 1 ? 's' : ''}
                          </span>
                        )}
                        {team.teamAnalysis.roleDistribution.supports > 0 && (
                          <span className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-sm">
                            🔧 {team.teamAnalysis.roleDistribution.supports} Support{team.teamAnalysis.roleDistribution.supports > 1 ? 's' : ''}
                          </span>
                        )}
                        {team.teamAnalysis.roleDistribution.pivots > 0 && (
                          <span className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm">
                            🔄 {team.teamAnalysis.roleDistribution.pivots} Pivot{team.teamAnalysis.roleDistribution.pivots > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team Stats */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                        <i className="fas fa-chart-bar"></i>
                        Team Stats
                      </h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-900/50 rounded p-2">
                          <div className="text-2xl font-bold text-white">{team.teamAnalysis.avgLevel}</div>
                          <div className="text-xs text-slate-400">Avg Level</div>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <div className="text-2xl font-bold text-green-400">{team.teamAnalysis.avgIvs}</div>
                          <div className="text-xs text-slate-400">Avg IVs</div>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <div className="text-2xl font-bold text-orange-400">{team.teamAnalysis.avgEvs}</div>
                          <div className="text-xs text-slate-400">Avg EVs</div>
                        </div>
                      </div>
                    </div>

                    {/* Weaknesses */}
                    {team.teamAnalysis.typeCoverage.weaknesses.length > 0 && (
                      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 md:col-span-2">
                        <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                          <i className="fas fa-exclamation-triangle"></i>
                          Shared Weaknesses
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {team.teamAnalysis.typeCoverage.weaknesses.map((type) => (
                            <span
                              key={type}
                              className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-sm capitalize"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-red-300/70 mt-2">
                          ⚠️ Multiple team members share these weaknesses
                        </p>
                      </div>
                    )}

                    {/* Team Members - Detailed View */}
                    <div className="md:col-span-2">
                      <h4 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <i className="fas fa-list"></i>
                        Team Members - Detailed Stats
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {team.teamAnalysis.members.map((member) => (
                          <div
                            key={member.slot}
                            className={`bg-slate-900/50 rounded-lg p-4 border ${member.shiny ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-slate-700/50'
                              }`}
                          >
                            {/* Header with Sprite */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {/* Animated Sprite */}
                                <div className={`w-16 h-16 rounded-lg bg-slate-800/80 border-2 ${member.shiny ? 'border-yellow-400 shadow-yellow-400/20 shadow-lg' : 'border-slate-600'
                                  } flex items-center justify-center overflow-hidden relative`}>
                                  <img
                                    src={member.spriteUrl || member.staticSpriteUrl}
                                    alt={member.speciesName || 'Pokemon'}
                                    className="w-14 h-14 object-contain pixelated"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = member.staticSpriteUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.speciesId || 1}.png`;
                                    }}
                                  />
                                  {member.shiny && (
                                    <div className="absolute -top-1 -right-1 text-sm">✨</div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-white capitalize">
                                    {member.speciesName || `Pokemon #${member.slot}`}
                                  </div>
                                  <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <span>{getRoleIcon(member.estimatedRole)}</span>
                                    <span>{member.estimatedRole}</span>
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {member.nature} • {member.ability || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg text-white">Lv.{member.level}</div>
                                {member.shiny && <div className="text-yellow-400 text-xs">✨ Shiny</div>}
                                {member.gender && member.gender !== 'Unknown' && (
                                  <div className={`text-xs ${member.gender === 'MALE' ? 'text-blue-400' : 'text-pink-400'}`}>
                                    {member.gender === 'MALE' ? '♂' : '♀'}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* IVs Detailed */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-green-400 font-bold">IVs: {member.ivTotal}/186</span>
                                <span className="text-slate-500">{Math.round((member.ivTotal / 186) * 100)}%</span>
                              </div>
                              <div className="grid grid-cols-6 gap-1 text-[10px]">
                                {member.ivs && (
                                  <>
                                    <div className="text-center">
                                      <div className="text-red-400">HP</div>
                                      <div className="font-bold">{member.ivs.hp}</div>
                                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-400" style={{ width: `${(member.ivs.hp / 31) * 100}%` }} />
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-orange-400">ATK</div>
                                      <div className="font-bold">{member.ivs.attack}</div>
                                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-400" style={{ width: `${(member.ivs.attack / 31) * 100}%` }} />
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-yellow-400">DEF</div>
                                      <div className="font-bold">{member.ivs.defense}</div>
                                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-400" style={{ width: `${(member.ivs.defense / 31) * 100}%` }} />
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-blue-400">SpA</div>
                                      <div className="font-bold">{member.ivs.spAttack}</div>
                                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400" style={{ width: `${(member.ivs.spAttack / 31) * 100}%` }} />
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-green-400">SpD</div>
                                      <div className="font-bold">{member.ivs.spDefense}</div>
                                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-400" style={{ width: `${(member.ivs.spDefense / 31) * 100}%` }} />
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-pink-400">SPE</div>
                                      <div className="font-bold">{member.ivs.speed}</div>
                                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-pink-400" style={{ width: `${(member.ivs.speed / 31) * 100}%` }} />
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* EVs Detailed */}
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-orange-400 font-bold">EVs: {member.evTotal}/510</span>
                                <span className="text-slate-500">{Math.round((member.evTotal / 510) * 100)}%</span>
                              </div>
                              <div className="grid grid-cols-6 gap-1 text-[10px]">
                                {member.evs && (
                                  <>
                                    <div className="text-center">
                                      <div className="font-bold">{member.evs.hp}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold">{member.evs.attack}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold">{member.evs.defense}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold">{member.evs.spAttack}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold">{member.evs.spDefense}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold">{member.evs.speed}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                              <span className="text-xs text-purple-400 capitalize">{member.nature}</span>
                              <span className="text-xs text-cyan-400">⚡ {member.powerContribution.toLocaleString()} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-8">
          <button onClick={loadTeamRanking} className="btn-secondary">
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Ranking
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <i className="fas fa-info-circle mr-1"></i>
          The analysis considers type synergy, role balance, offensive/defensive coverage, and stats quality.
          Updates every 5 minutes.
        </div>
      </div>
    </div>
  );
}
