export interface Ball {
  id: string;
  name: string;
  type: string;
  catchRate: number;
  basePrice: number;
  currentPrice: number;
  description: string;
  sprite: string;
  spriteOpen?: string;
  currentStock: number;
  maxStock: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  sprite: string;
  type: string;
  category: 'pokeball' | 'minecraft' | 'pokemon';
  basePrice: number;
  currentPrice: number;
  currentStock: number;
  maxStock: number;
  rarity?: string;
  // Pokeball specific
  catchRate?: number;
  spriteOpen?: string;
  cobblemonId?: string;
  // Minecraft specific
  minecraftId?: string;
}
