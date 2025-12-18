'use client';
import { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';

export default function AdminResetPage() {
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    async function handleReset() {
        if (confirmText !== 'RESET_ALL_DATA') {
            setError('Debes escribir exactamente: RESET_ALL_DATA');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/admin/reset-db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmReset: confirmText })
            });

            const data = await res.json();

            if (res.ok) {
                setResult(data);
                setConfirmText('');
            } else {
                setError(data.error || 'Error al resetear');
            }
        } catch (e) {
            setError('Error de conexión');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border-2 border-red-500 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">⚠️ ZONA PELIGROSA</h2>
                        <p className="text-red-300">Resetear Base de Datos</p>
                    </div>
                </div>

                <div className="bg-black/30 rounded-lg p-4 mb-6 border border-red-500/30">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        ADVERTENCIA
                    </h3>
                    <ul className="text-sm text-red-200 space-y-1 list-disc list-inside">
                        <li>Eliminará TODOS los usuarios</li>
                        <li>Eliminará TODOS los starters reclamados</li>
                        <li>Eliminará TODOS los torneos</li>
                        <li>Esta acción NO se puede deshacer</li>
                        <li>Todos tendrán que volver a tirar</li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-red-300 mb-2">
                            Escribe <code className="bg-black/50 px-2 py-1 rounded text-yellow-400">RESET_ALL_DATA</code> para confirmar:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="RESET_ALL_DATA"
                            className="w-full bg-gray-900 border border-red-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20 font-mono"
                        />
                    </div>

                    <button
                        onClick={handleReset}
                        disabled={loading || confirmText !== 'RESET_ALL_DATA'}
                        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Reseteando...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-5 h-5" />
                                RESETEAR TODA LA BASE DE DATOS
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {result && (
                        <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg space-y-2">
                            <p className="font-bold">✅ Base de datos reseteada exitosamente</p>
                            <div className="text-sm space-y-1">
                                <p>• {result.deleted?.users || 0} usuarios eliminados</p>
                                <p>• {result.deleted?.starters || 0} starters eliminados</p>
                                <p>• {result.deleted?.tournaments || 0} torneos eliminados</p>
                                <p className="text-xs text-gray-400 mt-2">Timestamp: {result.timestamp}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-bold mb-4">📋 Qué hacer después de resetear:</h3>
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                    <li>Todos los usuarios tendrán que iniciar sesión nuevamente</li>
                    <li>Los jugadores en Minecraft deberán reconectarse</li>
                    <li>Tendrán que hacer /verify de nuevo</li>
                    <li>Podrán tirar un starter nuevo en el website</li>
                    <li>El mod les dará el nuevo starter automáticamente</li>
                </ol>
            </div>
        </div>
    );
}
