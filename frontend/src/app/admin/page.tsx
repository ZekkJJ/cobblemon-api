'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminTournamentPanel from '@/components/AdminTournamentPanel';
import AdminModPanel from '@/components/AdminModPanel';
import AdminGachaPanel from '@/components/AdminGachaPanel';
import AdminAnnouncementPanel from '@/components/AdminAnnouncementPanel';
import AdminTutoriasPanel from '@/components/AdminTutoriasPanel';
import AdminPokemonSyncPanel from '@/components/AdminPokemonSyncPanel';
import AdminBulkItemGiver from '@/components/AdminBulkItemGiver';
import AdminLegendaryPoolPanel from '@/components/AdminLegendaryPoolPanel';

const ADMIN_DISCORD_ID = '478742167557505034';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cobblemon-los-pitufos-backend.onrender.com';

interface LocalUser {
  discordId: string;
  discordUsername: string;
  nickname?: string;
}

interface PokemonRestrictions {
  blockLegendaries: boolean;
  blockMythicals: boolean;
  blockUltraBeasts: boolean;
  blockParadox: boolean;
  blockMegas: boolean;
  blockRestricted: boolean;
  customBlockedSpecies: string[];
  customAllowedSpecies: string[];
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
  const [activeSection, setActiveSection] = useState<'levelcaps' | 'tournaments' | 'mods' | 'gacha' | 'announcements' | 'tutorias' | 'pokemonsync' | 'bulkitems' | 'legendarypool'>('levelcaps');
  const [pokemonRestrictions, setPokemonRestrictions] = useState<PokemonRestrictions>({
    blockLegendaries: false,
    blockMythicals: false,
    blockUltraBeasts: false,
    blockParadox: false,
    blockMegas: false,
    blockRestricted: false,
    customBlockedSpecies: [],
    customAllowedSpecies: [],
  });
  const [customBlockedInput, setCustomBlockedInput] = useState('');
  const [customAllowedInput, setCustomAllowedInput] = useState('');

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
        // Load pokemon restrictions
        if (effectiveData.pokemonRestrictions) {
          setPokemonRestrictions({
            blockLegendaries: effectiveData.pokemonRestrictions.blockLegendaries || false,
            blockMythicals: effectiveData.pokemonRestrictions.blockMythicals || false,
            blockUltraBeasts: effectiveData.pokemonRestrictions.blockUltraBeasts || false,
            blockParadox: effectiveData.pokemonRestrictions.blockParadox || false,
            blockMegas: effectiveData.pokemonRestrictions.blockMegas || false,
            blockRestricted: effectiveData.pokemonRestrictions.blockRestricted || false,
            customBlockedSpecies: effectiveData.pokemonRestrictions.blockedSpecies || [],
            customAllowedSpecies: effectiveData.pokemonRestrictions.allowedSpecies || [],
          });
        }
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
            pokemonRestrictions: {
              blockLegendaries: pokemonRestrictions.blockLegendaries,
              blockMythicals: pokemonRestrictions.blockMythicals,
              blockUltraBeasts: pokemonRestrictions.blockUltraBeasts,
              blockParadox: pokemonRestrictions.blockParadox,
              blockMegas: pokemonRestrictions.blockMegas,
              blockRestricted: pokemonRestrictions.blockRestricted,
              customBlockedSpecies: pokemonRestrictions.customBlockedSpecies,
              customAllowedSpecies: pokemonRestrictions.customAllowedSpecies,
            },
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
          <button
            onClick={() => setActiveSection('gacha')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              activeSection === 'gacha'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fas fa-dice mr-3"></i>
            Gacha
          </button>
          <button
            onClick={() => setActiveSection('announcements')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              activeSection === 'announcements'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fas fa-bullhorn mr-3"></i>
            Anuncios
          </button>
          <button
            onClick={() => setActiveSection('tutorias')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              activeSection === 'tutorias'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fas fa-graduation-cap mr-3"></i>
            Tutorías
          </button>
          <button
            onClick={() => setActiveSection('pokemonsync')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              activeSection === 'pokemonsync'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fas fa-sync-alt mr-3"></i>
            Pokemon Sync
          </button>
          <button
            onClick={() => setActiveSection('bulkitems')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              activeSection === 'bulkitems'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fas fa-gift mr-3"></i>
            Bulk Items
          </button>
          <button
            onClick={() => setActiveSection('legendarypool')}
            className={`flex-1 min-w-[200px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              activeSection === 'legendarypool'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <i className="fas fa-dragon mr-3"></i>
            Legendary Pool
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

              {/* Info Box - STRICT MODE */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="fas fa-exclamation-triangle text-red-400 text-xl mt-1"></i>
                  <div className="text-sm text-slate-300">
                    <p className="font-bold mb-2 text-red-400">⚠️ MODO ESTRICTO ACTIVADO</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li><strong className="text-red-400">Capture Cap:</strong> Si capturas un Pokémon de nivel {captureCap + 1} o superior, será <span className="text-red-400 font-bold">ELIMINADO INMEDIATAMENTE</span> (sin advertencia)</li>
                      <li><strong className="text-yellow-400">Ownership Cap:</strong> Si un Pokémon existente sube de nivel {ownershipCap}, recibirás una advertencia y su nivel será regularizado</li>
                      <li><strong className="text-red-400">Escaneo de PC:</strong> Cada 30 segundos se escanea Party + PC buscando Pokémon ilegales</li>
                      <li>Los Pokémon bloqueados (legendarios, míticos, etc.) serán <span className="text-red-400 font-bold">ELIMINADOS</span> de Party y PC</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pokemon Restrictions Section */}
              <div className="border-t border-slate-700 pt-6 mt-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <i className="fas fa-ban text-poke-red"></i>
                  Restricciones de Pokémon
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  Bloquea categorías de Pokémon especiales. Los jugadores no podrán capturarlos y serán <span className="text-red-400 font-bold">ELIMINADOS</span> de su Party y PC automáticamente.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Block Legendaries */}
                  <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={pokemonRestrictions.blockLegendaries}
                      onChange={(e) => setPokemonRestrictions(prev => ({ ...prev, blockLegendaries: e.target.checked }))}
                      className="w-5 h-5 rounded accent-poke-red"
                    />
                    <div>
                      <span className="font-bold text-yellow-400">Legendarios</span>
                      <p className="text-xs text-slate-400">Articuno, Mewtwo, Rayquaza, etc.</p>
                    </div>
                  </label>

                  {/* Block Mythicals */}
                  <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={pokemonRestrictions.blockMythicals}
                      onChange={(e) => setPokemonRestrictions(prev => ({ ...prev, blockMythicals: e.target.checked }))}
                      className="w-5 h-5 rounded accent-poke-red"
                    />
                    <div>
                      <span className="font-bold text-pink-400">Míticos</span>
                      <p className="text-xs text-slate-400">Mew, Celebi, Jirachi, Arceus, etc.</p>
                    </div>
                  </label>

                  {/* Block Ultra Beasts */}
                  <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={pokemonRestrictions.blockUltraBeasts}
                      onChange={(e) => setPokemonRestrictions(prev => ({ ...prev, blockUltraBeasts: e.target.checked }))}
                      className="w-5 h-5 rounded accent-poke-red"
                    />
                    <div>
                      <span className="font-bold text-purple-400">Ultra Bestias</span>
                      <p className="text-xs text-slate-400">Nihilego, Buzzwole, Pheromosa, etc.</p>
                    </div>
                  </label>

                  {/* Block Paradox */}
                  <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={pokemonRestrictions.blockParadox}
                      onChange={(e) => setPokemonRestrictions(prev => ({ ...prev, blockParadox: e.target.checked }))}
                      className="w-5 h-5 rounded accent-poke-red"
                    />
                    <div>
                      <span className="font-bold text-cyan-400">Paradox</span>
                      <p className="text-xs text-slate-400">Great Tusk, Iron Valiant, etc.</p>
                    </div>
                  </label>

                  {/* Block Megas */}
                  <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={pokemonRestrictions.blockMegas}
                      onChange={(e) => setPokemonRestrictions(prev => ({ ...prev, blockMegas: e.target.checked }))}
                      className="w-5 h-5 rounded accent-poke-red"
                    />
                    <div>
                      <span className="font-bold text-orange-400">Megas</span>
                      <p className="text-xs text-slate-400">Mega Charizard, Mega Rayquaza, etc.</p>
                    </div>
                  </label>

                  {/* Block Restricted */}
                  <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={pokemonRestrictions.blockRestricted}
                      onChange={(e) => setPokemonRestrictions(prev => ({ ...prev, blockRestricted: e.target.checked }))}
                      className="w-5 h-5 rounded accent-poke-red"
                    />
                    <div>
                      <span className="font-bold text-red-500">Restringidos (Box Legends)</span>
                      <p className="text-xs text-slate-400">Los más poderosos: Kyogre, Dialga, Zacian, etc.</p>
                    </div>
                  </label>
                </div>

                {/* Custom Blocked Species */}
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">
                    Especies Bloqueadas Personalizadas
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={customBlockedInput}
                      onChange={(e) => setCustomBlockedInput(e.target.value)}
                      placeholder="Ej: pikachu, charizard"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => {
                        if (customBlockedInput.trim()) {
                          const species = customBlockedInput.toLowerCase().trim();
                          if (!pokemonRestrictions.customBlockedSpecies.includes(species)) {
                            setPokemonRestrictions(prev => ({
                              ...prev,
                              customBlockedSpecies: [...prev.customBlockedSpecies, species]
                            }));
                          }
                          setCustomBlockedInput('');
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-bold"
                    >
                      Agregar
                    </button>
                  </div>
                  {pokemonRestrictions.customBlockedSpecies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pokemonRestrictions.customBlockedSpecies.map((species) => (
                        <span key={species} className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-sm flex items-center gap-1">
                          {species}
                          <button
                            onClick={() => setPokemonRestrictions(prev => ({
                              ...prev,
                              customBlockedSpecies: prev.customBlockedSpecies.filter(s => s !== species)
                            }))}
                            className="hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Allowed Species (Exceptions) */}
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Excepciones Permitidas
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    Pokémon que SÍ se permiten aunque estén en una categoría bloqueada
                  </p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={customAllowedInput}
                      onChange={(e) => setCustomAllowedInput(e.target.value)}
                      placeholder="Ej: mew, celebi"
                      className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => {
                        if (customAllowedInput.trim()) {
                          const species = customAllowedInput.toLowerCase().trim();
                          if (!pokemonRestrictions.customAllowedSpecies.includes(species)) {
                            setPokemonRestrictions(prev => ({
                              ...prev,
                              customAllowedSpecies: [...prev.customAllowedSpecies, species]
                            }));
                          }
                          setCustomAllowedInput('');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-bold"
                    >
                      Agregar
                    </button>
                  </div>
                  {pokemonRestrictions.customAllowedSpecies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {pokemonRestrictions.customAllowedSpecies.map((species) => (
                        <span key={species} className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-sm flex items-center gap-1">
                          {species}
                          <button
                            onClick={() => setPokemonRestrictions(prev => ({
                              ...prev,
                              customAllowedSpecies: prev.customAllowedSpecies.filter(s => s !== species)
                            }))}
                            className="hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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

        {/* Gacha Section */}
        {activeSection === 'gacha' && (
          <AdminGachaPanel />
        )}

        {/* Announcements Section */}
        {activeSection === 'announcements' && (
          <AdminAnnouncementPanel adminDiscordId={localUser.discordId} />
        )}

        {/* Tutorias Section */}
        {activeSection === 'tutorias' && (
          <AdminTutoriasPanel />
        )}

        {/* Pokemon Sync Section */}
        {activeSection === 'pokemonsync' && (
          <AdminPokemonSyncPanel adminDiscordId={localUser.discordId} />
        )}

        {/* Bulk Items Section */}
        {activeSection === 'bulkitems' && (
          <AdminBulkItemGiver />
        )}

        {/* Legendary Pool Section */}
        {activeSection === 'legendarypool' && (
          <AdminLegendaryPoolPanel />
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
