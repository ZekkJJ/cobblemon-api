'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cobblemon-los-pitufos-backend.onrender.com';

interface ServicePricing {
  battleAnalysis: number;
  aiTutor: number;
  breedAdvisor: number;
}

interface ServiceCooldowns {
  battleAnalysis: number;
  aiTutor: number;
  breedAdvisor: number;
}

interface DailyLimits {
  battleAnalysis: number;
  aiTutor: number;
  breedAdvisor: number;
}

interface SuspiciousActivity {
  _id: string;
  discordId: string;
  minecraftUuid?: string;
  activityType: string;
  details: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  action?: string;
}

export default function AdminTutoriasPanel() {
  const [pricing, setPricing] = useState<ServicePricing>({
    battleAnalysis: 500,
    aiTutor: 200,
    breedAdvisor: 300
  });
  const [cooldowns, setCooldowns] = useState<ServiceCooldowns>({
    battleAnalysis: 30,
    aiTutor: 5,
    breedAdvisor: 15
  });
  const [dailyLimits, setDailyLimits] = useState<DailyLimits>({
    battleAnalysis: 5,
    aiTutor: 20,
    breedAdvisor: 10
  });
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'pricing' | 'suspicious'>('pricing');

  useEffect(() => {
    loadConfig();
    loadSuspiciousActivities();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tutorias/pricing`);
      if (response.ok) {
        const data = await response.json();
        if (data.pricing) {
          setPricing({
            battleAnalysis: data.pricing.battleAnalysis || 500,
            aiTutor: data.pricing.aiTutor || 200,
            breedAdvisor: data.pricing.breedAdvisor || 300
          });
        }
        if (data.pricing?.cooldowns) {
          setCooldowns(data.pricing.cooldowns);
        }
        if (data.pricing?.dailyLimits) {
          setDailyLimits(data.pricing.dailyLimits);
        }
      }
    } catch (error) {
      console.error('Error loading tutorias config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuspiciousActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/suspicious-activity`);
      if (response.ok) {
        const data = await response.json();
        setSuspiciousActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error loading suspicious activities:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/tutorias/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricing,
          cooldowns,
          dailyLimits
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Configuración guardada correctamente' });
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error al guardar configuración' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const resolveActivity = async (activityId: string, action: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/suspicious-activity/${activityId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        loadSuspiciousActivities();
        setMessage({ type: 'success', text: '✅ Actividad resuelta' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Error al resolver actividad' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500';
    }
  };

  const serviceLabels = {
    battleAnalysis: 'Análisis de Batallas',
    aiTutor: 'AI Tutor',
    breedAdvisor: 'Asesor de Breeding'
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <i className="fas fa-graduation-cap text-purple-500"></i>
        Tutorías - Configuración
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pricing'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          💰 Precios y Límites
        </button>
        <button
          onClick={() => setActiveTab('suspicious')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'suspicious'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          ⚠️ Actividad Sospechosa ({suspiciousActivities.filter(a => !a.resolved).length})
        </button>
      </div>

      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Pricing */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">💰 Precios (CobbleDollars)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(pricing) as Array<keyof ServicePricing>).map(service => (
                <div key={service} className="bg-slate-800 rounded-lg p-4">
                  <label className="block text-sm text-slate-400 mb-2">
                    {serviceLabels[service]}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pricing[service]}
                    onChange={(e) => setPricing(prev => ({
                      ...prev,
                      [service]: parseInt(e.target.value) || 0
                    }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Cooldowns */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">⏱️ Cooldowns (minutos)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(cooldowns) as Array<keyof ServiceCooldowns>).map(service => (
                <div key={service} className="bg-slate-800 rounded-lg p-4">
                  <label className="block text-sm text-slate-400 mb-2">
                    {serviceLabels[service]}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={cooldowns[service]}
                    onChange={(e) => setCooldowns(prev => ({
                      ...prev,
                      [service]: parseInt(e.target.value) || 0
                    }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Daily Limits */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">📊 Límites Diarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(dailyLimits) as Array<keyof DailyLimits>).map(service => (
                <div key={service} className="bg-slate-800 rounded-lg p-4">
                  <label className="block text-sm text-slate-400 mb-2">
                    {serviceLabels[service]}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={dailyLimits[service]}
                    onChange={(e) => setDailyLimits(prev => ({
                      ...prev,
                      [service]: parseInt(e.target.value) || 1
                    }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                : 'bg-red-500/20 border border-red-500/50 text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white py-3 px-6 rounded-lg font-bold transition-all"
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
      )}

      {activeTab === 'suspicious' && (
        <div className="space-y-4">
          {suspiciousActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <i className="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
              <p>No hay actividades sospechosas pendientes</p>
            </div>
          ) : (
            suspiciousActivities.map(activity => (
              <div
                key={activity._id}
                className={`border rounded-lg p-4 ${getSeverityColor(activity.severity)} ${
                  activity.resolved ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(activity.severity)}`}>
                      {activity.severity}
                    </span>
                    <span className="ml-2 text-white font-medium">{activity.activityType}</span>
                  </div>
                  <span className="text-slate-400 text-sm">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="text-sm text-slate-300 mb-2">
                  <p>Discord ID: {activity.discordId}</p>
                  {activity.minecraftUuid && <p>UUID: {activity.minecraftUuid}</p>}
                </div>

                {activity.details && (
                  <pre className="text-xs bg-slate-900/50 rounded p-2 overflow-x-auto mb-3">
                    {JSON.stringify(activity.details, null, 2)}
                  </pre>
                )}

                {activity.resolved ? (
                  <div className="text-sm text-green-400">
                    ✅ Resuelto por {activity.resolvedBy} - Acción: {activity.action}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveActivity(activity._id, 'WARNED')}
                      className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm hover:bg-yellow-500/30"
                    >
                      ⚠️ Advertir
                    </button>
                    <button
                      onClick={() => resolveActivity(activity._id, 'TEMP_BAN')}
                      className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded text-sm hover:bg-orange-500/30"
                    >
                      🚫 Ban Temporal
                    </button>
                    <button
                      onClick={() => resolveActivity(activity._id, 'DISMISSED')}
                      className="px-3 py-1 bg-slate-500/20 text-slate-400 rounded text-sm hover:bg-slate-500/30"
                    >
                      ✓ Descartar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
