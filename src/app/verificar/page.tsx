'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function VerificarPage() {
    const [localUser, setLocalUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('cobblemon_user');
        if (stored) {
            setLocalUser(JSON.parse(stored));
        }
        setLoading(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!localUser) {
            setResult({ error: 'Debes iniciar sesión con Discord primero' });
            return;
        }

        if (code.length !== 5 || !/^\d+$/.test(code)) {
            setResult({ error: 'El código debe ser de 5 dígitos numéricos' });
            return;
        }

        setVerifying(true);
        setResult(null);

        try {
            const res = await fetch('/api/verify/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    discordId: localUser.discordId,
                    discordUsername: localUser.discordUsername || localUser.name,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setResult({
                    success: true,
                    message: `¡Verificación exitosa! Tu cuenta de Minecraft (${data.minecraftUsername}) está vinculada.`,
                });
            } else {
                setResult({ error: data.error || 'Error al verificar' });
            }
        } catch (error) {
            setResult({ error: 'Error de conexión' });
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Card */}
                <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <i className="fas fa-link text-white text-2xl"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Verificar Cuenta</h1>
                        <p className="text-gray-400 text-sm">
                            Vincula tu cuenta de Minecraft con Discord
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="bg-gray-700/50 rounded-lg p-4 mb-6 text-sm">
                        <p className="text-gray-300 mb-3 font-medium">Pasos:</p>
                        <ol className="space-y-2 text-gray-400">
                            <li className="flex items-start gap-2">
                                <span className="bg-blue-500/20 text-blue-400 w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0">1</span>
                                <span>Entra al servidor de Minecraft</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-blue-500/20 text-blue-400 w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0">2</span>
                                <span>Aparecerá un código de 5 dígitos</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-blue-500/20 text-blue-400 w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0">3</span>
                                <span>Ingresa el código aquí abajo</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-blue-500/20 text-blue-400 w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0">4</span>
                                <span>¡Listo! Ya puedes moverte en el servidor</span>
                            </li>
                        </ol>
                    </div>

                    {/* Login with Discord if not logged in */}
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        </div>
                    ) : !localUser ? (
                        <button
                            onClick={async () => {
                                try {
                                    const response = await fetch(`${API_BASE_URL}/api/auth/discord`);
                                    const data = await response.json();
                                    if (data.success && data.authUrl) {
                                        window.location.href = data.authUrl;
                                    } else {
                                        setResult({ error: 'Error al obtener URL de autenticación' });
                                    }
                                } catch (e) {
                                    setResult({ error: 'Error al conectar con el servidor' });
                                }
                            }}
                            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <i className="fab fa-discord"></i>
                            Iniciar sesión con Discord
                        </button>
                    ) : (
                        <>
                            {/* User info */}
                            <div className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-3 mb-6">
                                {localUser.image && (
                                    <img
                                        src={localUser.image}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full"
                                    />
                                )}
                                <div>
                                    <p className="text-white font-medium">{localUser.name || localUser.discordUsername}</p>
                                    <p className="text-gray-400 text-sm">Discord vinculado</p>
                                </div>
                                <i className="fas fa-check-circle text-green-500 ml-auto"></i>
                            </div>

                            {/* Code input form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 text-sm mb-2">
                                        Código de verificación
                                    </label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                        placeholder="12345"
                                        className="w-full bg-gray-700 text-white text-center text-2xl tracking-[0.5em] py-4 px-4 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none placeholder:text-gray-500 placeholder:tracking-normal"
                                        maxLength={5}
                                        disabled={verifying}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={verifying || code.length !== 5}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-all disabled:cursor-not-allowed"
                                >
                                    {verifying ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Verificando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check mr-2"></i>
                                            Verificar Cuenta
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Result message */}
                            {result && (
                                <div
                                    className={`mt-4 p-4 rounded-lg text-center ${result.success
                                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                                        : 'bg-red-500/20 border border-red-500/50 text-red-400'
                                        }`}
                                >
                                    <i className={`fas ${result.success ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
                                    {result.success ? result.message : result.error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Help text */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    ¿Problemas? Usa <code className="text-gray-400">/codigo</code> en el servidor para ver tu código de nuevo.
                </p>
            </div>
        </div>
    );
}
