'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  LegendaryPool,
  POOL_LEGENDARIES,
  getLegendarySprite,
  formatMoney,
} from '@/lib/types/legendary-pool';

export default function AdminLegendaryPoolPanel() {
  const [pool, setPool] = useState<LegendaryPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [spawning, setSpawning] = useState(false);
  
  // Create form
  const [selectedPokemon, setSelectedPokemon] = useState('Rayquaza');
  const [targetLevel, setTargetLevel] = useState(100);
  const [customGoal, setCustomGoal] = useState('');
  const [durationDays, setDurationDays] = useState(7);

  const fetchPool = async () => {
    try {
      const res = await apiClient.get('/api/legendary-pool/active');
      if (res.success) {
        setPool(res.pool);
      }
    } catch (err) {
      console.error('Error fetching pool:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPool();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const legendary = POOL_LEGENDARIES.find(l => l.name === selectedPokemon);
      const baseGoal = 10000000;
      const goalAmount = customGoal ? parseInt(customGoal) : Math.round(baseGoal * (legendary?.goalMultiplier || 1));

      const res = await apiClient.post('/api/legendary-pool/create', {
        targetPokemon: selectedPokemon,
        targetLevel,
        goalAmount,
        durationDays,
      });

      if (res.success) {
        alert('Pool creado exitosamente!');
        fetchPool();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      console.error('Error creating pool:', err);
      alert('Error al crear pool');
    } finally {
      setCreating(false);
    }
  };

  const handleSpawn = async () => {
    if (!pool) return;
    if (!confirm('¿Estás seguro de spawner el legendario? Esto ejecutará el comando en el servidor.')) return;

    setSpawning(true);
    try {
      const res = await apiClient.post('/api/legendary-pool/spawn', {
        poolId: pool._id,
        spawnLocation: 'Estadio Principal',
        spawnedBy: 'Admin',
      });

      if (res.success) {
        alert(`Legendario spawneado!\n\nComando: ${res.spawnCommand}\n\nTop Contributor: ${res.topContributor?.username || 'N/A'}`);
        fetchPool();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      console.error('Error spawning:', err);
      alert('Error al spawner');
    } finally {
      setSpawning(false);
    }
  };

  const handleExpire = async () => {
    if (!pool) return;
    if (!confirm('¿Estás seguro de expirar el pool? Se devolverá el 80% a los contribuidores.')) return;

    try {
      const res = await apiClient.post('/api/legendary-pool/expire', {
        poolId: pool._id,
      });

      if (res.success) {
        alert('Pool expirado y reembolsos procesados');
        fetchPool();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      console.error('Error expiring:', err);
      alert('Error al expirar pool');
    }
  };

  if (loading) {
    return <div className="text-gray-400">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        🐉 Legendary Pool Admin
      </h2>

      {/* Current Pool Status */}
      {pool ? (
        <div className="bg-gray-800 rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-bold text-white mb-4">Pool Activo</h3>
          
          <div className="flex items-center gap-6">
            <img
              src={getLegendarySprite(pool.targetPokemon)}
              alt={pool.targetPokemon}
              className="w-24 h-24"
            />
            <div className="flex-1">
              <div className="text-2xl font-bold text-yellow-400">{pool.targetPokemon}</div>
              <div className="text-gray-400">Nivel {pool.targetLevel}</div>
              <div className="mt-2">
                <div className="text-sm text-gray-400">Progreso:</div>
                <div className="text-lg font-bold text-green-400">
                  {formatMoney(pool.currentAmount)} / {formatMoney(pool.goalAmount)} CD
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                    style={{ width: `${Math.min(100, parseFloat(pool.progress || '0'))}%` }}
                  />
                </div>
              </div>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm ${
                pool.status === 'active' ? 'bg-green-500/20 text-green-400' :
                pool.status === 'completed' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {pool.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-4">
            {pool.status === 'completed' && (
              <button
                onClick={handleSpawn}
                disabled={spawning}
                className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50"
              >
                {spawning ? 'Spawneando...' : '🎉 Spawner Legendario'}
              </button>
            )}
            {pool.status === 'active' && (
              <button
                onClick={handleExpire}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
              >
                ❌ Expirar Pool (Reembolsar 80%)
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 text-center">No hay pool activo</p>
        </div>
      )}

      {/* Create New Pool */}
      {!pool && (
        <div className="bg-gray-800 rounded-xl p-6 border border-green-500/30">
          <h3 className="text-lg font-bold text-white mb-4">Crear Nuevo Pool</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pokemon Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Pokémon Legendario</label>
              <select
                value={selectedPokemon}
                onChange={(e) => setSelectedPokemon(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              >
                {POOL_LEGENDARIES.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name} ({l.rarity}) - x{l.goalMultiplier} meta
                  </option>
                ))}
              </select>
              
              {/* Preview */}
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={getLegendarySprite(selectedPokemon)}
                  alt={selectedPokemon}
                  className="w-20 h-20"
                />
                <div>
                  <div className="font-bold text-white">{selectedPokemon}</div>
                  <div className="text-sm text-gray-400">
                    Meta base: {formatMoney(Math.round(10000000 * (POOL_LEGENDARIES.find(l => l.name === selectedPokemon)?.goalMultiplier || 1)))} CD
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nivel</label>
                <input
                  type="number"
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(parseInt(e.target.value) || 100)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  min={1}
                  max={100}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Meta Personalizada (opcional)</label>
                <input
                  type="number"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="Dejar vacío para usar meta base"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Duración (días)</label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 7)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  min={1}
                  max={30}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="mt-6 w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:from-green-400 hover:to-emerald-400 disabled:opacity-50"
          >
            {creating ? 'Creando...' : '🐉 Crear Pool Legendario'}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <h4 className="font-bold text-white mb-2">ℹ️ Información</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Las contribuciones se descuentan inmediatamente del balance del jugador</li>
          <li>• El dinero queda "bloqueado" y no se puede recuperar con /syncnow</li>
          <li>• Si el pool expira, se devuelve el 80% a cada contribuidor</li>
          <li>• El top contribuidor recibe +25% de probabilidad de captura</li>
          <li>• Usa el comando <code className="bg-gray-700 px-1 rounded">pokespawn [pokemon] level=[nivel]</code> para spawner</li>
        </ul>
      </div>
    </div>
  );
}
