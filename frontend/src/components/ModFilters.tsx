'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModCategory } from '@/src/lib/types/mod';
import { playSound } from '@/src/lib/sounds';

interface ModFiltersProps {
  totalMods: number;
  filteredCount: number;
  requiredCount: number;
  optionalCount: number;
  resourcePackCount: number;
  shaderCount: number;
  selectedCategory: 'all' | ModCategory;
  searchTerm: string;
  onCategoryChange: (category: 'all' | ModCategory) => void;
  onSearchChange: (search: string) => void;
}

/**
 * Componente de filtros para la lista de mods
 * Incluye filtros por categoría y búsqueda en tiempo real
 */
export default function ModFilters({
  totalMods,
  filteredCount,
  requiredCount,
  optionalCount,
  resourcePackCount,
  shaderCount,
  selectedCategory,
  searchTerm,
  onCategoryChange,
  onSearchChange,
}: ModFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, onSearchChange]);

  const handleCategoryClick = (category: 'all' | ModCategory) => {
    playSound('click');
    onCategoryChange(category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };

  const clearSearch = () => {
    playSound('click');
    setLocalSearch('');
    onSearchChange('');
  };

  const categories: { id: 'all' | ModCategory; name: string; icon: string; count: number; color: string }[] = [
    { 
      id: 'all', 
      name: 'Todos', 
      icon: 'fa-layer-group', 
      count: totalMods,
      color: 'bg-slate-600 hover:bg-slate-500'
    },
    { 
      id: 'required', 
      name: 'Requeridos', 
      icon: 'fa-exclamation-circle', 
      count: requiredCount,
      color: 'bg-poke-red/80 hover:bg-poke-red'
    },
    { 
      id: 'optional', 
      name: 'Opcionales', 
      icon: 'fa-plus-circle', 
      count: optionalCount,
      color: 'bg-poke-blue/80 hover:bg-poke-blue'
    },
    { 
      id: 'resourcepack', 
      name: 'Resource Packs', 
      icon: 'fa-palette', 
      count: resourcePackCount,
      color: 'bg-poke-purple/80 hover:bg-poke-purple'
    },
    { 
      id: 'shader', 
      name: 'Shaders', 
      icon: 'fa-sun', 
      count: shaderCount,
      color: 'bg-poke-yellow/80 hover:bg-poke-yellow text-black'
    },
  ];

  return (
    <div className="card mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Filtros de categoría */}
        <div className="flex-1">
          <label className="text-sm text-slate-400 mb-2 block">
            Filtrar por categoría:
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
                  selectedCategory === cat.id
                    ? `${cat.color} text-white ring-2 ring-white/30`
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <i className={`fas ${cat.icon}`}></i>
                <span>{cat.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  selectedCategory === cat.id
                    ? 'bg-white/20'
                    : 'bg-slate-600'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="lg:w-80">
          <label className="text-sm text-slate-400 mb-2 block">
            Buscar mod:
          </label>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="Nombre, descripción o autor..."
              className="w-full px-4 py-2 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-poke-blue focus:border-transparent transition-all"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            {localSearch && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {filteredCount === totalMods ? (
            <span>
              Mostrando <span className="text-white font-medium">{totalMods}</span> mods
            </span>
          ) : (
            <span>
              Mostrando <span className="text-white font-medium">{filteredCount}</span> de{' '}
              <span className="text-white font-medium">{totalMods}</span> mods
            </span>
          )}
        </div>

        {/* Indicador de filtros activos */}
        {(selectedCategory !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              playSound('click');
              onCategoryChange('all');
              setLocalSearch('');
              onSearchChange('');
            }}
            className="text-sm text-poke-blue hover:text-poke-blue/80 transition-colors flex items-center gap-1"
          >
            <i className="fas fa-times-circle"></i>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Mensaje cuando no hay resultados */}
      {filteredCount === 0 && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg text-center">
          <i className="fas fa-search text-4xl text-slate-600 mb-3"></i>
          <p className="text-slate-400">
            No se encontraron mods que coincidan con tu búsqueda.
          </p>
          <button
            onClick={() => {
              playSound('click');
              onCategoryChange('all');
              setLocalSearch('');
              onSearchChange('');
            }}
            className="mt-2 text-poke-blue hover:underline text-sm"
          >
            Ver todos los mods
          </button>
        </div>
      )}
    </div>
  );
}
