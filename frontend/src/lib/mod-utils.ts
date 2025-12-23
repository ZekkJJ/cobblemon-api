/**
 * Utilidades para el Sistema de Mods
 * Cobblemon Los Pitufos - Frontend
 * 
 * Funciones de utilidad para comparación de versiones, detección de OS y filtrado
 */

import { Mod, ModCategory, DetectedOS, INSTALL_PATHS } from './types/mod';

// ============================================
// COMPARACIÓN DE VERSIONES
// ============================================

/**
 * Compara dos versiones semánticas
 * @param v1 Primera versión
 * @param v2 Segunda versión
 * @returns 1 si v1 > v2, -1 si v1 < v2, 0 si son iguales
 */
export function compareVersions(v1: string, v2: string): number {
  // Limpiar sufijos como -beta, -alpha, -SNAPSHOT, etc.
  const cleanVersion = (v: string): string => {
    return v.replace(/[-+].*$/, '').trim();
  };
  
  const parts1 = cleanVersion(v1).split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = cleanVersion(v2).split('.').map(p => parseInt(p, 10) || 0);
  
  // Asegurar que ambos tengan al menos 3 partes
  while (parts1.length < 3) parts1.push(0);
  while (parts2.length < 3) parts2.push(0);
  
  // Comparar cada parte
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  
  return 0;
}

/**
 * Verifica si hay una actualización disponible
 * @param currentVersion Versión actual del servidor
 * @param downloadedVersion Versión descargada por el usuario
 * @returns true si currentVersion > downloadedVersion
 */
export function hasUpdateAvailable(currentVersion: string, downloadedVersion: string | null): boolean {
  if (!downloadedVersion) return false;
  return compareVersions(currentVersion, downloadedVersion) > 0;
}

/**
 * Formatea una versión para mostrar
 */
export function formatVersion(version: string): string {
  return `v${version}`;
}

// ============================================
// DETECCIÓN DE SISTEMA OPERATIVO
// ============================================

/**
 * Detecta el sistema operativo del usuario
 * @returns Sistema operativo detectado
 */
export function detectOS(): DetectedOS {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  // Detectar Windows
  if (userAgent.includes('win') || platform.includes('win')) {
    return 'windows';
  }

  // Detectar Mac
  if (
    userAgent.includes('mac') ||
    platform.includes('mac') ||
    userAgent.includes('iphone') ||
    userAgent.includes('ipad')
  ) {
    return 'mac';
  }

  // Detectar Linux
  if (
    userAgent.includes('linux') ||
    platform.includes('linux') ||
    userAgent.includes('android')
  ) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Obtiene la ruta de instalación para el OS detectado
 */
export function getInstallPath(os?: DetectedOS): string {
  const detectedOS = os || detectOS();
  return INSTALL_PATHS[detectedOS];
}

/**
 * Obtiene el nombre legible del OS
 */
export function getOSName(os?: DetectedOS): string {
  const detectedOS = os || detectOS();
  
  const names: Record<DetectedOS, string> = {
    windows: 'Windows',
    mac: 'macOS',
    linux: 'Linux',
    unknown: 'Tu sistema',
  };
  
  return names[detectedOS];
}

// ============================================
// FILTRADO DE MODS
// ============================================

/**
 * Filtra mods por categoría y término de búsqueda
 * @param mods Lista de mods
 * @param category Categoría a filtrar ('all' para todas)
 * @param searchTerm Término de búsqueda
 * @returns Mods filtrados
 */
export function filterMods(
  mods: Mod[],
  category: 'all' | ModCategory,
  searchTerm: string
): Mod[] {
  return mods.filter(mod => {
    // Filtrar por categoría
    const matchesCategory = category === 'all' || mod.category === category;
    
    // Filtrar por búsqueda (case-insensitive)
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch = !search || 
      mod.name.toLowerCase().includes(search) ||
      mod.description.toLowerCase().includes(search) ||
      (mod.author?.toLowerCase().includes(search) ?? false);
    
    return matchesCategory && matchesSearch;
  });
}

/**
 * Cuenta mods por categoría
 */
export function countModsByCategory(mods: Mod[]): {
  required: number;
  optional: number;
  resourcepack: number;
  shader: number;
  total: number;
} {
  return {
    required: mods.filter(m => m.category === 'required').length,
    optional: mods.filter(m => m.category === 'optional').length,
    resourcepack: mods.filter(m => m.category === 'resourcepack').length,
    shader: mods.filter(m => m.category === 'shader').length,
    total: mods.length,
  };
}

// ============================================
// FORMATEO DE TAMAÑOS
// ============================================

/**
 * Formatea bytes a una cadena legible
 * @param bytes Tamaño en bytes
 * @returns Cadena formateada (ej: "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Estima el tiempo de descarga
 * @param bytes Tamaño en bytes
 * @param speedMbps Velocidad en Mbps (default: 10)
 * @returns Tiempo estimado en formato legible
 */
export function estimateDownloadTime(bytes: number, speedMbps: number = 10): string {
  const speedBps = speedMbps * 1024 * 1024 / 8; // Convertir Mbps a bytes/segundo
  const seconds = bytes / speedBps;
  
  if (seconds < 1) return 'menos de 1 segundo';
  if (seconds < 60) return `~${Math.ceil(seconds)} segundos`;
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)} minutos`;
  
  return `~${(seconds / 3600).toFixed(1)} horas`;
}

// ============================================
// UTILIDADES DE CATEGORÍA
// ============================================

/**
 * Obtiene el color de badge para una categoría
 */
export function getCategoryBadgeColor(category: ModCategory): string {
  switch (category) {
    case 'required':
      return 'bg-poke-red text-white';
    case 'optional':
      return 'bg-poke-blue text-white';
    case 'resourcepack':
      return 'bg-poke-purple text-white';
    case 'shader':
      return 'bg-poke-yellow text-black';
    default:
      return 'bg-slate-600 text-white';
  }
}

/**
 * Obtiene el texto de badge para una categoría
 */
export function getCategoryBadgeText(category: ModCategory): string {
  switch (category) {
    case 'required':
      return 'Requerido';
    case 'optional':
      return 'Opcional';
    case 'resourcepack':
      return 'Resource Pack';
    case 'shader':
      return 'Shader';
    default:
      return category;
  }
}

/**
 * Obtiene el icono para una categoría
 */
export function getCategoryIcon(category: ModCategory): string {
  switch (category) {
    case 'required':
      return 'fa-exclamation-circle';
    case 'optional':
      return 'fa-plus-circle';
    case 'resourcepack':
      return 'fa-palette';
    case 'shader':
      return 'fa-sun';
    default:
      return 'fa-cube';
  }
}

// ============================================
// UTILIDADES DE MOD LOADER
// ============================================

/**
 * Obtiene el color para un mod loader
 */
export function getModLoaderColor(loader: string): string {
  switch (loader.toLowerCase()) {
    case 'fabric':
      return 'text-yellow-400';
    case 'forge':
      return 'text-orange-400';
    case 'both':
      return 'text-poke-green';
    default:
      return 'text-slate-400';
  }
}

/**
 * Obtiene el texto para un mod loader
 */
export function getModLoaderText(loader: string): string {
  switch (loader.toLowerCase()) {
    case 'fabric':
      return 'Fabric';
    case 'forge':
      return 'Forge';
    case 'both':
      return 'Fabric/Forge';
    default:
      return loader;
  }
}
