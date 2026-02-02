'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cobblemon-los-pitufos-backend.onrender.com';

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'event';
  createdAt: string;
  expiresAt: string;
  durationMinutes: number;
  sendInGame?: boolean;
}

interface AdminAnnouncementPanelProps {
  adminDiscordId: string;
}

export default function AdminAnnouncementPanel({ adminDiscordId }: AdminAnnouncementPanelProps) {
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState(5);
  const [type, setType] = useState<'info' | 'warning' | 'success' | 'event'>('info');
  const [sendInGame, setSendInGame] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // In-game only announcement
  const [inGameMessage, setInGameMessage] = useState('');
  const [inGameTitle, setInGameTitle] = useState('📢 Anuncio');
  const [inGameType, setInGameType] = useState<'info' | 'warning' | 'success' | 'event'>('info');
  const [inGameLoading, setInGameLoading] = useState(false);

  // Fetch current active announcement
  const fetchActiveAnnouncement = async () => {
    try {
      const response = await fetch(`${API_URL}/api/announcements/active`);
      if (response.ok) {
        const data = await response.json();
        setActiveAnnouncement(data.announcement);
      }
    } catch (err) {
      console.error('Error fetching announcement:', err);
    }
  };

  useEffect(() => {
    fetchActiveAnnouncement();
    const interval = setInterval(fetchActiveAnnouncement, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    if (!message.trim()) {
      setError('El mensaje es requerido');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          durationMinutes: duration,
          type,
          adminDiscordId,
          sendInGame,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear anuncio');
      }

      const data = await response.json();
      setActiveAnnouncement(data.announcement);
      setMessage('');
      setSendInGame(false);
      setSuccess(`¡Anuncio creado!${sendInGame ? ' También se enviará in-game.' : ''}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/announcements`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminDiscordId }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar anuncio');
      }

      setActiveAnnouncement(null);
      setSuccess('Anuncio eliminado');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Send in-game only announcement
  const handleSendInGame = async () => {
    if (!inGameMessage.trim()) {
      setError('El mensaje es requerido');
      return;
    }

    setInGameLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/announcements/ingame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inGameMessage.trim(),
          title: inGameTitle.trim() || '📢 Anuncio',
          type: inGameType,
          adminDiscordId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al enviar anuncio');
      }

      setInGameMessage('');
      setSuccess('¡Anuncio enviado al servidor! Aparecerá en el chat de todos los jugadores online.');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setInGameLoading(false);
    }
  };

  const typeOptions = [
    { value: 'info', label: 'Información', icon: 'fa-info-circle', color: 'text-blue-400' },
    { value: 'warning', label: 'Advertencia', icon: 'fa-exclamation-triangle', color: 'text-yellow-400' },
    { value: 'success', label: 'Éxito', icon: 'fa-check-circle', color: 'text-green-400' },
    { value: 'event', label: 'Evento', icon: 'fa-star', color: 'text-purple-400' },
  ];

  const durationOptions = [
    { value: 1, label: '1 minuto' },
    { value: 5, label: '5 minutos' },
    { value: 10, label: '10 minutos' },
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 360, label: '6 horas' },
    { value: 720, label: '12 horas' },
    { value: 1440, label: '24 horas' },
  ];

  // Calculate time remaining for active announcement
  const getTimeRemaining = () => {
    if (!activeAnnouncement) return null;
    const now = new Date();
    const expires = new Date(activeAnnouncement.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Web Ticker Announcements */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-bullhorn text-poke-yellow"></i>
          Anuncios Web (Ticker)
        </h2>

        {/* Active Announcement */}
        {activeAnnouncement && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-green-400 flex items-center gap-2">
                <i className="fas fa-broadcast-tower animate-pulse"></i>
                Anuncio Activo
              </h3>
              <span className="text-sm text-slate-400">
                Expira en: {getTimeRemaining()}
              </span>
            </div>
            <p className="text-white mb-3">{activeAnnouncement.message}</p>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${typeOptions.find(t => t.value === activeAnnouncement.type)?.color}`}>
                <i className={`fas ${typeOptions.find(t => t.value === activeAnnouncement.type)?.icon} mr-1`}></i>
                {typeOptions.find(t => t.value === activeAnnouncement.type)?.label}
              </span>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 px-3 py-1 rounded text-sm font-bold"
              >
                <i className="fas fa-trash mr-1"></i>
                Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Create New Announcement */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Mensaje del Anuncio</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu anuncio aquí... (ej: ¡Evento especial de Navidad! 2x EXP por 24 horas)"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-poke-yellow resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-slate-400 mt-1">{message.length}/200 caracteres</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-bold mb-2">Tipo de Anuncio</label>
              <div className="grid grid-cols-2 gap-2">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setType(option.value as typeof type)}
                    className={`p-2 rounded-lg border transition-all ${
                      type === option.value
                        ? 'border-poke-yellow bg-poke-yellow/20'
                        : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <i className={`fas ${option.icon} ${option.color} mr-2`}></i>
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-bold mb-2">Duración</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-poke-yellow"
              >
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Send In-Game Too */}
          <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={sendInGame}
              onChange={(e) => setSendInGame(e.target.checked)}
              className="w-5 h-5 rounded accent-poke-yellow"
            />
            <div>
              <span className="font-bold text-green-400">También enviar In-Game</span>
              <p className="text-xs text-slate-400">El anuncio aparecerá en el chat del servidor de Minecraft</p>
            </div>
          </label>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={loading || !message.trim()}
            className="w-full bg-gradient-to-r from-poke-yellow to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-slate-600 disabled:to-slate-700 text-black disabled:text-slate-400 py-3 px-6 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Creando...
              </>
            ) : (
              <>
                <i className="fas fa-bullhorn mr-2"></i>
                {activeAnnouncement ? 'Reemplazar Anuncio' : 'Crear Anuncio'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* In-Game Only Announcements */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-gamepad text-green-400"></i>
          Anuncio In-Game (Solo Minecraft)
        </h2>

        <p className="text-slate-400 text-sm mb-4">
          Envía un mensaje directamente al chat del servidor de Minecraft. No aparece en la web.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-2">Título</label>
              <input
                type="text"
                value={inGameTitle}
                onChange={(e) => setInGameTitle(e.target.value)}
                placeholder="📢 Anuncio"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                maxLength={50}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Tipo</label>
              <select
                value={inGameType}
                onChange={(e) => setInGameType(e.target.value as typeof inGameType)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Mensaje</label>
            <textarea
              value={inGameMessage}
              onChange={(e) => setInGameMessage(e.target.value)}
              placeholder="Escribe el mensaje que aparecerá en el chat del servidor..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-slate-400 mt-1">{inGameMessage.length}/300 caracteres</p>
          </div>

          <button
            onClick={handleSendInGame}
            disabled={inGameLoading || !inGameMessage.trim()}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-slate-600 disabled:to-slate-700 text-white disabled:text-slate-400 py-3 px-6 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed"
          >
            {inGameLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Enviando...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                Enviar al Servidor
              </>
            )}
          </button>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <i className="fas fa-info-circle text-green-400 mt-0.5"></i>
              <div>
                <p>El mensaje aparecerá en el chat de <strong>todos los jugadores online</strong> con un sonido de notificación.</p>
                <p className="mt-1 text-slate-400">El plugin hace polling cada 10 segundos, así que puede tardar unos segundos en aparecer.</p>
              </div>
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
