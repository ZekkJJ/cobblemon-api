'use client';

import { useState, useEffect } from 'react';

interface GlobalConfig {
    captureCapEnabled: boolean;
    ownershipCapEnabled: boolean;
    defaultCaptureCapFormula: string;
    defaultOwnershipCapFormula: string;
    enforcementMode: 'hard' | 'soft';
}

export default function LevelCapsAdmin() {
    const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const configRes = await fetch('/api/admin/level-caps/config');
            const configData = await configRes.json();

            if (configData.success) setGlobalConfig(configData.config);
        } catch (error) {
            console.error('Error loading level caps:', error);
            setError('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const saveGlobalConfig = async () => {
        if (!globalConfig) return;

        try {
            setSaving(true);
            setError('');
            setSuccess('');
            
            const res = await fetch('/api/admin/level-caps/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(globalConfig)
            });

            const data = await res.json();
            if (data.success) {
                setSuccess('✅ Configuración guardada exitosamente');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError('❌ Error al guardar configuración');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            setError('❌ Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-white">⏳ Cargando...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">🎮 Level Caps</h1>
                <p className="text-slate-400">
                    Limita el nivel máximo de Pokémon que los jugadores pueden tener
                </p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
                    {success}
                </div>
            )}

            {/* Config Card */}
            {globalConfig && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-2">⚙️ Configuración Simple</h2>
                        <p className="text-slate-400 text-sm">
                            Por ahora solo números fijos. El sistema de badges/fórmulas estará disponible próximamente.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Capture Cap */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={globalConfig.captureCapEnabled}
                                    onChange={(e) =>
                                        setGlobalConfig({ ...globalConfig, captureCapEnabled: e.target.checked })
                                    }
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <div>
                                    <span className="font-medium text-white block">Capture Cap</span>
                                    <span className="text-sm text-slate-400">
                                        Pokémon salvajes de nivel superior NO se pueden capturar
                                    </span>
                                </div>
                            </label>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nivel máximo para capturar:
                                </label>
                                <input
                                    type="number"
                                    value={parseInt(globalConfig.defaultCaptureCapFormula) || 50}
                                    onChange={(e) =>
                                        setGlobalConfig({
                                            ...globalConfig,
                                            defaultCaptureCapFormula: e.target.value
                                        })
                                    }
                                    disabled={!globalConfig.captureCapEnabled}
                                    className="w-32 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    placeholder="50"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Ejemplo: Si pones 50, solo se pueden capturar Pokémon nivel 50 o menos
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-6"></div>

                        {/* Ownership Cap */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={globalConfig.ownershipCapEnabled}
                                    onChange={(e) =>
                                        setGlobalConfig({ ...globalConfig, ownershipCapEnabled: e.target.checked })
                                    }
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <div>
                                    <span className="font-medium text-white block">Ownership Cap</span>
                                    <span className="text-sm text-slate-400">
                                        Tus Pokémon NO pueden superar este nivel (bloqueado ganar EXP)
                                    </span>
                                </div>
                            </label>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Nivel máximo de tus Pokémon:
                                </label>
                                <input
                                    type="number"
                                    value={parseInt(globalConfig.defaultOwnershipCapFormula) || 100}
                                    onChange={(e) =>
                                        setGlobalConfig({
                                            ...globalConfig,
                                            defaultOwnershipCapFormula: e.target.value
                                        })
                                    }
                                    disabled={!globalConfig.ownershipCapEnabled}
                                    className="w-32 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                                    placeholder="100"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Ejemplo: Si pones 60, tus Pokémon no pueden subir más allá del nivel 60
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 pt-6"></div>

                        {/* Save Button */}
                        <button
                            onClick={saveGlobalConfig}
                            disabled={saving}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            {saving ? '⏳ Guardando...' : '💾 Guardar Configuración'}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
