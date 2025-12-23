'use client';

import { useState, useEffect } from 'react';
import { playSound } from '@/src/lib/sounds';

interface ServerStatusData {
  online: boolean;
  players: {
    online: number;
    max: number;
  };
  version?: string;
  playerList?: string[];
  ip?: string;
}

export default function ServerStatus() {
  const [status, setStatus] = useState<ServerStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStatus();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/api/server-status`);
      if (!response.ok) throw new Error('Error al obtener estado del servidor');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyIP = () => {
    if (status?.ip) {
      navigator.clipboard.writeText(status.ip);
      setCopied(true);
      playSound('confirm');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const capacityPercent = status?.players ? (status.players.online / status.players.max) * 100 : 0;

  if (loading) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-poke-green border-t-transparent mb-4"></div>
          <p className="text-slate-400">Conectando al servidor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card max-w-2xl mx-auto border-poke-red/50">
        <div className="text-center py-8">
          <i className="fas fa-exclamation-triangle text-5xl text-poke-red mb-4"></i>
          <p className="text-slate-300 mb-4">No se pudo conectar al servidor</p>
          <button onClick={fetchStatus} className="btn-secondary">
            <i className="fas fa-redo mr-2"></i>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`card max-w-2xl mx-auto transition-all ${
      status?.online 
        ? 'border-poke-green/50 shadow-lg shadow-poke-green/20' 
        : 'border-poke-red/50 shadow-lg shadow-poke-red/20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`relative flex h-4 w-4 ${status?.online ? '' : 'opacity-50'}`}>
            {status?.online && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-poke-green opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-4 w-4 ${
              status?.online ? 'bg-poke-green' : 'bg-poke-red'
            }`}></span>
          </div>
          <h3 className="text-2xl font-bold">
            Estado del Servidor
          </h3>
        </div>
        <span className={`px-4 py-2 rounded-lg font-bold ${
          status?.online 
            ? 'bg-poke-green/20 text-poke-green' 
            : 'bg-poke-red/20 text-poke-red'
        }`}>
          {status?.online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {/* IP del Servidor */}
      {status?.ip && (
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">IP del Servidor</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-700/50 rounded-lg px-4 py-3 font-mono text-lg">
              {status.ip}
            </div>
            <button
              onClick={copyIP}
              className={`px-6 rounded-lg font-medium transition-all ${
                copied 
                  ? 'bg-poke-green text-white' 
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {/* Jugadores Online */}
      {status?.players && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Jugadores Conectados</span>
            <span className="text-xl font-bold">
              {status.players.online} / {status.players.max}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                capacityPercent > 80 
                  ? 'bg-poke-red' 
                  : capacityPercent > 50 
                    ? 'bg-poke-yellow' 
                    : 'bg-poke-green'
              }`}
              style={{ width: `${capacityPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Versión */}
      {status?.version && (
        <div className="mb-6">
          <span className="text-sm text-slate-400">Versión: </span>
          <span className="font-medium">{status.version}</span>
        </div>
      )}

      {/* Lista de Jugadores */}
      {status?.playerList && status.playerList.length > 0 && (
        <div>
          <h4 className="text-sm text-slate-400 mb-3">
            Jugadores en línea ({status.playerList.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {status.playerList.map((player, index) => (
              <span
                key={index}
                className="bg-slate-700/50 px-3 py-1 rounded-lg text-sm"
              >
                <i className="fas fa-user text-poke-green mr-2"></i>
                {player}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Última actualización */}
      <div className="mt-6 pt-4 border-t border-slate-700 text-center text-xs text-slate-500">
        <i className="fas fa-sync-alt mr-1"></i>
        Actualización automática cada 30 segundos
      </div>
    </div>
  );
}
