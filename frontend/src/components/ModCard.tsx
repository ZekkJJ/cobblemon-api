'use client';

import { useState } from 'react';
import { Mod } from '@/src/lib/types/mod';
import {
  formatFileSize,
  getCategoryBadgeColor,
  getCategoryBadgeText,
  getCategoryIcon,
  getModLoaderColor,
  getModLoaderText,
  formatVersion,
} from '@/src/lib/mod-utils';
import { playSound } from '@/src/lib/sounds';

interface ModCardProps {
  mod: Mod;
  isNew: boolean;
  hasUpdate: boolean;
  isDownloading: boolean;
  downloadProgress?: number;
  downloadedVersion: string | null;
  onDownload: () => void;
}

/**
 * Componente de tarjeta de mod
 * Muestra información de un mod con opciones de descarga
 */
export default function ModCard({
  mod,
  isNew,
  hasUpdate,
  isDownloading,
  downloadProgress = 0,
  downloadedVersion,
  onDownload,
}: ModCardProps) {
  const [showChangelog, setShowChangelog] = useState(false);

  const handleDownload = () => {
    playSound('click');
    onDownload();
  };

  const toggleChangelog = () => {
    playSound('click');
    setShowChangelog(!showChangelog);
  };

  return (
    <div className="card group relative overflow-hidden">
      {/* Badges superiores */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
        {/* Badge de categoría */}
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getCategoryBadgeColor(mod.category)}`}>
          <i className={`fas ${getCategoryIcon(mod.category)} mr-1`}></i>
          {getCategoryBadgeText(mod.category)}
        </span>

        {/* Badge de NUEVO */}
        {isNew && (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-poke-green text-white animate-pulse">
            <i className="fas fa-sparkles mr-1"></i>
            NUEVO
          </span>
        )}

        {/* Badge de actualización */}
        {hasUpdate && !isNew && (
          <span className="px-2 py-1 rounded-full text-xs font-bold bg-orange-500 text-white">
            <i className="fas fa-arrow-up mr-1"></i>
            Actualización
          </span>
        )}
      </div>

      {/* Contenido principal */}
      <div className="pr-24">
        {/* Nombre y versión */}
        <h3 className="text-xl font-bold mb-1 text-white group-hover:text-poke-blue transition-colors">
          {mod.name}
        </h3>
        
        <div className="flex items-center gap-3 mb-3 text-sm">
          <span className="text-poke-yellow font-mono">
            {formatVersion(mod.version)}
          </span>
          <span className={`${getModLoaderColor(mod.modLoader)}`}>
            <i className="fas fa-cube mr-1"></i>
            {getModLoaderText(mod.modLoader)}
          </span>
          <span className="text-slate-400">
            MC {mod.minecraftVersion}
          </span>
        </div>

        {/* Descripción */}
        <p className="text-slate-300 text-sm mb-4 line-clamp-2">
          {mod.description}
        </p>

        {/* Información del archivo */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-400 mb-4">
          <span>
            <i className="fas fa-file mr-1"></i>
            {formatFileSize(mod.originalSize)}
          </span>
          {mod.author && (
            <span>
              <i className="fas fa-user mr-1"></i>
              {mod.author}
            </span>
          )}
          {mod.website && (
            <a
              href={mod.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-poke-blue hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="fas fa-external-link-alt mr-1"></i>
              Web
            </a>
          )}
        </div>

        {/* Versión descargada */}
        {downloadedVersion && (
          <div className="text-xs text-slate-500 mb-3">
            <i className="fas fa-check-circle text-poke-green mr-1"></i>
            Descargado: {formatVersion(downloadedVersion)}
            {hasUpdate && (
              <span className="text-orange-400 ml-2">
                → {formatVersion(mod.version)}
              </span>
            )}
          </div>
        )}

        {/* Changelog (si existe) */}
        {mod.changelog && (
          <div className="mb-4">
            <button
              onClick={toggleChangelog}
              className="text-xs text-poke-blue hover:underline"
            >
              <i className={`fas fa-chevron-${showChangelog ? 'up' : 'down'} mr-1`}></i>
              {showChangelog ? 'Ocultar' : 'Ver'} changelog
            </button>
            
            {showChangelog && (
              <div className="mt-2 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-300 max-h-32 overflow-y-auto">
                {mod.changelog}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón de descarga */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`w-full py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
            isDownloading
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : hasUpdate
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-poke-green hover:bg-green-600 text-white'
          }`}
        >
          {isDownloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Descargando... {downloadProgress > 0 ? `${downloadProgress}%` : ''}</span>
            </>
          ) : hasUpdate ? (
            <>
              <i className="fas fa-sync-alt"></i>
              <span>Actualizar</span>
            </>
          ) : downloadedVersion ? (
            <>
              <i className="fas fa-redo"></i>
              <span>Descargar de nuevo</span>
            </>
          ) : (
            <>
              <i className="fas fa-download"></i>
              <span>Descargar</span>
            </>
          )}
        </button>

        {/* Barra de progreso */}
        {isDownloading && downloadProgress > 0 && (
          <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-poke-green h-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
