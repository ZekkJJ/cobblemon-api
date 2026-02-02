'use client';

import { useState } from 'react';

interface ItemTooltipProps {
  itemName: string;
  children: React.ReactNode;
}

// Common held items with descriptions
const ITEM_DATA: Record<string, { name: string; effect: string }> = {
  'leftovers': { name: 'Restos', effect: 'Restaura 1/16 de HP máximo cada turno.' },
  'choice-band': { name: 'Cinta Elegida', effect: 'Aumenta Ataque 50% pero solo permite un movimiento.' },
  'choice-specs': { name: 'Gafas Elegidas', effect: 'Aumenta At. Esp. 50% pero solo permite un movimiento.' },
  'choice-scarf': { name: 'Pañuelo Elegido', effect: 'Aumenta Velocidad 50% pero solo permite un movimiento.' },
  'life-orb': { name: 'Orbe Vital', effect: 'Aumenta daño 30% pero pierde 10% HP por ataque.' },
  'focus-sash': { name: 'Banda Focus', effect: 'Sobrevive con 1 HP si estaba a full HP.' },
  'assault-vest': { name: 'Chaleco Asalto', effect: 'Aumenta Def. Esp. 50% pero no puede usar movimientos de estado.' },
  'rocky-helmet': { name: 'Casco Dentado', effect: 'Daña al atacante 1/6 HP en contacto físico.' },
  'heavy-duty-boots': { name: 'Botas Gruesas', effect: 'Inmune a entry hazards.' },
  'eviolite': { name: 'Mineral Evolutivo', effect: 'Aumenta Def y Def. Esp. 50% si puede evolucionar.' },
  'black-sludge': { name: 'Lodo Negro', effect: 'Restaura HP si es tipo Veneno, daña si no.' },
  'sitrus-berry': { name: 'Baya Zidra', effect: 'Restaura 25% HP cuando baja de 50%.' },
  'lum-berry': { name: 'Baya Lum', effect: 'Cura cualquier problema de estado.' },
};

function normalizeItemName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function formatItemName(name: string): string {
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function ItemTooltip({ itemName, children }: ItemTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const normalizedName = normalizeItemName(itemName);
  const itemData = ITEM_DATA[normalizedName];
  const displayName = itemData?.name || formatItemName(itemName);
  const effect = itemData?.effect || 'Efecto del objeto.';

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      
      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 border border-yellow-600/50 rounded-lg shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400">📦</span>
            <span className="font-bold text-yellow-300">{displayName}</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{effect}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export default ItemTooltip;
