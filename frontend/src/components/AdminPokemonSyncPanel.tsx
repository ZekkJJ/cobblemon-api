'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cobblemon-los-pitufos-backend.onrender.com';

interface PendingOperation {
  id: string;
  playerUuid: string;
  operation: 'ADD' | 'REMOVE';
  species?: string;
  pokemonUuid?: string;
  source: string;
  createdAt: string;
}

interface AdminPokemonSyncPanelProps {
  adminDiscordId: string;
}

export default function AdminPokemonSyncPanel({ adminDiscordId }: AdminPokemonSyncPanelProps) {
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add Pokemon form
  const [playerUuid, setPlayerUuid] = useState('');
  const [species, setSpecies] = useState('');
  const [level, setLevel] = useState(5);
  const [shiny, setShiny] = useState(false);
  const [nature, setNature] = useState('hardy');

  // Remove Pokemon form
  const [removePlayerUuid, setRemovePlayerUuid] = useState('');
  const [removePokemonUuid, setRemovePokemonUuid] = useState('');
  const [removeReason, setRemoveReason] = useState('');

  // Fetch queue status
  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pokemon-sync/queue-status`);
      if (response.ok) {
        const data = await response.json();
        setPendingOps(data.operations || []);
      }
    } catch (err) {
      console.error('Error fetching queue:', err);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPokemon = async () => {
    if (!playerUuid.trim() || !species.trim()) {
      setError('UUID del jugador y especie son requeridos');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/pokemon-sync/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminDiscordId,
          playerUuid: playerUuid.trim(),
          pokemon: {
            species: species.trim().toLowerCase(),
            level,
            shiny,
            nature,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al agregar Pokemon');
      }

      setSuccess(`Pokemon ${species} agregado a la cola. Se entregará cuando el jugador esté online.`);
      setSpecies('');
      setLevel(5);
      setShiny(false);
      fetchQueueStatus();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePokemon = async () => {
    if (!removePlayerUuid.trim() || !removePokemonUuid.trim()) {
      setError('UUID del jugador y UUID del Pokemon son requeridos');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/pokemon-sync/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminDiscordId,
          playerUuid: removePlayerUuid.trim(),
          pokemonUuid: removePokemonUuid.trim(),
          reason: removeReason.trim() || 'Removed by admin',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al remover Pokemon');
      }

      setSuccess('Pokemon agregado a la cola de eliminación. Se removerá cuando el jugador esté online.');
      setRemovePokemonUuid('');
      setRemoveReason('');
      fetchQueueStatus();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const natures = [
    'hardy', 'lonely', 'brave', 'adamant', 'naughty',
    'bold', 'docile', 'relaxed', 'impish', 'lax',
    'timid', 'hasty', 'serious', 'jolly', 'naive',
    'modest', 'mild', 'quiet', 'bashful', 'rash',
    'calm', 'gentle', 'sassy', 'careful', 'quirky',
  ];

  return (
    <div className="space-y-6">
      {/* Add Pokemon */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-plus-circle text-green-400"></i>
          Agregar Pokemon a Jugador
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">UUID del Jugador</label>
            <input
              type="text"
              value={playerUuid}
              onChange={(e) => setPlayerUuid(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Especie</label>
              <input
                type="text"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="pikachu, charizard, etc."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Nivel</label>
              <input
                type="number"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value) || 5)}
                min={1}
                max={100}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Naturaleza</label>
              <select
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {natures.map((n) => (
                  <option key={n} value={n}>
                    {n.charAt(0).toUpperCase() + n.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={shiny}
              onChange={(e) => setShiny(e.target.checked)}
              className="w-5 h-5 rounded accent-yellow-400"
            />
            <div>
              <span className="font-bold text-yellow-400">✨ Shiny</span>
              <p className="text-xs text-slate-400">El Pokemon será shiny</p>
            </div>
          </label>

          <button
            onClick={handleAddPokemon}
            disabled={loading || !playerUuid.trim() || !species.trim()}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-slate-600 disabled:to-slate-700 text-white disabled:text-slate-400 py-3 px-6 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Agregando...
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-2"></i>
                Agregar Pokemon
              </>
            )}
          </button>
        </div>
      </div>

      {/* Remove Pokemon */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-minus-circle text-red-400"></i>
          Remover Pokemon de Jugador
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">UUID del Jugador</label>
            <input
              type="text"
              value={removePlayerUuid}
              onChange={(e) => setRemovePlayerUuid(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">UUID del Pokemon</label>
            <input
              type="text"
              value={removePokemonUuid}
              onChange={(e) => setRemovePokemonUuid(e.target.value)}
              placeholder="UUID del Pokemon a remover (lo puedes ver en la DB)"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Razón (opcional)</label>
            <input
              type="text"
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              placeholder="Razón de la eliminación"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            onClick={handleRemovePokemon}
            disabled={loading || !removePlayerUuid.trim() || !removePokemonUuid.trim()}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-slate-600 disabled:to-slate-700 text-white disabled:text-slate-400 py-3 px-6 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Removiendo...
              </>
            ) : (
              <>
                <i className="fas fa-trash mr-2"></i>
                Remover Pokemon
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pending Operations Queue */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-clock text-blue-400"></i>
          Cola de Operaciones Pendientes
          <span className="text-sm font-normal text-slate-400 ml-2">
            ({pendingOps.length} pendientes)
          </span>
        </h2>

        {pendingOps.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No hay operaciones pendientes</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingOps.map((op) => (
              <div
                key={op.id}
                className={`p-3 rounded-lg border ${
                  op.operation === 'ADD'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={op.operation === 'ADD' ? 'text-green-400' : 'text-red-400'}>
                      {op.operation === 'ADD' ? '➕' : '➖'}
                    </span>
                    <span className="font-bold">
                      {op.operation === 'ADD' ? op.species : op.pokemonUuid?.slice(0, 8) + '...'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(op.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Jugador: {op.playerUuid.slice(0, 8)}... | Fuente: {op.source}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-start gap-2 text-sm text-slate-300">
            <i className="fas fa-info-circle text-blue-400 mt-0.5"></i>
            <div>
              <p>Las operaciones se ejecutan cuando el jugador está <strong>online</strong>.</p>
              <p className="mt-1 text-slate-400">El plugin hace polling cada 15 segundos.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
          <i className="fas fa-check-circle mr-2"></i>
          {success}
        </div>
      )}
    </div>
  );
}
