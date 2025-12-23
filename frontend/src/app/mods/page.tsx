'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Mod, ModCategory, ModListResponse } from '@/src/lib/types/mod';
import { modsAPI } from '@/src/lib/api-client';
import { ModsStorageService } from '@/src/lib/mods-storage';
import { filterMods, countModsByCategory, formatFileSize, estimateDownloadTime, hasUpdateAvailable } from '@/src/lib/mod-utils';
import { playSound } from '@/src/lib/sounds';
import ModCard from '@/src/components/ModCard';
import ModFilters from '@/src/components/ModFilters';
import InstallGuide from '@/src/components/InstallGuide';
import ModNotificationToast from '@/src/components/ModNotificationToast';

/**
 * Página principal de Mods
 * Muestra todos los mods disponibles con filtros, búsqueda y descarga
 */
export default function ModsPage() {
  // Estado principal
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado de filtros
  const [selectedCategory, setSelectedCategory] = useState<'all' | ModCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de notificaciones
  const [newMods, setNewMods] = useState<string[]>([]);
  const [updatedMods, setUpdatedMods] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  
  // Estado de descargas
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [downloadingPackage, setDownloadingPackage] = useState(false);
  const [packageProgress, setPackageProgress] = useState(0);
  
  // Estado del paquete
  const [packageInfo, setPackageInfo] = useState<{ version: string; size: number } | null>(null);
  
  // Refs
  const newModsRef = useRef<HTMLDivElement>(null);

  // Cargar mods al montar
  useEffect(() => {
    loadMods();
  }, []);

  const loadMods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: ModListResponse = await modsAPI.getAll();
      setMods(response.mods);
      setPackageInfo({
        version: response.packageVersion,
        size: response.packageSize,
      });
      
      // Detectar mods nuevos y actualizaciones
      const currentModIds = response.mods.map(m => m._id);
      const detectedNewMods = ModsStorageService.detectNewMods(currentModIds);
      setNewMods(detectedNewMods);
      
      // Detectar actualizaciones
      const currentVersions: Record<string, string> = {};
      response.mods.forEach(m => {
        currentVersions[m._id] = m.version;
      });
      const detectedUpdates = ModsStorageService.detectUpdatedMods(currentVersions);
      setUpdatedMods(detectedUpdates);
      
      // Mostrar notificación si hay novedades
      if (detectedNewMods.length > 0 || detectedUpdates.length > 0) {
        setShowNotification(true);
      }
      
      // Actualizar última visita
      ModsStorageService.updateLastVisit();
      
    } catch (err) {
      console.error('[ModsPage] Error cargando mods:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los mods');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar mods
  const filteredMods = filterMods(mods, selectedCategory, searchTerm);
  const counts = countModsByCategory(mods);

  // Scroll a mods nuevos
  const scrollToNewMods = useCallback(() => {
    if (newModsRef.current) {
      newModsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Marcar todos como vistos
    ModsStorageService.markModsAsSeen(newMods);
  }, [newMods]);

  // Descargar mod individual
  const handleDownloadMod = async (mod: Mod) => {
    if (downloading[mod._id]) return;
    
    try {
      setDownloading(prev => ({ ...prev, [mod._id]: true }));
      setDownloadProgress(prev => ({ ...prev, [mod._id]: 0 }));
      
      // Simular progreso (la API no soporta progreso real)
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => ({
          ...prev,
          [mod._id]: Math.min((prev[mod._id] || 0) + 10, 90),
        }));
      }, 200);
      
      const blob = await modsAPI.downloadMod(mod._id);
      
      clearInterval(progressInterval);
      setDownloadProgress(prev => ({ ...prev, [mod._id]: 100 }));
      
      // Crear link de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mod.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Marcar como descargado
      ModsStorageService.markModAsDownloaded(mod._id, mod.version);
      
      // Actualizar estado de actualizaciones
      setUpdatedMods(prev => prev.filter(id => id !== mod._id));
      setNewMods(prev => prev.filter(id => id !== mod._id));
      
      playSound('confirm');
      
    } catch (err) {
      console.error('[ModsPage] Error descargando mod:', err);
      playSound('error');
    } finally {
      setDownloading(prev => ({ ...prev, [mod._id]: false }));
      setTimeout(() => {
        setDownloadProgress(prev => ({ ...prev, [mod._id]: 0 }));
      }, 1000);
    }
  };

  // Descargar paquete completo - Descarga ZIP del backend
  const handleDownloadPackage = async () => {
    if (downloadingPackage) return;
    
    try {
      setDownloadingPackage(true);
      setPackageProgress(0);
      playSound('click');
      
      // Simular progreso mientras descarga
      const progressInterval = setInterval(() => {
        setPackageProgress(prev => Math.min(prev + 5, 90));
      }, 500);
      
      // Descargar ZIP del backend
      const blob = await modsAPI.downloadPackage();
      
      clearInterval(progressInterval);
      setPackageProgress(100);
      
      // Crear link de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LosPitufos-Mods-v${packageInfo?.version || '1.0'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Marcar todos los mods requeridos como descargados
      const requiredMods = mods.filter(m => m.category === 'required');
      ModsStorageService.markModsAsDownloaded(
        requiredMods.map(m => ({ id: m._id, version: m.version }))
      );
      
      // Limpiar estados
      setNewMods(prev => prev.filter(id => !requiredMods.find(m => m._id === id)));
      setUpdatedMods(prev => prev.filter(id => !requiredMods.find(m => m._id === id)));
      
      playSound('confirm');
      
    } catch (err) {
      console.error('[ModsPage] Error descargando paquete:', err);
      setError('Error al descargar el paquete. Intenta descargar los mods individualmente.');
      playSound('error');
    } finally {
      setDownloadingPackage(false);
      setTimeout(() => setPackageProgress(0), 1000);
    }
  };

  // Cerrar notificación
  const handleDismissNotification = () => {
    setShowNotification(false);
    // Marcar mods como vistos
    ModsStorageService.markModsAsSeen(newMods);
  };

  // Calcular tamaño total de mods requeridos
  const totalRequiredSize = mods
    .filter(m => m.category === 'required')
    .reduce((acc, m) => acc + m.originalSize, 0);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <i className="fas fa-puzzle-piece text-poke-blue mr-3"></i>
            Mods del Servidor
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Descarga los mods necesarios para jugar en Cobblemon Los Pitufos.
            Los mods marcados como <span className="text-poke-red font-medium">Requerido</span> son obligatorios.
          </p>
        </div>

        {/* Guía de instalación */}
        <InstallGuide />

        {/* Botón de descarga completa */}
        {!loading && !error && counts.required > 0 && (
          <div className="card mb-6 bg-gradient-to-r from-poke-green/20 to-poke-blue/20 border-poke-green/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <i className="fas fa-box-open text-poke-green"></i>
                  Paquete Completo
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Descarga todos los mods requeridos en un solo archivo ZIP.
                </p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span className="text-slate-300">
                    <i className="fas fa-cubes mr-1 text-poke-blue"></i>
                    {counts.required} mods requeridos
                  </span>
                  <span className="text-slate-300">
                    <i className="fas fa-file-archive mr-1 text-poke-yellow"></i>
                    {formatFileSize(packageInfo?.size || totalRequiredSize)}
                  </span>
                  <span className="text-slate-300">
                    <i className="fas fa-clock mr-1 text-slate-400"></i>
                    {estimateDownloadTime(packageInfo?.size || totalRequiredSize)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleDownloadPackage}
                disabled={downloadingPackage}
                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  downloadingPackage
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-poke-green hover:bg-green-600 text-white shadow-lg hover:shadow-poke-green/30'
                }`}
              >
                {downloadingPackage ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Descargando... {packageProgress > 0 ? `${packageProgress}%` : ''}</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-download"></i>
                    <span>Descargar ZIP</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Barra de progreso del paquete */}
            {downloadingPackage && packageProgress > 0 && (
              <div className="mt-4 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-poke-green h-full transition-all duration-300"
                  style={{ width: `${packageProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Filtros */}
        {!loading && !error && mods.length > 0 && (
          <ModFilters
            totalMods={counts.total}
            filteredCount={filteredMods.length}
            requiredCount={counts.required}
            optionalCount={counts.optional}
            resourcePackCount={counts.resourcepack}
            shaderCount={counts.shader}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchTerm}
          />
        )}

        {/* Estado de carga */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-poke-blue/30 border-t-poke-blue rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400">Cargando mods...</p>
          </div>
        )}

        {/* Estado de error */}
        {error && (
          <div className="card bg-poke-red/10 border-poke-red/30 text-center py-12">
            <i className="fas fa-exclamation-triangle text-5xl text-poke-red mb-4"></i>
            <h3 className="text-xl font-bold text-white mb-2">Error al cargar los mods</h3>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={loadMods}
              className="px-6 py-2 bg-poke-red hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              <i className="fas fa-redo mr-2"></i>
              Reintentar
            </button>
          </div>
        )}

        {/* Lista de mods */}
        {!loading && !error && (
          <div ref={newModsRef}>
            {filteredMods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMods.map((mod) => (
                  <ModCard
                    key={mod._id}
                    mod={mod}
                    isNew={newMods.includes(mod._id)}
                    hasUpdate={updatedMods.includes(mod._id) || hasUpdateAvailable(mod.version, ModsStorageService.getDownloadedVersion(mod._id))}
                    isDownloading={downloading[mod._id] || false}
                    downloadProgress={downloadProgress[mod._id] || 0}
                    downloadedVersion={ModsStorageService.getDownloadedVersion(mod._id)}
                    onDownload={() => handleDownloadMod(mod)}
                  />
                ))}
              </div>
            ) : mods.length === 0 ? (
              <div className="card text-center py-12">
                <i className="fas fa-box-open text-5xl text-slate-600 mb-4"></i>
                <h3 className="text-xl font-bold text-white mb-2">No hay mods disponibles</h3>
                <p className="text-slate-400">
                  Los mods del servidor se añadirán próximamente.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Notificación de nuevos mods */}
        {showNotification && (newMods.length > 0 || updatedMods.length > 0) && (
          <ModNotificationToast
            newModsCount={newMods.length}
            updatedModsCount={updatedMods.length}
            onViewNew={scrollToNewMods}
            onDismiss={handleDismissNotification}
          />
        )}
      </div>
    </div>
  );
}
