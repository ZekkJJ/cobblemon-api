'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminTournamentPanel from '@/src/components/AdminTournamentPanel';
import AdminModPanel from '@/src/components/AdminModPanel';

const ADMIN_DISCORD_ID = '478742167557505034';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cobblemon-los-pitufos-backend.onrender.com';

interface LocalUser {
  discordId: string;
  discordUsername: string;
  nickname?: string;
}

interface LevelCapsConfig {
  version: number;
  globalConfig: {
    defaultCaptureCap: number;
    defaultOwnershipCap: number;
  };
  lastModified?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [captureCap, setCaptureCap] = useState(50);
  const [ownershipCap, setOwnershipCap] = useState(100);
  const [saving, setSaving] = useState(false);
  const [configVersion, setConfigVersion] = useState(0);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<'levelcaps' | 'tournaments' | 'mods'>('levelcaps');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Verificar que sea el admin
      if (user.discordId !== ADMIN_DISCORD_ID) {
        router.push('/');
        return;
      }

      setLocalUser(user);
      loadCurrentConfig();
    } catch (error) {
      router.push('/');
    }
  }, [router]);

  // Load current level caps config from backend
  const loadCurrentConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/level-caps/version`);
      if (response.ok) {
        const data = await response.json();
        setConfigVersion(data.version || 0);
        if (data.lastUpdated) {
          setLastSaved(new Date(data.lastUpdated).toLocaleString());
        }
      }

      // Get effective caps (which returns the current global config)
      const effectiveResponse = await fetch(`${API_URL}/api/level-caps/effective?uuid=admin`);
      if (effectiveResponse.ok) {
        const effectiveData = await effectiveResponse.json();
        if (effectiveData.captureCap) setCaptureCap(effectiveData.captureCap);
        if (effectiveData.ownershipCap) setOwnershipCap(effectiveData.ownershipCap);
      }
    } catch (error) {
      console.error('Error loading level caps config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!localUser) return;

    setSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch(`${API_URL}/api/level-caps/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          globalConfig: {
            defaultCaptureCap: captureCap,
            defaultOwnershipCap: ownershipCap,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      setConfigVersion(data.version || configVersion + 1);
      setLastSaved(new Date().toLocaleString());
      setSaveMessage({ 
        type: 'success', 
        text: `✅ Level Caps guardados (v${data.version}). Los cambios se aplicarán en ~60 segundos.` 
      });
      
      // Clear message after 5 seconds
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      console.error('Error saving level caps:', error);
      setSaveMessage({ 
        type: 'error', 
        text: '❌ Error al guardar. Intenta de nuevo.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-blue border-t-transparent"></div>
          <p className="mt-4 text-xl">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!localUser || localUser.discordId !== ADMIN_DISCORD_ID) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-red">
            PANEL DE ADMIN
          </h1>
          <p className="text-xl text-slate-300">
            Configuración del servidor
          </p>
        </div>

        {/* Admin Info */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <i className="fas fa-shield-alt text-3xl text-poke-yellow"></i>
            <div>
              <h2 className="text-xl font-bold">Administrador</h2>
              <p className="text-slate-400">{localUser.nickname || localUser.discordUsername}</p>
            </div>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveSection('levelcaps')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              activeSection === 'levelcaps'
                ? 'bg-gradient-to-r from-poke-blue to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fas fa-chart-line mr-3"></i>
            Level Caps
          </button>
          <button
            onClick={() => setActiveSection('tournaments')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              activeSection === 'tournaments'
                ? 'bg-gradient-to-r from-poke-yellow to-yellow-500 text-black shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fas fa-trophy mr-3"></i>
            Torneos
          </button>
          <button
            onClick={() => setActiveSection('mods')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              activeSection === 'mods'
                ? 'bg-gradient-to-r from-poke-green to-green-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fas fa-puzzle-piece mr-3"></i>
            Mods
          </button>
        </div>

        {/* Level Caps Section */}
        {activeSection === 'levelcaps' && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <i className="fas fa-chart-line text-poke-blue"></i>
              Level Caps
              {configVersion > 0 && (
                <span className="text-sm font-normal text-slate-400 ml-2">
                  (v{configVersion})
                </span>
              )}
            </h2>

            {lastSaved && (
              <p className="text-sm text-slate-400 mb-4">
                Última actualización: {lastSaved}
              </p>
            )}

            <div className="space-y-6">
              {/* Capture Cap */}
              <div>
                <label className="block text-lg font-bold mb-2">
                  Capture Cap (Nivel máximo para capturar)
                </label>
                <p className="text-slate-400 text-sm mb-3">
                  Los Pokémon con nivel superior a este no podrán ser capturados
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={captureCap}
                    onChange={(e) => setCaptureCap(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-20 text-center">
                    <span className="text-3xl font-bold text-poke-blue">{captureCap}</span>
                  </div>
                </div>
              </div>

              {/* Ownership Cap */}
              <div>
                <label className="block text-lg font-bold mb-2">
                  Ownership Cap (Nivel máximo de Pokémon propios)
                </label>
                <p className="text-slate-400 text-sm mb-3">
                  Los Pokémon propios NO podrán superar este nivel
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={ownershipCap}
                    onChange={(e) => setOwnershipCap(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-20 text-center">
                    <span className="text-3xl font-bold text-poke-green">{ownershipCap}</span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="fas fa-info-circle text-blue-400 text-xl mt-1"></i>
                  <div className="text-sm text-slate-300">
                    <p className="font-bold mb-2">¿Cómo funcionan los Level Caps?</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li><strong>Capture Cap:</strong> Si intentas capturar un Pokémon de nivel {captureCap + 1} o superior, será liberado automáticamente</li>
                      <li><strong>Ownership Cap:</strong> Tus Pokémon NO ganarán experiencia al alcanzar nivel {ownershipCap}</li>
                      <li>Los caps se aplican inmediatamente al guardar</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Save Message */}
              {saveMessage && (
                <div className={`p-4 rounded-lg ${
                  saveMessage.type === 'success' 
                    ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
                    : 'bg-red-500/20 border border-red-500/50 text-red-300'
                }`}>
                  {saveMessage.text}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-poke-red to-poke-yellow hover:from-red-600 hover:to-yellow-600 disabled:from-slate-600 disabled:to-slate-700 text-white py-4 px-6 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Guardar Configuración
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tournaments Section */}
        {activeSection === 'tournaments' && (
          <AdminTournamentPanel />
        )}

        {/* Mods Section */}
        {activeSection === 'mods' && (
          <AdminModPanel />
        )}

        {/* Warning */}
        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-triangle text-red-400 text-xl mt-1"></i>
            <div className="text-sm text-slate-300">
              <p className="font-bold mb-1">⚠️ Advertencia</p>
              <p>Los cambios en esta página afectan a TODOS los jugadores del servidor inmediatamente.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
