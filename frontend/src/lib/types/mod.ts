/**
 * Tipos para el Sistema de Mods
 * Cobblemon Los Pitufos - Frontend
 */

// ============================================
// TIPOS DE MOD
// ============================================

/**
 * Categoría del mod
 */
export type ModCategory = 'required' | 'optional' | 'resourcepack' | 'shader';

/**
 * Loader de mod compatible
 */
export type ModLoader = 'fabric' | 'forge' | 'both';

/**
 * Versión archivada de un mod
 */
export interface ArchivedModVersion {
  version: string;
  filename: string;
  uploadedAt: string;
  checksum?: string;
}

/**
 * Interfaz principal de Mod
 */
export interface Mod {
  _id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  category: ModCategory;
  
  // Información del archivo
  filename: string;
  originalSize: number; // bytes
  compressedSize: number; // bytes
  checksum: string; // SHA-256
  
  // Compatibilidad
  minecraftVersion: string;
  modLoader: ModLoader;
  
  // Metadatos opcionales
  author?: string;
  website?: string;
  changelog?: string;
  downloadUrl?: string; // URL externa de descarga (Modrinth, CurseForge, etc.)
  
  // Estado
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Historial de versiones
  previousVersions: ArchivedModVersion[];
}

// ============================================
// TIPOS DE RESPUESTA API
// ============================================

/**
 * Respuesta de lista de mods
 */
export interface ModListResponse {
  mods: Mod[];
  totalRequired: number;
  totalOptional: number;
  totalResourcePacks: number;
  packageVersion: string;
  packageSize: number;
}

/**
 * Respuesta de versiones de mods
 */
export interface ModVersionsResponse {
  versions: Record<string, string>; // modId -> version
  packageVersion: string;
}

/**
 * Información del paquete ZIP
 */
export interface PackageInfo {
  version: string;
  available: boolean;
  size: number;
  filename: string;
  lastUpdated: string | null;
}

// ============================================
// TIPOS DE LOCALSTORAGE
// ============================================

/**
 * Estructura de datos almacenados en LocalStorage
 */
export interface ModsLocalStorage {
  seenMods: string[]; // IDs de mods que el usuario ha visto
  downloadedMods: Record<string, string>; // modId -> version descargada
  lastVisit: string; // Fecha ISO de última visita
}

// ============================================
// TIPOS DE UI
// ============================================

/**
 * Estado de descarga de un mod
 */
export interface ModDownloadState {
  isDownloading: boolean;
  progress: number; // 0-100
  error: string | null;
}

/**
 * Filtros de búsqueda de mods
 */
export interface ModFilters {
  category: 'all' | ModCategory;
  search: string;
  modLoader?: ModLoader;
}

/**
 * Sistema operativo detectado
 */
export type DetectedOS = 'windows' | 'mac' | 'linux' | 'unknown';

/**
 * Rutas de instalación por OS
 */
export const INSTALL_PATHS: Record<DetectedOS, string> = {
  windows: '%appdata%\\.minecraft\\mods',
  mac: '~/Library/Application Support/minecraft/mods',
  linux: '~/.minecraft/mods',
  unknown: '.minecraft/mods',
};
