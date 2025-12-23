'use client';

import { useState, useEffect } from 'react';
import { gachaAPI, authAPI, verificationAPI } from '@/src/lib/api-client';
import { LocalUser } from '@/src/lib/types/user';
import { Starter } from '@/src/lib/types/pokemon';
import StarterCard from '@/src/components/StarterCard';
import SoulDrivenQuestionnaire from '@/src/components/SoulDrivenQuestionnaire';
import MusicPlayer from '@/src/components/MusicPlayer';
import { playSound, playPokemonCry } from '@/src/lib/sounds';

type GachaMode = 'classic' | 'soul-driven';

interface GachaStatus {
  canRoll: boolean;
  hasRolled: boolean;
  starter?: Starter;
  isShiny?: boolean;
  availableCount: number;
  totalCount: number;
}

interface VerificationCode {
  code: string;
  expiresAt: Date;
}

// Componente para autenticación por username
function UsernameAuthForm({ onSuccess }: { onSuccess: (user: LocalUser) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!discordUsername.trim()) {
      setError('El nombre de usuario es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authAPI.verifyUsername({
        discordUsername: discordUsername.trim(),
        nickname: nickname.trim() || undefined,
      });

      // Guardar en localStorage
      const user: LocalUser = {
        discordId: result.discordId,
        discordUsername: result.discordUsername,
        nickname: result.nickname,
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      playSound('success');
      onSuccess(user);
    } catch (error: any) {
      setError(error.message || 'Error al verificar el usuario');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => {
          setShowForm(true);
          playSound('click');
        }}
        className="btn-secondary"
      >
        <i className="fas fa-user mr-2"></i>
        Ingresar con Nombre de Usuario
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="block text-sm font-bold mb-2">
          Nombre de Usuario de Discord *
        </label>
        <input
          type="text"
          value={discordUsername}
          onChange={(e) => setDiscordUsername(e.target.value)}
          placeholder="usuario#1234"
          className="input-field w-full"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">
          Apodo (Opcional)
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Mi apodo"
          className="input-field w-full"
        />
      </div>

      {error && (
        <div className="p-3 bg-poke-red/20 border border-poke-red rounded-lg text-poke-red text-sm">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            playSound('cancel');
          }}
          className="btn-secondary flex-1"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary flex-1"
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Verificando...
            </>
          ) : (
            <>
              <i className="fas fa-check mr-2"></i>
              Ingresar
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function Home() {
  const [localUser, setLocalUser] = useState<LocalUser | null>(null);
  const [gachaMode, setGachaMode] = useState<GachaMode>('classic');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [userStatus, setUserStatus] = useState<GachaStatus | null>(null);
  const [rollResult, setRollResult] = useState<{ starter: Starter; isShiny: boolean } | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState<VerificationCode | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Cargar usuario de localStorage
  useEffect(() => {
    // Verificar si viene de Discord OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    
    if (authSuccess === 'success') {
      // Limpiar el parámetro de la URL
      window.history.replaceState({}, '', '/');
      
      // Obtener datos del usuario desde el backend (la cookie ya está establecida)
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/me`, {
        credentials: 'include', // Importante para enviar cookies
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            const user: LocalUser = {
              discordId: data.user.discordId,
              discordUsername: data.user.discordUsername,
              nickname: data.user.nickname,
            };
            localStorage.setItem('user', JSON.stringify(user));
            setLocalUser(user);
            loadGachaStatus(user.discordId);
            playSound('success');
          }
        })
        .catch(error => {
          console.error('Error loading user after OAuth:', error);
          setLoading(false);
        });
      return;
    }
    
    // Cargar usuario de localStorage si no viene de OAuth
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setLocalUser(user);
        loadGachaStatus(user.discordId);
      } catch (error) {
        console.error('Error parsing user:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGachaStatus = async (discordId: string) => {
    try {
      console.log('[GACHA] Loading status for:', discordId);
      const status = await gachaAPI.getStatus(discordId);
      console.log('[GACHA] Status received:', status);
      setUserStatus(status);
      
      if (status.hasRolled && status.starter) {
        console.log('[GACHA] User has already rolled, starter:', status.starter);
        setRollResult({ starter: status.starter, isShiny: status.isShiny || false });
        
        // Check verification status
        checkVerificationStatus(discordId);
      }
    } catch (error: any) {
      console.error('[GACHA] Error loading gacha status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is verified
  const checkVerificationStatus = async (discordId: string) => {
    try {
      const status = await verificationAPI.getStatus(discordId);
      setIsVerified(status.verified || false);
      
      // If not verified and no code, generate one
      if (!status.verified && !verificationCode) {
        generateVerificationCode(discordId);
      }
    } catch (error) {
      console.error('[VERIFICATION] Error checking status:', error);
    }
  };

  // Generate verification code
  const generateVerificationCode = async (discordId: string) => {
    try {
      const result = await verificationAPI.generateWebCode(discordId, localUser?.discordUsername);
      
      if (result.alreadyVerified) {
        setIsVerified(true);
        return;
      }
      
      if (result.code) {
        setVerificationCode({
          code: result.code,
          expiresAt: new Date(result.expiresAt),
        });
      }
    } catch (error) {
      console.error('[VERIFICATION] Error generating code:', error);
    }
  };

  // Poll verification status every 5 seconds when code is shown
  useEffect(() => {
    if (!verificationCode || isVerified || !localUser) return;
    
    const interval = setInterval(async () => {
      setCheckingVerification(true);
      try {
        const status = await verificationAPI.getStatus(localUser.discordId);
        if (status.verified) {
          setIsVerified(true);
          setVerificationCode(null);
          playSound('success');
        }
      } catch (error) {
        console.error('[VERIFICATION] Poll error:', error);
      } finally {
        setCheckingVerification(false);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [verificationCode, isVerified, localUser]);

  const handleClassicRoll = async () => {
    if (!localUser || !userStatus?.canRoll) return;

    setIsRolling(true);
    setError(null);
    playSound('roll');

    try {
      const result = await gachaAPI.roll({
        discordId: localUser.discordId,
        discordUsername: localUser.discordUsername,
      });

      // Animación de tirada
      setTimeout(async () => {
        setRollResult(result);
        setIsRolling(false);
        playSound('success');
        
        // Reproducir cry del Pokémon
        if (result.starter.sprites.cry) {
          playPokemonCry(result.starter.sprites.cry);
        }

        // Actualizar estado
        setUserStatus({
          ...userStatus,
          canRoll: false,
          hasRolled: true,
          starter: result.starter,
          isShiny: result.isShiny,
        });

        // Generate verification code after successful roll
        await generateVerificationCode(localUser.discordId);
      }, 2000);
    } catch (error: any) {
      setIsRolling(false);
      setError(error.message || 'Error al hacer la tirada');
      playSound('error');
    }
  };

  const handleSoulDrivenSubmit = async (answers: string[]) => {
    if (!localUser) return;

    setIsRolling(true);
    setError(null);
    playSound('roll');

    try {
      const result = await gachaAPI.soulDriven({
        discordId: localUser.discordId,
        discordUsername: localUser.discordUsername,
        answers,
      });

      // Animación de tirada
      setTimeout(async () => {
        setRollResult(result);
        setIsRolling(false);
        setShowQuestionnaire(false);
        playSound('success');
        
        // Reproducir cry del Pokémon
        if (result.starter.sprites.cry) {
          playPokemonCry(result.starter.sprites.cry);
        }

        // Actualizar estado
        setUserStatus({
          ...userStatus!,
          canRoll: false,
          hasRolled: true,
          starter: result.starter,
          isShiny: result.isShiny,
        });

        // Generate verification code after successful roll
        await generateVerificationCode(localUser.discordId);
      }, 2000);
    } catch (error: any) {
      setIsRolling(false);
      setError(error.message || 'Error al hacer la tirada');
      playSound('error');
    }
  };

  const handleModeChange = (mode: GachaMode) => {
    playSound('click');
    setGachaMode(mode);
    if (mode === 'soul-driven') {
      setShowQuestionnaire(true);
    } else {
      setShowQuestionnaire(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-poke-red border-t-transparent"></div>
          <p className="mt-4 text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <MusicPlayer />
      
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 pixel-font text-poke-red">
            GACHA POKÉMON
          </h1>
          <p className="text-xl text-slate-300">
            Obtén tu Pokémon inicial único
          </p>
        </div>

        {/* Stats Counter */}
        {userStatus && (
          <div className="max-w-md mx-auto mb-8 card text-center">
            <div className="text-sm text-slate-400 mb-2">Starters Disponibles</div>
            <div className="text-3xl font-bold">
              <span className="text-poke-green">{userStatus.availableCount}</span>
              <span className="text-slate-500"> / </span>
              <span>{userStatus.totalCount || 27}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
              <div
                className="bg-gradient-to-r from-poke-red to-poke-yellow h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(((userStatus.totalCount || 27) - userStatus.availableCount) / (userStatus.totalCount || 27)) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Not Authenticated */}
        {!localUser && (
          <div className="max-w-2xl mx-auto">
            <div className="card text-center">
              <i className="fas fa-user-lock text-6xl text-poke-blue mb-4"></i>
              <h2 className="text-2xl font-bold mb-4">Inicia Sesión</h2>
              <p className="text-slate-300 mb-6">
                Necesitas iniciar sesión para obtener tu Pokémon inicial
              </p>
              
              <div className="space-y-4">
                <a
                  href={authAPI.getDiscordAuthUrl()}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <i className="fab fa-discord text-xl"></i>
                  Iniciar con Discord
                </a>
                
                <div className="text-slate-400">o</div>
                
                <UsernameAuthForm onSuccess={(user) => {
                  setLocalUser(user);
                  loadGachaStatus(user.discordId);
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Authenticated - Can Roll */}
        {localUser && userStatus?.canRoll && !rollResult && (
          <div className="max-w-4xl mx-auto">
            {/* Mode Selection */}
            {!showQuestionnaire && (
              <div className="mb-8">
                <div className="flex justify-center gap-4 mb-6">
                  <button
                    onClick={() => handleModeChange('classic')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${
                      gachaMode === 'classic'
                        ? 'bg-poke-red text-white scale-105'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <i className="fas fa-dice mr-2"></i>
                    Clásico
                  </button>
                  <button
                    onClick={() => handleModeChange('soul-driven')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${
                      gachaMode === 'soul-driven'
                        ? 'bg-poke-purple text-white scale-105'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <i className="fas fa-brain mr-2"></i>
                    Soul Driven
                  </button>
                </div>

                {/* Gacha Machine */}
                <div className="card text-center">
                  <div className="mb-6">
                    <div className={`inline-block p-8 rounded-full relative ${
                      isRolling ? 'animate-shake bg-poke-red/20' : 'bg-slate-800'
                    }`}>
                      <div className="relative">
                        <div className="absolute inset-0 bg-white blur-xl opacity-20 animate-pulse rounded-full"></div>
                        <img
                          src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                          alt="Pokeball"
                          className="w-28 h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] relative z-10"
                        />
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-4">
                    {gachaMode === 'classic' ? 'Tirada Clásica' : 'Soul Driven'}
                  </h2>
                  
                  <p className="text-slate-300 mb-6">
                    {gachaMode === 'classic'
                      ? 'Obtén un Pokémon inicial completamente aleatorio'
                      : 'Responde 5 preguntas y obtén un Pokémon compatible con tu personalidad'}
                  </p>

                  {error && (
                    <div className="mb-4 p-4 bg-poke-red/20 border border-poke-red rounded-lg text-poke-red">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleClassicRoll}
                    disabled={isRolling || gachaMode === 'soul-driven'}
                    className="btn-primary text-2xl py-4 px-12 disabled:opacity-50"
                  >
                    {isRolling ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        INVOCANDO...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-bolt mr-2"></i>
                        INVOCAR
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Soul Driven Questionnaire */}
            {showQuestionnaire && (
              <SoulDrivenQuestionnaire
                onSubmit={handleSoulDrivenSubmit}
                isLoading={isRolling}
              />
            )}
          </div>
        )}

        {/* Result */}
        {rollResult && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">
                {rollResult.isShiny ? (
                  <>
                    <span className="text-poke-yellow">✨ ¡SHINY! ✨</span>
                  </>
                ) : (
                  '¡Felicidades!'
                )}
              </h2>
              <p className="text-xl text-slate-300">
                Has obtenido a {rollResult.starter.nameEs}
              </p>
            </div>

            <StarterCard starter={rollResult.starter} isShiny={rollResult.isShiny} size="full" />

            {/* Verification Code Section */}
            {!isVerified && verificationCode && (
              <div className="mt-8 card bg-gradient-to-r from-poke-blue/20 to-poke-purple/20 border-2 border-poke-blue">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4 text-poke-blue">
                    <i className="fas fa-link mr-2"></i>
                    Vincula tu cuenta de Minecraft
                  </h3>
                  
                  <p className="text-slate-300 mb-6">
                    Para recibir tu Pokémon en el servidor, vincula tu cuenta usando este código:
                  </p>
                  
                  <div className="bg-slate-900 rounded-xl p-6 mb-6 inline-block">
                    <div className="text-5xl font-mono font-bold text-poke-yellow tracking-widest">
                      {verificationCode.code}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(verificationCode.code);
                        playSound('click');
                      }}
                      className="mt-3 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <i className="fas fa-copy mr-1"></i>
                      Copiar código
                    </button>
                  </div>
                  
                  <div className="text-left max-w-md mx-auto space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-poke-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <span className="text-slate-300">Entra al servidor de Minecraft</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-poke-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <span className="text-slate-300">Usa el comando: <code className="bg-slate-800 px-2 py-1 rounded text-poke-yellow">/verify {verificationCode.code}</code></span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-poke-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      <span className="text-slate-300">¡Listo! Tu cuenta quedará vinculada</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-sm text-slate-500">
                    {checkingVerification ? (
                      <span><i className="fas fa-spinner fa-spin mr-2"></i>Verificando...</span>
                    ) : (
                      <span>El código expira en 15 minutos</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Already Verified */}
            {isVerified && (
              <div className="mt-8 card bg-gradient-to-r from-poke-green/20 to-emerald-500/20 border-2 border-poke-green">
                <div className="text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-poke-green mb-2">
                    ¡Cuenta Vinculada!
                  </h3>
                  <p className="text-slate-300">
                    Tu cuenta de Discord está vinculada a Minecraft. 
                    Tu Pokémon inicial te espera en el servidor.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Already Rolled */}
        {localUser && userStatus && !userStatus.canRoll && userStatus.hasRolled && !rollResult && userStatus.starter && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">Tu Pokémon Inicial</h2>
              <p className="text-xl text-slate-300">
                Ya has obtenido tu starter
              </p>
            </div>

            <StarterCard starter={userStatus.starter} isShiny={userStatus.isShiny || false} size="full" />

            {/* Verification Code Section for already rolled users */}
            {!isVerified && verificationCode && (
              <div className="mt-8 card bg-gradient-to-r from-poke-blue/20 to-poke-purple/20 border-2 border-poke-blue">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4 text-poke-blue">
                    <i className="fas fa-link mr-2"></i>
                    Vincula tu cuenta de Minecraft
                  </h3>
                  
                  <p className="text-slate-300 mb-6">
                    Para recibir tu Pokémon en el servidor, vincula tu cuenta usando este código:
                  </p>
                  
                  <div className="bg-slate-900 rounded-xl p-6 mb-6 inline-block">
                    <div className="text-5xl font-mono font-bold text-poke-yellow tracking-widest">
                      {verificationCode.code}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(verificationCode.code);
                        playSound('click');
                      }}
                      className="mt-3 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <i className="fas fa-copy mr-1"></i>
                      Copiar código
                    </button>
                  </div>
                  
                  <div className="text-left max-w-md mx-auto space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-poke-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <span className="text-slate-300">Entra al servidor de Minecraft</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-poke-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <span className="text-slate-300">Usa el comando: <code className="bg-slate-800 px-2 py-1 rounded text-poke-yellow">/verify {verificationCode.code}</code></span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="bg-poke-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                      <span className="text-slate-300">¡Listo! Tu cuenta quedará vinculada</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-sm text-slate-500">
                    {checkingVerification ? (
                      <span><i className="fas fa-spinner fa-spin mr-2"></i>Verificando...</span>
                    ) : (
                      <span>El código expira en 15 minutos</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Already Verified */}
            {isVerified && (
              <div className="mt-8 card bg-gradient-to-r from-poke-green/20 to-emerald-500/20 border-2 border-poke-green">
                <div className="text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-poke-green mb-2">
                    ¡Cuenta Vinculada!
                  </h3>
                  <p className="text-slate-300">
                    Tu cuenta de Discord está vinculada a Minecraft. 
                    Tu Pokémon inicial te espera en el servidor.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
