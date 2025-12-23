'use client';

import { useState } from 'react';
import { detectOS } from '@/src/lib/mod-utils';
import { DetectedOS, INSTALL_PATHS } from '@/src/lib/types/mod';
import { playSound } from '@/src/lib/sounds';

interface InstallGuideProps {
  defaultExpanded?: boolean;
}

/**
 * Componente de guía de instalación de mods
 * Muestra instrucciones específicas por sistema operativo
 */
export default function InstallGuide({ defaultExpanded = false }: InstallGuideProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedOS, setSelectedOS] = useState<DetectedOS>(detectOS());
  const [copied, setCopied] = useState(false);

  const toggleExpanded = () => {
    playSound('click');
    setIsExpanded(!isExpanded);
  };

  const handleOSChange = (os: DetectedOS) => {
    playSound('click');
    setSelectedOS(os);
  };

  const copyPath = async () => {
    const path = INSTALL_PATHS[selectedOS];
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      playSound('confirm');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const osOptions: { os: DetectedOS; name: string; icon: string }[] = [
    { os: 'windows', name: 'Windows', icon: 'fa-windows' },
    { os: 'mac', name: 'macOS', icon: 'fa-apple' },
    { os: 'linux', name: 'Linux', icon: 'fa-linux' },
  ];

  return (
    <div className="card mb-6">
      {/* Header colapsable */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-poke-blue/20 flex items-center justify-center">
            <i className="fas fa-book-open text-poke-blue text-lg"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Cómo Instalar</h3>
            <p className="text-sm text-slate-400">
              Guía paso a paso para instalar los mods
            </p>
          </div>
        </div>
        <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-400 transition-transform`}></i>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-slate-700">
          {/* Selector de OS */}
          <div className="mb-6">
            <label className="text-sm text-slate-400 mb-2 block">
              Selecciona tu sistema operativo:
            </label>
            <div className="flex flex-wrap gap-2">
              {osOptions.map(({ os, name, icon }) => (
                <button
                  key={os}
                  onClick={() => handleOSChange(os)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    selectedOS === os
                      ? 'bg-poke-blue text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <i className={`fab ${icon}`}></i>
                  {name}
                  {detectOS() === os && (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                      Detectado
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Ruta de instalación */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Ruta de instalación:</span>
              <button
                onClick={copyPath}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  copied
                    ? 'bg-poke-green text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <code className="text-poke-yellow font-mono text-sm break-all">
              {INSTALL_PATHS[selectedOS]}
            </code>
          </div>

          {/* Pasos de instalación */}
          <div className="space-y-4">
            <h4 className="text-white font-bold flex items-center gap-2">
              <i className="fas fa-list-ol text-poke-blue"></i>
              Pasos de instalación
            </h4>

            <div className="space-y-3">
              {/* Paso 1 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-poke-blue flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-white font-medium">Descarga los mods</p>
                  <p className="text-sm text-slate-400">
                    Haz clic en &quot;Descargar&quot; en cada mod o usa &quot;Descargar Todo&quot; para obtener todos los mods requeridos en un ZIP.
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-poke-blue flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="text-white font-medium">Abre la carpeta de mods</p>
                  <p className="text-sm text-slate-400">
                    {selectedOS === 'windows' && (
                      <>
                        Presiona <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Win + R</kbd>, escribe{' '}
                        <code className="text-poke-yellow">%appdata%\.minecraft\mods</code> y presiona Enter.
                      </>
                    )}
                    {selectedOS === 'mac' && (
                      <>
                        Abre Finder, presiona <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Cmd + Shift + G</kbd> y escribe{' '}
                        <code className="text-poke-yellow">~/Library/Application Support/minecraft/mods</code>
                      </>
                    )}
                    {selectedOS === 'linux' && (
                      <>
                        Abre tu gestor de archivos y navega a{' '}
                        <code className="text-poke-yellow">~/.minecraft/mods</code> (puede estar oculta, presiona Ctrl+H).
                      </>
                    )}
                    {selectedOS === 'unknown' && (
                      <>
                        Navega a la carpeta <code className="text-poke-yellow">.minecraft/mods</code> en tu directorio de usuario.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-poke-blue flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-white font-medium">Copia los archivos</p>
                  <p className="text-sm text-slate-400">
                    Copia los archivos <code className="text-poke-yellow">.jar</code> descargados a la carpeta de mods.
                    Si descargaste el ZIP, extrae su contenido en la carpeta.
                  </p>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-poke-green flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">4</span>
                </div>
                <div>
                  <p className="text-white font-medium">¡Listo para jugar!</p>
                  <p className="text-sm text-slate-400">
                    Inicia Minecraft con el perfil de <span className="text-poke-yellow">Fabric</span> y conéctate al servidor.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notas importantes */}
          <div className="mt-6 p-4 bg-poke-yellow/10 border border-poke-yellow/30 rounded-lg">
            <div className="flex gap-3">
              <i className="fas fa-exclamation-triangle text-poke-yellow text-lg flex-shrink-0 mt-0.5"></i>
              <div>
                <p className="text-white font-medium mb-1">Importante</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Asegúrate de tener <span className="text-poke-yellow">Fabric Loader</span> instalado.</li>
                  <li>• Los mods marcados como <span className="text-poke-red">Requerido</span> son obligatorios para conectarte.</li>
                  <li>• Si tienes problemas, elimina todos los mods y vuelve a descargarlos.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Link a Fabric */}
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://fabricmc.net/use/installer/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
            >
              <i className="fas fa-download"></i>
              Descargar Fabric Loader
              <i className="fas fa-external-link-alt text-xs text-slate-400"></i>
            </a>
            <a
              href="https://discord.gg/lospitufos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg text-white text-sm transition-colors"
            >
              <i className="fab fa-discord"></i>
              ¿Necesitas ayuda? Discord
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
