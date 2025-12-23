'use client';

import { useState, useEffect, useCallback } from 'react';
import { playSound } from '@/src/lib/sounds';

interface ModNotificationToastProps {
  newModsCount: number;
  updatedModsCount?: number;
  onViewNew: () => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

/**
 * Toast de notificación para nuevos mods y actualizaciones
 * Se auto-oculta después de 10 segundos por defecto
 */
export default function ModNotificationToast({
  newModsCount,
  updatedModsCount = 0,
  onViewNew,
  onDismiss,
  autoDismissMs = 10000,
}: ModNotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Esperar animación
  }, [onDismiss]);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissMs <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [autoDismissMs, handleDismiss]);

  // Reproducir sonido al aparecer
  useEffect(() => {
    playSound('confirm');
  }, []);

  const handleViewNew = () => {
    playSound('click');
    onViewNew();
    handleDismiss();
  };

  if (!isVisible) {
    return null;
  }

  const totalNotifications = newModsCount + updatedModsCount;
  if (totalNotifications === 0) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm w-full transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Barra de progreso */}
        <div className="h-1 bg-slate-700">
          <div
            className="h-full bg-poke-green transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          {/* Header con icono */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-poke-green/20 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-bell text-poke-green text-lg animate-bounce"></i>
            </div>

            <div className="flex-1 min-w-0">
              {/* Título */}
              <h4 className="text-white font-bold text-sm mb-1">
                {newModsCount > 0 && updatedModsCount > 0 ? (
                  '¡Novedades disponibles!'
                ) : newModsCount > 0 ? (
                  `¡${newModsCount} nuevo${newModsCount > 1 ? 's' : ''} mod${newModsCount > 1 ? 's' : ''} añadido${newModsCount > 1 ? 's' : ''}!`
                ) : (
                  `¡${updatedModsCount} actualización${updatedModsCount > 1 ? 'es' : ''} disponible${updatedModsCount > 1 ? 's' : ''}!`
                )}
              </h4>

              {/* Detalles */}
              <div className="text-sm text-slate-400 space-y-0.5">
                {newModsCount > 0 && (
                  <p className="flex items-center gap-1">
                    <i className="fas fa-sparkles text-poke-green text-xs"></i>
                    {newModsCount} mod{newModsCount > 1 ? 's' : ''} nuevo{newModsCount > 1 ? 's' : ''}
                  </p>
                )}
                {updatedModsCount > 0 && (
                  <p className="flex items-center gap-1">
                    <i className="fas fa-arrow-up text-orange-400 text-xs"></i>
                    {updatedModsCount} actualización{updatedModsCount > 1 ? 'es' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Cerrar notificación"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleViewNew}
              className="flex-1 px-4 py-2 bg-poke-green hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <i className="fas fa-eye"></i>
              Ver nuevos
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
            >
              Después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
