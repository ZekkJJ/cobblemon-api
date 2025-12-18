'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { TournamentTicker } from '@/components/TournamentTicker';
import StarterCard from '@/components/StarterCard';
import SoulDrivenQuestionnaire from '@/components/SoulDrivenQuestionnaire';

export default function HomePage() {
    const { data: session, status } = useSession();
    const [localUser, setLocalUser] = useState<any>(null);
    const [authMode, setAuthMode] = useState<'oauth' | 'username'>('oauth');
    const [discordUsername, setDiscordUsername] = useState('');
    const [nickname, setNickname] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRolling, setIsRolling] = useState(false);
    const [error, setError] = useState('');
    const [rollResult, setRollResult] = useState<any>(null);
    const [userStatus, setUserStatus] = useState<any>(null);
    const [showFlash, setShowFlash] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [verifySuccess, setVerifySuccess] = useState(false);
    const [gachaMode, setGachaMode] = useState<'classic' | 'soul-driven'>('classic');
    const [showQuestionnaire, setShowQuestionnaire] = useState(false);

    const user = session?.user || localUser;
    const isLoggedIn = !!user;

    // Load local user on mount
    useEffect(() => {
        const stored = localStorage.getItem('cobblemon_user');
        if (stored) {
            setLocalUser(JSON.parse(stored));
        }
    }, []);

    // Check user roll status
    useEffect(() => {
        const checkStatus = async () => {
            const discordId = (session?.user as any)?.discordId || localUser?.discordId;
            if (!discordId) return;

            try {
                const res = await fetch(`/api/gacha/roll?discordId=${discordId}`);
                const data = await res.json();
                setUserStatus(data);
                if (data.starter) {
                    setRollResult(data.starter);
                }
                if (data.nickname) {
                    setNickname(data.nickname);
                }
            } catch (e) {
                console.error('Status check error:', e);
            }
        };

        if (isLoggedIn) {
            checkStatus();
        }
    }, [session, localUser, isLoggedIn]);

    // Handle username verification (non-OAuth)
    const handleUsernameVerify = async () => {
        if (!discordUsername.trim() || !nickname.trim()) {
            setError('Por favor completa ambos campos');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordUsername: discordUsername.trim(), nickname: nickname.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error);
                return;
            }

            // Save to localStorage
            const userData = {
                discordId: data.user.discordId,
                discordUsername: data.user.discordUsername,
                nickname: data.user.nickname,
            };
            localStorage.setItem('cobblemon_user', JSON.stringify(userData));
            setLocalUser(userData);
        } catch (e) {
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle verification code submit
    const handleVerifyCode = async () => {
        if (!verifyCode.trim() || verifyCode.length !== 5) {
            setError('El código debe tener 5 dígitos');
            return;
        }

        setVerifyLoading(true);
        setError('');

        try {
            const discordId = (session?.user as any)?.discordId || localUser?.discordId;
            const discordName = (session?.user as any)?.name || localUser?.discordUsername || 'Usuario';

            const res = await fetch('/api/verify/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: verifyCode,
                    discordId: discordId,
                    discordUsername: discordName,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setVerifySuccess(true);
                setVerifyCode('');
                setTimeout(() => {
                    setVerifySuccess(false);
                }, 5000);
            } else {
                setError(data.error || 'Código inválido');
            }
        } catch (e) {
            setError('Error al verificar');
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleRoll = async () => {
        if (gachaMode === 'soul-driven') {
            setShowQuestionnaire(true);
            return;
        }

        setIsRolling(true);
        setError('');

        await new Promise((r) => setTimeout(r, 2500));

        try {
            const discordId = (session?.user as any)?.discordId || localUser?.discordId;
            const discordUsername = (session?.user as any)?.name || localUser?.discordUsername || '';

            const res = await fetch('/api/gacha/roll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    discordId: discordId,
                    discordUsername: discordUsername,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error);
                setIsRolling(false);
                return;
            }

            setShowFlash(true);
            setTimeout(() => setShowFlash(false), 500);

            const audio = new Audio(data.starter.sprites.cry);
            audio.volume = 0.5;
            audio.play().catch(() => { });

            setRollResult(data.starter);
            setUserStatus({ canRoll: false, reason: 'already_rolled' });
        } catch (e) {
            setError('Error al hacer la tirada');
        } finally {
            setIsRolling(false);
        }
    };

    const handleSoulDrivenSubmit = async (answers: string[]) => {
        setIsRolling(true);
        setError('');

        await new Promise((r) => setTimeout(r, 2500));

        try {
            const discordId = (session?.user as any)?.discordId || localUser?.discordId;
            const discordUsername = (session?.user as any)?.name || localUser?.discordUsername || '';

            const res = await fetch('/api/gacha/soul-driven', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    discordId: discordId,
                    discordUsername: discordUsername,
                    answers: answers,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error);
                setIsRolling(false);
                return;
            }

            setShowFlash(true);
            setTimeout(() => setShowFlash(false), 500);

            const audio = new Audio(data.starter.sprites.cry);
            audio.volume = 0.5;
            audio.play().catch(() => { });

            setRollResult(data.starter);
            setUserStatus({ canRoll: false, reason: 'already_rolled' });
            setShowQuestionnaire(false);
        } catch (e) {
            setError('Error al hacer la tirada Soul Driven');
        } finally {
            setIsRolling(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center">
            {/* Ticker - Full Width */}
            <div className="w-full mb-8">
                <TournamentTicker />
            </div>

            <div className="w-full flex flex-col items-center px-4">
                {/* Flash overlay */}
                {showFlash && <div className="flash-overlay"></div>}

                {/* Stats counter */}
                <div className="w-full max-w-md mb-6 flex justify-end">
                    <div className="bg-red-900 bg-opacity-80 px-4 py-2 rounded-lg text-sm border border-red-500 shadow-inner font-bold">
                        <span>{userStatus?.totalStarters - (userStatus?.availableCount || 0) || 0}</span>
                        <span className="opacity-60"> / {userStatus?.totalStarters || 27} Reclamados</span>
                    </div>
                </div>

                {/* Verification section - shown when logged in */}
                {isLoggedIn && (
                    <div className="w-full max-w-md mb-6">
                        <div className="bg-gradient-to-br from-blue-900/90 to-cyan-900/90 backdrop-blur-sm rounded-2xl p-5 border border-cyan-500/30 shadow-xl">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                    <i className="fas fa-link text-cyan-400 text-xl"></i>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                                        Verificar Minecraft
                                        {verifySuccess && <i className="fas fa-check-circle text-green-400 animate-pulse"></i>}
                                    </h3>
                                    <p className="text-cyan-200 text-xs mb-3">
                                        Ingresa el código de 5 dígitos que aparece en Minecraft
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                            placeholder="12345"
                                            maxLength={5}
                                            disabled={verifyLoading}
                                            className="flex-1 bg-gray-800/50 border border-cyan-500/30 rounded-lg px-4 py-2 text-white text-center text-lg tracking-widest placeholder-gray-500 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
                                        />
                                        <button
                                            onClick={handleVerifyCode}
                                            disabled={verifyLoading || verifyCode.length !== 5}
                                            className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-2 rounded-lg transition-all"
                                        >
                                            {verifyLoading ? (
                                                <i className="fas fa-spinner fa-spin"></i>
                                            ) : (
                                                <i className="fas fa-check"></i>
                                            )}
                                        </button>
                                    </div>
                                    {verifySuccess && (
                                        <div className="mt-2 text-green-400 text-xs flex items-center gap-1">
                                            <i className="fas fa-check-circle"></i>
                                            ¡Verificado! Ahora puedes moverte en el servidor
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main gacha machine */}
                <div className="bg-gradient-to-b from-gray-100 to-gray-200 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-md border-4 border-gray-300 relative overflow-hidden">
                    {/* Red top bar */}
                    <div className="absolute top-0 left-0 w-full h-5 bg-gradient-to-r from-red-400 to-red-500 border-b border-red-600"></div>

                    {/* Display area */}
                    <div className="bg-gray-800 rounded-xl min-h-[24rem] flex items-center justify-center border-4 border-gray-600 mb-6 relative p-4 overflow-hidden shadow-inner">

                        {/* Not logged in - Auth options */}
                        {!isLoggedIn && (
                            <div className="flex flex-col items-center w-full">
                                <div className="text-green-400 text-center pixel-font text-xs mb-6 animate-pulse">
                                    INICIA SESIÓN<br />PARA CONTINUAR
                                </div>

                                {/* Auth mode toggle */}
                                <div className="flex gap-2 mb-4 bg-gray-700 p-1 rounded-lg">
                                    <button
                                        onClick={() => setAuthMode('oauth')}
                                        className={`px-4 py-2 rounded text-sm font-medium transition-all ${authMode === 'oauth' ? 'bg-[#5865F2] text-white' : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        <i className="fab fa-discord mr-1"></i> Discord
                                    </button>
                                    <button
                                        onClick={() => setAuthMode('username')}
                                        className={`px-4 py-2 rounded text-sm font-medium transition-all ${authMode === 'username' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        <i className="fas fa-user mr-1"></i> Usuario
                                    </button>
                                </div>

                                {authMode === 'oauth' ? (
                                    <button
                                        onClick={() => signIn('discord')}
                                        className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
                                    >
                                        <i className="fab fa-discord text-xl"></i>
                                        Iniciar con Discord
                                    </button>
                                ) : (
                                    <div className="w-full space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Tu nombre de Discord"
                                            value={discordUsername}
                                            onChange={(e) => setDiscordUsername(e.target.value)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Tu apodo/nombre real"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                                        />
                                        <button
                                            onClick={handleUsernameVerify}
                                            disabled={isLoading}
                                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                    Verificando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-check-circle"></i>
                                                    Verificar y Registrar
                                                </>
                                            )}
                                        </button>
                                        <p className="text-xs text-gray-400 text-center mt-2">
                                            Debes estar en el servidor de Discord para verificar
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <div className="mt-4 bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm text-center">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Logged in - Show roll result or roll prompt */}
                        {isLoggedIn && !isRolling && rollResult && (
                            <div className="w-full h-full">
                                <StarterCard starter={rollResult} isShiny={rollResult.isShiny} />
                            </div>
                        )}

                        {/* Logged in - Can roll */}
                        {isLoggedIn && !isRolling && !rollResult && userStatus?.canRoll !== false && (
                            <div className="flex flex-col items-center w-full">
                                {!showQuestionnaire ? (
                                    <>
                                        <div className="text-green-400 text-center pixel-font text-xs mb-4 animate-pulse">
                                            ¡LISTO PARA<br />INVOCAR!
                                        </div>

                                        <div className="w-full mb-4 flex gap-2 bg-gray-700/50 p-1 rounded-lg">
                                            <button
                                                onClick={() => setGachaMode('classic')}
                                                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${
                                                    gachaMode === 'classic'
                                                        ? 'bg-red-600 text-white shadow-lg'
                                                        : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <i className="fas fa-dice mr-2"></i>
                                                Clásico
                                            </button>
                                            <button
                                                onClick={() => setGachaMode('soul-driven')}
                                                className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-all ${
                                                    gachaMode === 'soul-driven'
                                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                                        : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                <i className="fas fa-sparkles mr-2"></i>
                                                Soul Driven
                                            </button>
                                        </div>

                                        <div className="relative mb-4">
                                            <div className="absolute inset-0 bg-white blur-xl opacity-20 animate-pulse rounded-full"></div>
                                            <img
                                                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                                                alt="Pokeball"
                                                className="w-28 h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                            />
                                        </div>

                                        <p className="text-gray-400 text-sm text-center mb-2">
                                            ¡{userStatus?.availableCount || 27} starters disponibles!
                                        </p>

                                        {gachaMode === 'soul-driven' && (
                                            <p className="text-purple-400 text-xs text-center mb-2">
                                                <i className="fas fa-brain mr-1"></i>
                                                La IA encontrará tu compañero ideal
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <SoulDrivenQuestionnaire
                                        onSubmit={handleSoulDrivenSubmit}
                                        isLoading={isRolling}
                                    />
                                )}

                                {error && (
                                    <div className="mt-3 bg-red-500/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm text-center">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rolling animation */}
                        {isRolling && (
                            <div className="flex flex-col items-center">
                                <div className="text-purple-400 text-center pixel-font text-xs mb-6 ai-loading">
                                    INVOCANDO...
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white blur-xl opacity-30 animate-pulse rounded-full"></div>
                                    <img
                                        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
                                        alt="Pokeball"
                                        className="w-28 h-28 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-shake"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Already rolled message */}
                        {isLoggedIn && !isRolling && !rollResult && userStatus?.canRoll === false && (
                            <div className="text-center">
                                <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                                <p className="text-yellow-300 font-bold">Ya has hecho tu tirada</p>
                                <p className="text-gray-400 text-sm mt-2">Cada jugador solo puede obtener un starter</p>
                            </div>
                        )}
                    </div>

                    {/* Roll button */}
                    {!showQuestionnaire && (
                        <button
                            onClick={handleRoll}
                            disabled={!isLoggedIn || isRolling || userStatus?.canRoll === false}
                            className={`group relative px-8 py-5 text-white pixel-font rounded-2xl shadow-[0_6px_0_rgb(153,27,27),0_15px_20px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[6px] transition-all hover:brightness-110 w-full disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden btn-press ${
                                gachaMode === 'soul-driven'
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                    : 'bg-gradient-to-b from-red-500 to-red-600'
                            }`}
                        >
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            <span className="flex items-center justify-center gap-3 text-sm relative z-10">
                                {isRolling ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        INVOCANDO...
                                    </>
                                ) : rollResult ? (
                                    <>
                                        <i className="fas fa-check"></i>
                                        ¡COMPLETADO!
                                    </>
                                ) : gachaMode === 'soul-driven' ? (
                                    <>
                                        COMENZAR <i className="fas fa-sparkles text-lg"></i>
                                    </>
                                ) : (
                                    <>
                                        INVOCAR <i className="fas fa-dice text-lg"></i>
                                    </>
                                )}
                            </span>
                        </button>
                    )}

                    {/* Odds text */}
                    <div className="mt-5 text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        1% Probabilidad de SHINY ✨
                    </div>
                </div>

                {/* Info text */}
                <div className="mt-8 max-w-md text-center">
                    <div className="glass-dark rounded-xl p-4">
                        <h3 className="font-bold text-white mb-2 flex items-center justify-center gap-2">
                            <i className="fas fa-info-circle text-blue-400"></i>
                            ¿Cómo funciona?
                        </h3>
                        <ul className="text-sm text-gray-300 space-y-1 text-left">
                            <li>• Cada jugador solo puede hacer <strong>UNA tirada</strong></li>
                            <li>• El starter que obtengas será <strong>exclusivamente tuyo</strong></li>
                            <li>• Nadie más podrá obtener el mismo starter</li>
                            <li>• ¡Hay un 1% de probabilidad de obtener un <span className="text-yellow-400">SHINY</span>!</li>
                        </ul>
                        
                        <div className="mt-4 pt-4 border-t border-gray-600">
                            <h4 className="font-bold text-purple-400 mb-2 text-sm flex items-center justify-center gap-2">
                                <i className="fas fa-sparkles"></i>
                                Modos de Invocación
                            </h4>
                            <div className="text-xs text-gray-300 space-y-2 text-left">
                                <div>
                                    <strong className="text-red-400">• Clásico:</strong> Totalmente aleatorio
                                </div>
                                <div>
                                    <strong className="text-purple-400">• Soul Driven:</strong> La IA analiza tu personalidad para encontrar tu compañero perfecto
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
