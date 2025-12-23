/**
 * Servicio de LocalStorage para Mods
 * Cobblemon Los Pitufos - Frontend
 * 
 * Gestiona el almacenamiento local de mods vistos y descargados
 */

import { ModsLocalStorage } from './types/mod';

const STORAGE_KEY = 'cobblemon-mods-cache';

/**
 * Obtiene los datos del LocalStorage
 */
function getStorageData(): ModsLocalStorage {
  if (typeof window === 'undefined') {
    return {
      seenMods: [],
      downloadedMods: {},
      lastVisit: new Date().toISOString(),
    };
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[ModsStorage] Error leyendo localStorage:', error);
  }

  return {
    seenMods: [],
    downloadedMods: {},
    lastVisit: new Date().toISOString(),
  };
}

/**
 * Guarda los datos en LocalStorage
 */
function saveStorageData(data: ModsLocalStorage): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[ModsStorage] Error guardando localStorage:', error);
  }
}

/**
 * Servicio de almacenamiento local para mods
 */
export class ModsStorageService {
  /**
   * Obtiene la lista de IDs de mods vistos
   */
  static getSeenMods(): string[] {
    return getStorageData().seenMods;
  }

  /**
   * Marca un mod como visto
   */
  static markModAsSeen(modId: string): void {
    const data = getStorageData();
    
    if (!data.seenMods.includes(modId)) {
      data.seenMods.push(modId);
      saveStorageData(data);
    }
  }

  /**
   * Marca múltiples mods como vistos
   */
  static markModsAsSeen(modIds: string[]): void {
    const data = getStorageData();
    
    for (const modId of modIds) {
      if (!data.seenMods.includes(modId)) {
        data.seenMods.push(modId);
      }
    }
    
    saveStorageData(data);
  }

  /**
   * Obtiene la versión descargada de un mod
   */
  static getDownloadedVersion(modId: string): string | null {
    const data = getStorageData();
    return data.downloadedMods[modId] || null;
  }

  /**
   * Obtiene todas las versiones descargadas
   */
  static getAllDownloadedVersions(): Record<string, string> {
    return getStorageData().downloadedMods;
  }

  /**
   * Marca un mod como descargado con su versión
   */
  static markModAsDownloaded(modId: string, version: string): void {
    const data = getStorageData();
    data.downloadedMods[modId] = version;
    
    // También marcarlo como visto
    if (!data.seenMods.includes(modId)) {
      data.seenMods.push(modId);
    }
    
    saveStorageData(data);
  }

  /**
   * Marca múltiples mods como descargados
   */
  static markModsAsDownloaded(mods: Array<{ id: string; version: string }>): void {
    const data = getStorageData();
    
    for (const mod of mods) {
      data.downloadedMods[mod.id] = mod.version;
      
      if (!data.seenMods.includes(mod.id)) {
        data.seenMods.push(mod.id);
      }
    }
    
    saveStorageData(data);
  }

  /**
   * Obtiene la fecha de última visita
   */
  static getLastVisit(): Date | null {
    const data = getStorageData();
    
    if (data.lastVisit) {
      return new Date(data.lastVisit);
    }
    
    return null;
  }

  /**
   * Actualiza la fecha de última visita
   */
  static updateLastVisit(): void {
    const data = getStorageData();
    data.lastVisit = new Date().toISOString();
    saveStorageData(data);
  }

  /**
   * Detecta mods nuevos comparando con los vistos
   * @param currentModIds IDs de mods actuales del servidor
   * @returns IDs de mods que el usuario no ha visto
   */
  static detectNewMods(currentModIds: string[]): string[] {
    const seenMods = this.getSeenMods();
    return currentModIds.filter(id => !seenMods.includes(id));
  }

  /**
   * Detecta mods con actualizaciones disponibles
   * @param currentVersions Versiones actuales del servidor (modId -> version)
   * @returns IDs de mods con actualizaciones
   */
  static detectUpdatedMods(currentVersions: Record<string, string>): string[] {
    const downloadedVersions = this.getAllDownloadedVersions();
    const updatedMods: string[] = [];

    for (const [modId, currentVersion] of Object.entries(currentVersions)) {
      const downloadedVersion = downloadedVersions[modId];
      
      if (downloadedVersion && downloadedVersion !== currentVersion) {
        // Comparar versiones semánticas
        if (compareVersions(currentVersion, downloadedVersion) > 0) {
          updatedMods.push(modId);
        }
      }
    }

    return updatedMods;
  }

  /**
   * Verifica si un mod tiene actualización disponible
   */
  static hasUpdate(modId: string, currentVersion: string): boolean {
    const downloadedVersion = this.getDownloadedVersion(modId);
    
    if (!downloadedVersion) {
      return false; // No descargado, no es una "actualización"
    }
    
    return compareVersions(currentVersion, downloadedVersion) > 0;
  }

  /**
   * Verifica si un mod es nuevo (no visto)
   */
  static isNewMod(modId: string): boolean {
    const seenMods = this.getSeenMods();
    return !seenMods.includes(modId);
  }

  /**
   * Limpia todos los datos almacenados
   */
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Obtiene todos los datos almacenados (para debug)
   */
  static getAllData(): ModsLocalStorage {
    return getStorageData();
  }
}

/**
 * Compara dos versiones semánticas
 * @returns 1 si v1 > v2, -1 si v1 < v2, 0 si son iguales
 */
export function compareVersions(v1: string, v2: string): number {
  // Limpiar sufijos como -beta, -alpha, etc.
  const clean = (v: string) => v.replace(/-.*$/, '');
  
  const parts1 = clean(v1).split('.').map(Number);
  const parts2 = clean(v2).split('.').map(Number);
  
  // Asegurar que ambos tengan 3 partes
  while (parts1.length < 3) parts1.push(0);
  while (parts2.length < 3) parts2.push(0);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  
  return 0;
}

export default ModsStorageService;
