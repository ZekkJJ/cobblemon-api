'use client';

import { useState, useEffect, useRef } from 'react';
import { Mod, ModCategory, ModLoader } from '@/src/lib/types/mod';
import { formatFileSize, getCategoryBadgeColor, getCategoryBadgeText } from '@/src/lib/mod-utils';
import { playSound } from '@/src/lib/sounds';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AdminModPanelProps {
  onModsUpdated?: () => void;
}

interface ModFormData {
  name: string;
  description: string;
  category: ModCategory;
  modLoader: ModLoader;
  minecraftVersion: string;
  author: string;
  website: string;
  changelog: string;
}

const initialFormData: ModFormData = {
  name: '',
  description: '',
  category: 'required',
  modLoader: 'fabric',
  minecraftVersion: '1.20.1',
  author: '',
  website: '',
  changelog: '',
};

/**
 * Panel de administración de mods
 * Permite subir, editar y eliminar mods
 */
export default function AdminModPanel({ onModsUpdated }: AdminModPanelProps) {
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingMod, setEditingMod] = useState<Mod | null>(null);
  const [formData, setFormData] = useState<ModFormData>(initialFormData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Estado de eliminación
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para subida masiva
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentFile: '' });
  const [bulkResults, setBulkResults] = useState<{ success: string[]; failed: string[]; skipped: string[] }>({ success: [], failed: [], skipped: [] });
  const [showBulkResults, setShowBulkResults] = useState(false);
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<ModCategory>('required');
  const [pendingBulkFiles, setPendingBulkFiles] = useState<File[]>([]);
  
  // Estado para limpieza
  const [cleaning, setCleaning] = useState(false);

  // Cargar mods
  useEffect(() => {
    loadMods();
  }, []);

  const loadMods = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mods`);
      if (!response.ok) throw new Error('Error al cargar mods');
      const data = await response.json();
      setMods(data.mods || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Intentar extraer nombre del archivo
      if (!formData.name) {
        const fileName = file.name.replace(/\.jar$/, '').replace(/-/g, ' ');
        setFormData(prev => ({ ...prev, name: fileName }));
      }
    }
  };

  // Abrir formulario para nuevo mod
  const handleNewMod = () => {
    playSound('click');
    setEditingMod(null);
    setFormData(initialFormData);
    setSelectedFile(null);
    setShowForm(true);
  };

  // Abrir formulario para editar mod
  const handleEditMod = (mod: Mod) => {
    playSound('click');
    setEditingMod(mod);
    setFormData({
      name: mod.name,
      description: mod.description,
      category: mod.category,
      modLoader: mod.modLoader,
      minecraftVersion: mod.minecraftVersion,
      author: mod.author || '',
      website: mod.website || '',
      changelog: mod.changelog || '',
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  // Cancelar formulario
  const handleCancel = () => {
    playSound('click');
    setShowForm(false);
    setEditingMod(null);
    setFormData(initialFormData);
    setSelectedFile(null);
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMod && !selectedFile) {
      setError('Debes seleccionar un archivo');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('modLoader', formData.modLoader);
      formDataToSend.append('minecraftVersion', formData.minecraftVersion);
      if (formData.author) formDataToSend.append('author', formData.author);
      if (formData.website) formDataToSend.append('website', formData.website);
      if (formData.changelog) formDataToSend.append('changelog', formData.changelog);
      if (selectedFile) formDataToSend.append('file', selectedFile);

      const url = editingMod 
        ? `${API_BASE_URL}/api/mods/${editingMod._id}`
        : `${API_BASE_URL}/api/mods`;
      
      const method = editingMod ? 'PUT' : 'POST';

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar mod');
      }

      playSound('confirm');
      handleCancel();
      loadMods();
      onModsUpdated?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      playSound('error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Eliminar mod
  const handleDelete = async (modId: string) => {
    if (confirmDelete !== modId) {
      setConfirmDelete(modId);
      return;
    }

    try {
      setDeletingId(modId);
      
      const response = await fetch(`${API_BASE_URL}/api/mods/${modId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar mod');
      }

      playSound('confirm');
      setConfirmDelete(null);
      loadMods();
      onModsUpdated?.();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      playSound('error');
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================
  // SUBIDA MASIVA DE MODS
  // ============================================
  const handleBulkUpload = () => {
    playSound('click');
    bulkFileInputRef.current?.click();
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Guardar archivos y mostrar opciones
    setPendingBulkFiles(Array.from(files));
    setShowBulkOptions(true);
    
    // Limpiar input para poder seleccionar los mismos archivos de nuevo
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = '';
    }
  };

  const handleBulkConfirm = async () => {
    if (pendingBulkFiles.length === 0) return;

    setShowBulkOptions(false);
    setBulkUploading(true);
    setBulkProgress({ current: 0, total: pendingBulkFiles.length, currentFile: '' });
    setBulkResults({ success: [], failed: [], skipped: [] });
    setShowBulkResults(false);
    setError(null);

    const results = { success: [] as string[], failed: [] as string[], skipped: [] as string[] };

    for (let i = 0; i < pendingBulkFiles.length; i++) {
      const file = pendingBulkFiles[i];
      setBulkProgress({ current: i + 1, total: pendingBulkFiles.length, currentFile: file.name });

      // Retry logic - try up to 3 times
      let lastError = '';
      let success = false;
      
      for (let attempt = 1; attempt <= 3 && !success; attempt++) {
        try {
          // Extraer info del nombre del archivo
          const fileName = file.name.replace(/\.(jar|zip)$/i, '');
          const cleanName = fileName
            .replace(/-fabric|-forge|-mc\d+\.\d+(\.\d+)?/gi, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          // Detectar versión del mod
          const versionMatch = fileName.match(/(\d+\.\d+(\.\d+)?)/);
          const version = versionMatch ? versionMatch[1] : '1.0.0';

          // Detectar mod loader
          const modLoader = fileName.toLowerCase().includes('forge') ? 'forge' : 'fabric';

          // Crear FormData con el archivo real
          const formData = new FormData();
          formData.append('file', file); // Archivo JAR real
          formData.append('name', cleanName || fileName);
          formData.append('description', `Mod ${cleanName || fileName} para Minecraft`);
          formData.append('category', bulkCategory);
          formData.append('modLoader', modLoader);
          formData.append('minecraftVersion', '1.20.1');
          formData.append('version', version);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout per file

          const response = await fetch(`${API_BASE_URL}/api/mods`, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            results.success.push(file.name);
            success = true;
          } else if (response.status === 409) {
            // Duplicado - ignorar silenciosamente
            results.skipped.push(file.name);
            success = true; // Don't retry duplicates
          } else {
            const errorData = await response.json().catch(() => ({}));
            lastError = errorData.message || errorData.error || `HTTP ${response.status}`;
            if (attempt < 3) {
              console.log(`[MODS] Retry ${attempt}/3 for ${file.name}: ${lastError}`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            }
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            lastError = 'Timeout - archivo muy grande o conexión lenta';
          } else {
            lastError = err instanceof Error ? err.message : 'Error de conexión';
          }
          if (attempt < 3) {
            console.log(`[MODS] Retry ${attempt}/3 for ${file.name}: ${lastError}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      if (!success) {
        results.failed.push(`${file.name}: ${lastError}`);
      }

      // Pequeña pausa para no saturar el servidor
      await new Promise(resolve => setTimeout(resolve, 300));
    }
      }

      // Pequeña pausa para no saturar el servidor
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setBulkResults(results);
    setShowBulkResults(true);
    setBulkUploading(false);
    setPendingBulkFiles([]);
    
    if (results.success.length > 0) {
      playSound('confirm');
      loadMods();
      onModsUpdated?.();
    } else if (results.skipped.length > 0 && results.failed.length === 0) {
      // Solo duplicados, no es error
      playSound('click');
    } else {
      playSound('error');
    }
  };

  const handleBulkCancel = () => {
    setShowBulkOptions(false);
    setPendingBulkFiles([]);
  };

  // Limpiar mods sin archivos
  const handleCleanup = async () => {
    if (!confirm('¿Eliminar todos los mods que no tienen archivos válidos? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setCleaning(true);
      const response = await fetch(`${API_BASE_URL}/api/mods/cleanup`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al limpiar mods');
      }
      
      const data = await response.json();
      playSound('confirm');
      alert(`Eliminados ${data.deletedCount} mods sin archivos`);
      loadMods();
      onModsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al limpiar');
      playSound('error');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-puzzle-piece text-poke-blue"></i>
            Gestión de Mods
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {mods.length} mod{mods.length !== 1 ? 's' : ''} registrado{mods.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleNewMod}
            className="px-4 py-2 bg-poke-green hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Nuevo Mod
          </button>
          
          <button
            onClick={handleBulkUpload}
            disabled={bulkUploading}
            className="px-4 py-2 bg-poke-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <i className="fas fa-upload"></i>
            Subir Varios
          </button>
          
          <button
            onClick={handleCleanup}
            disabled={cleaning}
            className="px-4 py-2 bg-poke-red/80 hover:bg-poke-red text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            title="Eliminar mods sin archivos válidos"
          >
            {cleaning ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-broom"></i>
            )}
            Limpiar
          </button>
          
          {/* Input oculto para subida masiva */}
          <input
            ref={bulkFileInputRef}
            type="file"
            accept=".jar,.zip"
            multiple
            onChange={handleBulkFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Modal de opciones para subida masiva */}
      {showBulkOptions && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-upload text-poke-blue"></i>
              Subir {pendingBulkFiles.length} mod{pendingBulkFiles.length !== 1 ? 's' : ''}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Categoría para todos los archivos:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setBulkCategory('required')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bulkCategory === 'required'
                      ? 'bg-poke-red text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  Requerido
                </button>
                <button
                  onClick={() => setBulkCategory('optional')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bulkCategory === 'optional'
                      ? 'bg-poke-blue text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <i className="fas fa-plus-circle mr-1"></i>
                  Opcional
                </button>
                <button
                  onClick={() => setBulkCategory('resourcepack')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bulkCategory === 'resourcepack'
                      ? 'bg-poke-purple text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <i className="fas fa-palette mr-1"></i>
                  Resource Pack
                </button>
                <button
                  onClick={() => setBulkCategory('shader')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    bulkCategory === 'shader'
                      ? 'bg-poke-yellow text-black'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <i className="fas fa-sun mr-1"></i>
                  Shader
                </button>
              </div>
            </div>

            <div className="mb-4 max-h-32 overflow-y-auto bg-slate-900/50 rounded-lg p-2">
              <p className="text-xs text-slate-500 mb-1">Archivos seleccionados:</p>
              {pendingBulkFiles.map((file, i) => (
                <div key={i} className="text-xs text-slate-400 truncate">
                  {file.name}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBulkConfirm}
                className="flex-1 px-4 py-2 bg-poke-green hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-check"></i>
                Subir Todos
              </button>
              <button
                onClick={handleBulkCancel}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progreso de subida masiva */}
      {bulkUploading && (
        <div className="mb-4 p-4 bg-poke-blue/20 border border-poke-blue/30 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-5 h-5 border-2 border-poke-blue/30 border-t-poke-blue rounded-full animate-spin"></div>
            <span className="text-white font-medium">
              Subiendo {bulkProgress.current} de {bulkProgress.total}...
            </span>
          </div>
          <p className="text-sm text-slate-400 truncate">{bulkProgress.currentFile}</p>
          <div className="mt-2 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-poke-blue h-full transition-all duration-300"
              style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Resultados de subida masiva */}
      {showBulkResults && (
        <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white">Resultados de la subida</h4>
            <button onClick={() => setShowBulkResults(false)} className="text-slate-400 hover:text-white">
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          {bulkResults.success.length > 0 && (
            <div className="mb-3">
              <p className="text-poke-green text-sm font-medium mb-1">
                <i className="fas fa-check-circle mr-1"></i>
                {bulkResults.success.length} mod{bulkResults.success.length !== 1 ? 's' : ''} subido{bulkResults.success.length !== 1 ? 's' : ''} correctamente
              </p>
              <div className="max-h-24 overflow-y-auto text-xs text-slate-400 space-y-0.5">
                {bulkResults.success.map((name, i) => (
                  <div key={i}>✓ {name}</div>
                ))}
              </div>
            </div>
          )}
          
          {bulkResults.skipped.length > 0 && (
            <div className="mb-3">
              <p className="text-poke-yellow text-sm font-medium mb-1">
                <i className="fas fa-forward mr-1"></i>
                {bulkResults.skipped.length} ya existente{bulkResults.skipped.length !== 1 ? 's' : ''} (ignorado{bulkResults.skipped.length !== 1 ? 's' : ''})
              </p>
              <div className="max-h-24 overflow-y-auto text-xs text-slate-400 space-y-0.5">
                {bulkResults.skipped.map((name, i) => (
                  <div key={i} className="text-poke-yellow/70">⏭ {name}</div>
                ))}
              </div>
            </div>
          )}
          
          {bulkResults.failed.length > 0 && (
            <div>
              <p className="text-poke-red text-sm font-medium mb-1">
                <i className="fas fa-times-circle mr-1"></i>
                {bulkResults.failed.length} error{bulkResults.failed.length !== 1 ? 'es' : ''}
              </p>
              <div className="max-h-24 overflow-y-auto text-xs text-slate-400 space-y-0.5">
                {bulkResults.failed.map((msg, i) => (
                  <div key={i} className="text-poke-red/80">✗ {msg}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-poke-red/20 border border-poke-red/30 rounded-lg text-poke-red text-sm flex items-center gap-2">
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingMod ? 'Editar Mod' : 'Nuevo Mod'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Archivo */}
            {!editingMod && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Archivo JAR *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-poke-blue transition-colors"
                >
                  {selectedFile ? (
                    <div className="text-white">
                      <i className="fas fa-file-archive text-3xl text-poke-green mb-2"></i>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-slate-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <i className="fas fa-cloud-upload-alt text-3xl mb-2"></i>
                      <p>Haz clic para seleccionar un archivo .jar</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jar,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Grid de campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poke-blue"
                  placeholder="Cobblemon"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Categoría *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poke-blue"
                >
                  <option value="required">Requerido</option>
                  <option value="optional">Opcional</option>
                  <option value="resourcepack">Resource Pack</option>
                  <option value="shader">Shader</option>
                </select>
              </div>

              {/* Mod Loader */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Mod Loader *</label>
                <select
                  name="modLoader"
                  value={formData.modLoader}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poke-blue"
                >
                  <option value="fabric">Fabric</option>
                  <option value="forge">Forge</option>
                  <option value="both">Ambos</option>
                </select>
              </div>

              {/* Versión de Minecraft */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Versión MC *</label>
                <input
                  type="text"
                  name="minecraftVersion"
                  value={formData.minecraftVersion}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poke-blue"
                  placeholder="1.20.1"
                />
              </div>

              {/* Autor */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Autor</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poke-blue"
                  placeholder="Cobblemon Team"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poke-blue"
                  placeholder="https://cobblemon.com"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Descripción *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poke-blue resize-none"
                placeholder="Descripción del mod..."
              />
            </div>

            {/* Changelog */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Changelog</label>
              <textarea
                name="changelog"
                value={formData.changelog}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poke-blue resize-none"
                placeholder="Cambios en esta versión..."
              />
            </div>

            {/* Barra de progreso */}
            {uploading && uploadProgress > 0 && (
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-poke-green h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  uploading
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-poke-green hover:bg-green-600 text-white'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    {editingMod ? 'Guardar Cambios' : 'Subir Mod'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={uploading}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de mods */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-poke-blue/30 border-t-poke-blue rounded-full animate-spin"></div>
        </div>
      ) : mods.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <i className="fas fa-box-open text-4xl mb-3"></i>
          <p>No hay mods registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mods.map((mod) => (
            <div
              key={mod._id}
              className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
            >
              {/* Info del mod */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white truncate">{mod.name}</h4>
                  <span className="text-xs text-poke-yellow font-mono">v{mod.version}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryBadgeColor(mod.category)}`}>
                    {getCategoryBadgeText(mod.category)}
                  </span>
                  {/* Indicador de archivo */}
                  {mod.originalSize && mod.originalSize > 0 ? (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-poke-green/20 text-poke-green" title="Archivo disponible">
                      <i className="fas fa-check-circle mr-1"></i>
                      Archivo OK
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-poke-red/20 text-poke-red" title="Sin archivo - usar Limpiar para eliminar">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      Sin archivo
                    </span>
                  )}
                  {!mod.isActive && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-600 text-slate-300">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 truncate">{mod.description}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span>{formatFileSize(mod.originalSize)}</span>
                  <span>{mod.modLoader}</span>
                  <span>MC {mod.minecraftVersion}</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditMod(mod)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  title="Editar"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={() => handleDelete(mod._id)}
                  disabled={deletingId === mod._id}
                  className={`p-2 rounded-lg transition-colors ${
                    confirmDelete === mod._id
                      ? 'bg-poke-red text-white'
                      : 'bg-slate-700 hover:bg-poke-red/80 text-white'
                  }`}
                  title={confirmDelete === mod._id ? 'Confirmar eliminación' : 'Eliminar'}
                >
                  {deletingId === mod._id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <i className={`fas ${confirmDelete === mod._id ? 'fa-check' : 'fa-trash'}`}></i>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nota de confirmación */}
      {confirmDelete && (
        <p className="mt-3 text-xs text-slate-400 text-center">
          Haz clic de nuevo en el botón rojo para confirmar la eliminación
        </p>
      )}
    </div>
  );
}
