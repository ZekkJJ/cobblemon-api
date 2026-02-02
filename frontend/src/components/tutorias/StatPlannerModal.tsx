'use client';

import { useState, useEffect } from 'react';
import { PokemonWithCalculations, PokemonStats, EVPlan } from '@/lib/types/tutorias';

interface StatPlannerModalProps {
  pokemon: PokemonWithCalculations;
  onClose: () => void;
  onSave: (plan: { pokemonUuid: string; pokemonSpecies: string; evDistribution: PokemonStats }) => Promise<void>;
}

// Nature modifiers
const NATURE_MODIFIERS: Record<string, { boost: keyof PokemonStats | null; reduce: keyof PokemonStats | null }> = {
  'Hardy': { boost: null, reduce: null },
  'Lonely': { boost: 'attack', reduce: 'defense' },
  'Brave': { boost: 'attack', reduce: 'speed' },
  'Adamant': { boost: 'attack', reduce: 'specialAttack' },
  'Naughty': { boost: 'attack', reduce: 'specialDefense' },
  'Bold': { boost: 'defense', reduce: 'attack' },
  'Docile': { boost: null, reduce: null },
  'Relaxed': { boost: 'defense', reduce: 'speed' },
  'Impish': { boost: 'defense', reduce: 'specialAttack' },
  'Lax': { boost: 'defense', reduce: 'specialDefense' },
  'Timid': { boost: 'speed', reduce: 'attack' },
  'Hasty': { boost: 'speed', reduce: 'defense' },
  'Serious': { boost: null, reduce: null },
  'Jolly': { boost: 'speed', reduce: 'specialAttack' },
  'Naive': { boost: 'speed', reduce: 'specialDefense' },
  'Modest': { boost: 'specialAttack', reduce: 'attack' },
  'Mild': { boost: 'specialAttack', reduce: 'defense' },
  'Quiet': { boost: 'specialAttack', reduce: 'speed' },
  'Bashful': { boost: null, reduce: null },
  'Rash': { boost: 'specialAttack', reduce: 'specialDefense' },
  'Calm': { boost: 'specialDefense', reduce: 'attack' },
  'Gentle': { boost: 'specialDefense', reduce: 'defense' },
  'Sassy': { boost: 'specialDefense', reduce: 'speed' },
  'Careful': { boost: 'specialDefense', reduce: 'specialAttack' },
  'Quirky': { boost: null, reduce: null },
};

// Base stats for common Pokemon (simplified - in real app would come from API)
const BASE_STATS: Record<string, PokemonStats> = {
  'default': { hp: 80, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 80 }
};

export default function StatPlannerModal({ pokemon, onClose, onSave }: StatPlannerModalProps) {
  const [evs, setEvs] = useState<PokemonStats>({ ...pokemon.evs });
  const [saving, setSaving] = useState(false);
  const [previewLevel, setPreviewLevel] = useState<50 | 100>(50);

  const totalEvs = Object.values(evs).reduce((sum, v) => sum + v, 0);
  const remainingEvs = 510 - totalEvs;

  const getNatureModifier = (stat: keyof PokemonStats): number => {
    const nature = NATURE_MODIFIERS[pokemon.nature] || { boost: null, reduce: null };
    if (nature.boost === stat) return 1.1;
    if (nature.reduce === stat) return 0.9;
    return 1.0;
  };

  const calculateStat = (
    stat: keyof PokemonStats,
    level: number,
    baseStat: number = 80
  ): number => {
    const iv = pokemon.ivs[stat];
    const ev = evs[stat];
    
    if (stat === 'hp') {
      // HP formula
      return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    } else {
      // Other stats formula
      const base = Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + 5;
      return Math.floor(base * getNatureModifier(stat));
    }
  };

  const handleEvChange = (stat: keyof PokemonStats, value: number) => {
    const newValue = Math.max(0, Math.min(252, value));
    const newTotal = totalEvs - evs[stat] + newValue;
    
    if (newTotal <= 510) {
      setEvs(prev => ({ ...prev, [stat]: newValue }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        pokemonUuid: pokemon.uuid,
        pokemonSpecies: pokemon.species,
        evDistribution: evs
      });
    } finally {
      setSaving(false);
    }
  };

  const presets = [
    { name: 'Physical Sweeper', evs: { hp: 0, attack: 252, defense: 0, specialAttack: 0, specialDefense: 4, speed: 252 } },
    { name: 'Special Sweeper', evs: { hp: 0, attack: 0, defense: 0, specialAttack: 252, specialDefense: 4, speed: 252 } },
    { name: 'Physical Tank', evs: { hp: 252, attack: 0, defense: 252, specialAttack: 0, specialDefense: 4, speed: 0 } },
    { name: 'Special Tank', evs: { hp: 252, attack: 0, defense: 4, specialAttack: 0, specialDefense: 252, speed: 0 } },
    { name: 'Balanced', evs: { hp: 84, attack: 84, defense: 84, specialAttack: 84, specialDefense: 84, speed: 84 } },
  ];

  const statLabels: Record<keyof PokemonStats, string> = {
    hp: 'HP',
    attack: 'Ataque',
    defense: 'Defensa',
    specialAttack: 'At. Esp.',
    specialDefense: 'Def. Esp.',
    speed: 'Velocidad'
  };

  const getNatureIndicator = (stat: keyof PokemonStats) => {
    const nature = NATURE_MODIFIERS[pokemon.nature];
    if (!nature) return null;
    if (nature.boost === stat) return <span className="text-green-400 text-xs ml-1">↑</span>;
    if (nature.reduce === stat) return <span className="text-red-400 text-xs ml-1">↓</span>;
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">📊 Planificador de EVs</h2>
            <p className="text-gray-400 text-sm">{pokemon.species} • {pokemon.nature}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="p-4 space-y-6">
          {/* EV Budget */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">EVs Usados</span>
              <span className={`font-bold ${remainingEvs < 0 ? 'text-red-400' : remainingEvs === 0 ? 'text-green-400' : 'text-white'}`}>
                {totalEvs}/510
              </span>
            </div>
            <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${totalEvs > 510 ? 'bg-red-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.min(100, (totalEvs / 510) * 100)}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              {remainingEvs > 0 ? `${remainingEvs} EVs restantes` : remainingEvs === 0 ? 'Distribución completa' : 'Exceso de EVs'}
            </p>
          </div>

          {/* Presets */}
          <div>
            <p className="text-gray-400 text-sm mb-2">Presets rápidos:</p>
            <div className="flex flex-wrap gap-2">
              {presets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => setEvs(preset.evs as PokemonStats)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                >
                  {preset.name}
                </button>
              ))}
              <button
                onClick={() => setEvs({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 })}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* EV Sliders */}
          <div className="space-y-4">
            {(Object.keys(evs) as Array<keyof PokemonStats>).map(stat => (
              <div key={stat} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm flex items-center">
                    {statLabels[stat]}
                    {getNatureIndicator(stat)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">IV: {pokemon.ivs[stat]}</span>
                    <input
                      type="number"
                      min={0}
                      max={252}
                      value={evs[stat]}
                      onChange={(e) => handleEvChange(stat, parseInt(e.target.value) || 0)}
                      className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm text-center"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={252}
                  step={4}
                  value={evs[stat]}
                  onChange={(e) => handleEvChange(stat, parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            ))}
          </div>

          {/* Stat Preview */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">Stats Proyectados</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewLevel(50)}
                  className={`px-3 py-1 rounded text-sm ${previewLevel === 50 ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                >
                  Lv.50
                </button>
                <button
                  onClick={() => setPreviewLevel(100)}
                  className={`px-3 py-1 rounded text-sm ${previewLevel === 100 ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                >
                  Lv.100
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(evs) as Array<keyof PokemonStats>).map(stat => {
                const calculatedStat = calculateStat(stat, previewLevel);
                return (
                  <div key={stat} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2">
                    <span className="text-gray-400 text-sm flex items-center">
                      {statLabels[stat]}
                      {getNatureIndicator(stat)}
                    </span>
                    <span className="text-white font-bold">{calculatedStat}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || totalEvs > 510}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
              {saving ? '⏳ Guardando...' : '💾 Guardar Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
