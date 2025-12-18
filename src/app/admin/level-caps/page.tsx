'use client';

import { useState, useEffect } from 'react';

interface GlobalConfig {
    captureCapEnabled: boolean;
    ownershipCapEnabled: boolean;
    defaultCaptureCapFormula: string;
    defaultOwnershipCapFormula: string;
    enforcementMode: 'hard' | 'soft';
}

interface StaticRule {
    id: string;
    name: string;
    priority: number;
    active: boolean;
    captureCap?: number;
    ownershipCap?: number;
    conditions: any;
    notes: string;
}

export default function LevelCapsAdmin() {
    const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);
    const [staticRules, setStaticRules] = useState<StaticRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('config');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [configRes, staticRes] = await Promise.all([
                fetch('/api/admin/level-caps/config'),
                fetch('/api/admin/level-caps/static-rules')
            ]);

            const configData = await configRes.json();
            const staticData = await staticRes.json();

            if (configData.success) setGlobalConfig(configData.config);
            if (staticData.success) setStaticRules(staticData.rules);
        } catch (error) {
            console.error('Error loading level caps:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveGlobalConfig = async () => {
        if (!globalConfig) return;

        try {
            setSaving(true);
            const res = await fetch('/api/admin/level-caps/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(globalConfig)
            });

            const data = await res.json();
            if (data.success) {
                alert('✅ Configuración guardada exitosamente');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            alert('❌ Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    const createStaticRule = async () => {
        const name = prompt('Nombre de la regla:');
        if (!name) return;

        const newRule = {
            name,
            priority: staticRules.length + 1,
            active: true,
            captureCap: 50,
            ownershipCap: 100,
            conditions: {},
            notes: ''
        };

        try {
            const res = await fetch('/api/admin/level-caps/static-rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRule)
            });

            const data = await res.json();
            if (data.success) {
                setStaticRules([...staticRules, data.rule]);
            }
        } catch (error) {
            console.error('Error creating rule:', error);
        }
    };

    const deleteStaticRule = async (id: string) => {
        if (!confirm('¿Eliminar esta regla?')) return;

        try {
            const res = await fetch(`/api/admin/level-caps/static-rules/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setStaticRules(staticRules.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error('Error deleting rule:', error);
        }
    };

    const toggleRule = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/level-caps/static-rules/${id}`, {
                method: 'PATCH'
            });

            const data = await res.json();
            if (data.success) {
                setStaticRules(staticRules.map(r =>
                    r.id === id ? { ...r, active: data.active } : r
                ));
            }
        } catch (error) {
            console.error('Error toggling rule:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">⏳ Cargando...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">🎮 Gestión de Level Caps</h1>
                    <p className="text-gray-600">
                        Controla los niveles máximos de captura y posesión
                    </p>
                </div>
                <button
                    onClick={loadData}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                >
                    🔄 Recargar
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === 'config'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        ⚙️ Configuración Global
                    </button>
                    <button
                        onClick={() => setActiveTab('static')}
                        className={`px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === 'static'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        📋 Reglas Estáticas
                    </button>
                </div>
            </div>

            {/* Config Tab */}
            {activeTab === 'config' && globalConfig && (
                <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Configuración Global</h2>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={globalConfig.captureCapEnabled}
                                onChange={(e) =>
                                    setGlobalConfig({ ...globalConfig, captureCapEnabled: e.target.checked })
                                }
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <div>
                                <span className="font-medium block">Habilitar Capture Cap</span>
                                <span className="text-sm text-gray-500">Limitar nivel de Pokémon capturables</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={globalConfig.ownershipCapEnabled}
                                onChange={(e) =>
                                    setGlobalConfig({ ...globalConfig, ownershipCapEnabled: e.target.checked })
                                }
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <div>
                                <span className="font-medium block">Habilitar Ownership Cap</span>
                                <span className="text-sm text-gray-500">Limitar nivel máximo de Pokémon propios</span>
                            </div>
                        </label>

                        <div className="space-y-2">
                            <label className="block font-medium text-gray-700">Fórmula Capture Cap por Defecto</label>
                            <input
                                type="text"
                                value={globalConfig.defaultCaptureCapFormula}
                                onChange={(e) =>
                                    setGlobalConfig({
                                        ...globalConfig,
                                        defaultCaptureCapFormula: e.target.value
                                    })
                                }
                                placeholder="Ej: min(badges * 5, 50)"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500">
                                Variables disponibles: badges, playtime, level
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="block font-medium text-gray-700">Fórmula Ownership Cap por Defecto</label>
                            <input
                                type="text"
                                value={globalConfig.defaultOwnershipCapFormula}
                                onChange={(e) =>
                                    setGlobalConfig({
                                        ...globalConfig,
                                        defaultOwnershipCapFormula: e.target.value
                                    })
                                }
                                placeholder="Ej: max(playtime / 10, 5)"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <button
                            onClick={saveGlobalConfig}
                            disabled={saving}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            💾 {saving ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </div>
            )}

            {/* Static Rules Tab */}
            {activeTab === 'static' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Reglas Estáticas</h2>
                        <button
                            onClick={createStaticRule}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                        >
                            ➕ Nueva Regla
                        </button>
                    </div>

                    {staticRules.length === 0 ? (
                        <div className="bg-white p-12 rounded-lg border shadow-sm text-center">
                            <div className="text-6xl mb-4">📋</div>
                            <p className="text-gray-500 mb-4">No hay reglas estáticas configuradas</p>
                            <button
                                onClick={createStaticRule}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                ➕ Crear Primera Regla
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {staticRules.map((rule) => (
                                <div key={rule.id} className="bg-white p-6 rounded-lg border shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <h3 className="text-lg font-semibold">{rule.name}</h3>
                                                <span className={`px-3 py-1 text-xs rounded-full font-medium ${rule.active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {rule.active ? '✅ Activa' : '⏸️ Inactiva'}
                                                </span>
                                                <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                                                    Prioridad: {rule.priority}
                                                </span>
                                            </div>
                                            {rule.notes && (
                                                <p className="text-sm text-gray-600">{rule.notes}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => toggleRule(rule.id)}
                                                className="px-3 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
                                                title={rule.active ? 'Desactivar' : 'Activar'}
                                            >
                                                {rule.active ? '⏸️' : '▶️'}
                                            </button>
                                            <button
                                                onClick={() => deleteStaticRule(rule.id)}
                                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-700">Capture Cap:</span>
                                            <span className="ml-2 px-3 py-1 bg-gray-100 rounded-lg text-sm font-mono">
                                                {rule.captureCap ?? 'Sin límite'}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-700">Ownership Cap:</span>
                                            <span className="ml-2 px-3 py-1 bg-gray-100 rounded-lg text-sm font-mono">
                                                {rule.ownershipCap ?? 'Sin límite'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
