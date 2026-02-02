# Design Document: Gacha System 2.0

## Overview

Gacha System 2.0 es una actualización mayor del sistema de gacha existente que incluye: corrección del sistema de pity (75/90), expansión masiva del pool de Pokémon (400+), notificaciones Discord webhook para tiradas raras, efectos in-game con sonidos de dragón/XP, animaciones premium con skip option, sistema de tirada diaria gratuita, sistema de duplicados con Stardust, y Epitomized Path para banners limitados.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                               │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ GachaPage   │  │ PullAnimation   │  │ ResultsModal                │  │
│  │ - Daily Pull│  │ - Multi-phase   │  │ - Particle effects          │  │
│  │ - Stardust  │  │ - Skip option   │  │ - Celebration screen        │  │
│  │ - Epitomized│  │ - Sound effects │  │ - Shiny/Mythic special      │  │
│  └─────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ HistoryPage │  │ StatsPage       │  │ BannerCard                  │  │
│  │ - Filters   │  │ - Charts        │  │ - Animated timer            │  │
│  │ - Export    │  │ - Luck rating   │  │ - Featured showcase         │  │
│  └─────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Backend (Express + TypeScript)                      │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    pokemon-gacha module (updated)                │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │    │
│  │  │ GachaService │  │ PityManager  │  │ WebhookService     │     │    │
│  │  │ + dailyPull  │  │ (75/90 fix)  │  │ (Discord notify)   │     │    │
│  │  │ + stardust   │  │              │  │                    │     │    │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐     │    │
│  │  │ PoolBuilder  │  │ Epitomized   │  │ StardustService    │     │    │
│  │  │ (400+ Pokemon)│ │ PathService  │  │ (duplicates)       │     │    │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MongoDB Collections                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ gacha_      │  │ gacha_      │  │ gacha_      │  │ gacha_      │    │
│  │ banners     │  │ history     │  │ pity        │  │ stardust    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │ gacha_      │  │ gacha_      │  │ gacha_      │                     │
│  │ daily_pulls │  │ epitomized  │  │ pokedex     │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Minecraft Plugin (Java) - Updated                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   GachaManager (Enhanced)                        │    │
│  │  - Dragon sound for Legendary/Mythic/Shiny                      │    │
│  │  - XP sound for Epic                                            │    │
│  │  - Server broadcast with colors                                 │    │
│  │  - Daily pull status check                                      │    │
│  │  - Stardust display                                             │    │
│  │  - /gacha info command                                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### New Backend Services

#### 1. GachaWebhookService
```typescript
interface GachaWebhookService {
  // Envía notificación a Discord para tiradas raras
  sendRarePullNotification(reward: GachaReward, playerName: string): Promise<void>;
  
  // Construye el embed de Discord
  buildDiscordEmbed(reward: GachaReward, playerName: string): DiscordEmbed;
}

const GACHA_WEBHOOK_URL = 'https://discord.com/api/webhooks/1272445276354777203/HzrbjsXD23GnHePnbZx7596elfZSL_l29i16ZT_u3JwDNRr-yg8WoCRNrwfgRGCqtYMu';
```

#### 2. DailyPullService
```typescript
interface DailyPullService {
  // Verifica si el jugador tiene tirada diaria disponible
  canClaimDailyPull(playerId: string): Promise<boolean>;
  
  // Obtiene tiempo restante hasta próxima tirada
  getTimeUntilNextPull(playerId: string): Promise<number>;
  
  // Ejecuta tirada diaria gratuita
  claimDailyPull(playerId: string): Promise<GachaPullResult>;
  
  // Registra uso de tirada diaria
  recordDailyPull(playerId: string): Promise<void>;
}
```

#### 3. StardustService
```typescript
interface StardustService {
  // Obtiene balance de Stardust del jugador
  getBalance(playerId: string): Promise<number>;
  
  // Añade Stardust por duplicado
  addStardustForDuplicate(playerId: string, rarity: Rarity, isShiny: boolean): Promise<number>;
  
  // Gasta Stardust en la tienda
  spendStardust(playerId: string, amount: number, itemId: string): Promise<boolean>;
  
  // Verifica si el Pokémon es duplicado
  isDuplicate(playerId: string, pokemonId: number): Promise<boolean>;
  
  // Registra Pokémon en el Pokédex del jugador
  registerPokemon(playerId: string, pokemonId: number): Promise<void>;
}

const STARDUST_RATES: Record<Rarity, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  epic: 100,
  legendary: 250,
  mythic: 500,
};
```

#### 4. EpitomizedPathService
```typescript
interface EpitomizedPathService {
  // Establece el objetivo del Epitomized Path
  setTarget(playerId: string, bannerId: string, pokemonId: number): Promise<void>;
  
  // Obtiene el objetivo actual
  getTarget(playerId: string, bannerId: string): Promise<number | null>;
  
  // Obtiene Fate Points actuales
  getFatePoints(playerId: string, bannerId: string): Promise<number>;
  
  // Añade Fate Point (cuando obtiene featured pero no el target)
  addFatePoint(playerId: string, bannerId: string): Promise<number>;
  
  // Resetea Fate Points (cuando obtiene el target)
  resetFatePoints(playerId: string, bannerId: string): Promise<void>;
  
  // Verifica si debe garantizar el target (2 fate points)
  shouldGuaranteeTarget(playerId: string, bannerId: string): Promise<boolean>;
}
```

### Updated API Endpoints

```typescript
// Existing endpoints (updated)
POST /api/pokemon-gacha/pull          // Now includes stardust, webhook
POST /api/pokemon-gacha/multi-pull    // Now includes stardust, webhook

// New endpoints
POST /api/pokemon-gacha/daily-pull    // Free daily pull
GET  /api/pokemon-gacha/daily-status  // Check daily pull availability
GET  /api/pokemon-gacha/stardust      // Get stardust balance
POST /api/pokemon-gacha/stardust/spend // Spend stardust
GET  /api/pokemon-gacha/pokedex       // Get player's obtained Pokemon
POST /api/pokemon-gacha/epitomized    // Set epitomized path target
GET  /api/pokemon-gacha/epitomized/:bannerId // Get epitomized status
```

## Data Models

### New Collections

#### GachaDailyPull
```typescript
interface GachaDailyPull {
  _id?: ObjectId;
  playerId: string;
  lastPullDate: Date;
  streak: number;  // For future streak bonuses
}
```

#### GachaStardust
```typescript
interface GachaStardust {
  _id?: ObjectId;
  playerId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: Date;
}
```

#### GachaPokedex
```typescript
interface GachaPokedex {
  _id?: ObjectId;
  playerId: string;
  obtainedPokemon: number[];  // Array of Pokemon IDs
  shinyObtained: number[];    // Array of shiny Pokemon IDs
  firstObtainDates: Record<number, Date>;
  updatedAt: Date;
}
```

#### GachaEpitomizedPath
```typescript
interface GachaEpitomizedPath {
  _id?: ObjectId;
  playerId: string;
  bannerId: string;
  targetPokemonId: number;
  fatePoints: number;
  updatedAt: Date;
}
```

### Updated Pity Configuration
```typescript
// FIXED: Consistent between frontend and backend
export const PITY_CONFIG = {
  softPityStart: 75,      // Was showing 50 in frontend
  hardPity: 90,           // Was showing 200 in frontend
  softPityIncrement: 0.05, // 5% increase per pull after soft pity
} as const;
```

## Sound Effects Mapping

```typescript
// Frontend sound files (to be added to /public/sounds/)
const GACHA_SOUNDS = {
  pullStart: '/sounds/gacha/pull-start.mp3',
  pokeballShake: '/sounds/gacha/pokeball-shake.mp3',
  revealCommon: '/sounds/gacha/reveal-common.mp3',
  revealRare: '/sounds/gacha/reveal-rare.mp3',
  revealEpic: '/sounds/gacha/reveal-epic.mp3',
  revealLegendary: '/sounds/gacha/reveal-legendary.mp3',
  revealMythic: '/sounds/gacha/reveal-mythic.mp3',
  shinySparkle: '/sounds/gacha/shiny-sparkle.mp3',
  celebration: '/sounds/gacha/celebration.mp3',
};

// Plugin sounds (Minecraft built-in)
const PLUGIN_SOUNDS = {
  epic: 'ENTITY_EXPERIENCE_ORB_PICKUP',
  legendary: 'ENTITY_ENDER_DRAGON_DEATH',
  mythic: 'ENTITY_ENDER_DRAGON_DEATH',
  shiny: 'ENTITY_ENDER_DRAGON_DEATH',
};
```

## Discord Webhook Format

```typescript
interface DiscordGachaEmbed {
  title: string;           // "🎰 ¡Tirada Épica!" / "🌟 ¡SHINY!" / "✨ ¡MÍTICO!"
  description: string;     // "{player} ha obtenido {pokemon}!"
  color: number;           // Purple/Gold/Pink based on rarity
  thumbnail: {
    url: string;           // Pokemon sprite URL
  };
  fields: [
    { name: 'Rareza', value: string, inline: true },
    { name: 'Shiny', value: '✨ Sí' | '❌ No', inline: true },
    { name: 'IVs', value: string, inline: true },
  ];
  footer: {
    text: string;          // "Cobblemon Los Pitufos - Gacha System"
  };
  timestamp: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Pity configuration consistency
*For any* pity display in frontend or backend, the soft pity SHALL start at 75 and hard pity SHALL be at 90.
**Validates: Requirements 1.1, 1.2**

### Property 2: Daily pull cooldown
*For any* player, after claiming a daily pull, they SHALL NOT be able to claim another for exactly 24 hours.
**Validates: Requirements 8.1, 8.3**

### Property 3: Stardust conversion accuracy
*For any* duplicate Pokemon, the Stardust awarded SHALL equal the rarity rate (×5 if shiny).
**Validates: Requirements 9.2, 9.3**

### Property 4: Epitomized Path guarantee
*For any* player with 2 Fate Points, the next featured-rarity pull SHALL be their Epitomized target.
**Validates: Requirements 10.3**

### Property 5: Webhook notification for rare pulls
*For any* Legendary, Mythic, or Shiny pull, a Discord webhook SHALL be sent within 5 seconds.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Sound effect mapping
*For any* reward reveal, the appropriate sound effect SHALL play based on rarity tier.
**Validates: Requirements 6.3, 6.4, 6.5, 6.6**

### Property 7: Plugin broadcast for Epic+
*For any* Epic or higher reward claimed in-game, a server broadcast SHALL be sent with appropriate sound.
**Validates: Requirements 4.1, 4.2**

### Property 8: Skip animation functionality
*For any* pull with skip enabled, the animation SHALL complete in under 1 second.
**Validates: Requirements 15.4**

## Error Handling

### New Error Codes
```typescript
enum GachaErrorCode {
  // Existing...
  DAILY_PULL_UNAVAILABLE = 'DAILY_PULL_UNAVAILABLE',
  INSUFFICIENT_STARDUST = 'INSUFFICIENT_STARDUST',
  EPITOMIZED_TARGET_INVALID = 'EPITOMIZED_TARGET_INVALID',
  WEBHOOK_FAILED = 'WEBHOOK_FAILED',
}
```

## Testing Strategy

### Unit Tests
- Test Stardust conversion rates
- Test daily pull cooldown logic
- Test Epitomized Path fate point accumulation
- Test webhook payload construction

### Integration Tests
- Test full pull flow with stardust
- Test daily pull with cooldown
- Test webhook delivery
- Test plugin sound effect triggers

### Property-Based Tests
- Test pity configuration consistency
- Test stardust calculation accuracy
- Test epitomized path guarantee logic

