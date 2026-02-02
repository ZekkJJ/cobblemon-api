# Design Document - Battle Analysis UI V2

## Overview

This design enhances the existing battle analysis page (`frontend/src/app/tutorias/battle-analysis/page.tsx`) with rich visual components including color-coded text, interactive tooltips, turn timeline, team comparison panel, and formatted AI analysis.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BattleAnalysisPage                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │  BattleList     │  │  BattleDetailPanel              │   │
│  │  (existing)     │  │  ┌───────────────────────────┐  │   │
│  │                 │  │  │ TeamComparisonPanel       │  │   │
│  │                 │  │  └───────────────────────────┘  │   │
│  │                 │  │  ┌───────────────────────────┐  │   │
│  │                 │  │  │ TurnTimeline              │  │   │
│  │                 │  │  └───────────────────────────┘  │   │
│  │                 │  │  ┌───────────────────────────┐  │   │
│  │                 │  │  │ FormattedAnalysis         │  │   │
│  │                 │  │  └───────────────────────────┘  │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. PokemonTypeColors (Utility)

```typescript
// frontend/src/lib/pokemon-type-colors.ts
export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export function getTypeColor(type: string): string;
export function getTypeGradient(type1: string, type2?: string): string;
```

### 2. PokemonTooltip Component

```typescript
// frontend/src/components/battle-analysis/PokemonTooltip.tsx
interface PokemonTooltipProps {
  pokemon: {
    species: string;
    level: number;
    nature: string;
    ability: string;
    ivs: Stats;
    evs: Stats;
    moves: string[];
    heldItem?: string;
  };
  children: React.ReactNode;
}
```

Features:
- Shows sprite from PokeAPI
- Displays level, nature, ability
- IV bars with color gradient (red→yellow→green)
- Move list with type colors
- Held item if present

### 3. MoveTooltip Component

```typescript
// frontend/src/components/battle-analysis/MoveTooltip.tsx
interface MoveTooltipProps {
  moveName: string;
  children: React.ReactNode;
}
```

Features:
- Fetches move data from PokeAPI or local cache
- Shows type, power, accuracy, PP
- Brief effect description
- Type-colored background

### 4. TeamComparisonPanel Component

```typescript
// frontend/src/components/battle-analysis/TeamComparisonPanel.tsx
interface TeamComparisonPanelProps {
  player1: {
    username: string;
    team: Pokemon[];
    isWinner: boolean;
  };
  player2: {
    username: string;
    team: Pokemon[];
    isWinner: boolean;
  };
}
```

Layout:
```
┌─────────────────────────────────────────────────────────────┐
│  👑 Player1 (Winner)          vs          Player2 (Loser)   │
├─────────────────────────────────────────────────────────────┤
│  [Sprite] Noivern Lv.85      │  [Sprite] Garchomp Lv.72    │
│  Nature: Timid | Infiltrator │  Nature: Jolly | Rough Skin │
│  IVs: ████████████ 94%       │  IVs: ██████████░░ 78%      │
│  Moves: Boomburst, Dragon... │  Moves: Earthquake, Drag... │
├─────────────────────────────────────────────────────────────┤
│  [Sprite] Hydreigon Lv.82    │  [Sprite] Riolu Lv.45 💀    │
│  ...                         │  ...                        │
└─────────────────────────────────────────────────────────────┘
```

### 5. TurnTimeline Component

```typescript
// frontend/src/components/battle-analysis/TurnTimeline.tsx
interface TurnTimelineProps {
  turns: Turn[];
  totalTurns: number;
  onTurnClick: (turnNumber: number) => void;
  selectedTurn?: number;
}

interface Turn {
  turnNumber: number;
  player1Move?: string;
  player2Move?: string;
  player1Pokemon?: string;
  player2Pokemon?: string;
  events?: ('ko' | 'switch' | 'critical')[];
}
```

Visual:
```
Turn 1      Turn 2      Turn 3
  ●──────────●──────────💀
  │          │          │
Boomburst  Switch    KO!
```

### 6. FormattedAnalysis Component

```typescript
// frontend/src/components/battle-analysis/FormattedAnalysis.tsx
interface FormattedAnalysisProps {
  analysisText: string;
  battleData: BattleLog;
}
```

Features:
- Parses markdown sections (**, ##, -, etc.)
- Renders score as star rating ⭐⭐⭐⭐⭐⭐⭐⭐☆☆ (8/10)
- Highlights Pokémon names with type colors and tooltips
- Highlights move names with type colors and tooltips
- Renders tips as styled cards
- Renders errors/mistakes with warning style

### 7. ColoredText Component

```typescript
// frontend/src/components/battle-analysis/ColoredText.tsx
interface ColoredTextProps {
  text: string;
  pokemonData?: Pokemon[];
  enableTooltips?: boolean;
}
```

Parses text and:
- Detects Pokémon names → applies type color + tooltip
- Detects move names → applies type color + tooltip
- Detects "Victoria"/"Derrota" → green/red
- Detects stat names → appropriate styling

## Data Models

### BattleLog (existing, from backend)

```typescript
interface BattleLog {
  battleId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalTurns: number;
  result: 'KO' | 'FORFEIT' | 'TIMEOUT';
  winner: PlayerData;
  loser: PlayerData;
  turns: Turn[];
  analyzed: boolean;
  analysisResult?: string;
}

interface PlayerData {
  uuid: string;
  discordId?: string;
  username?: string;
  team: Pokemon[];
}

interface Pokemon {
  species: string;
  level: number;
  nature: string;
  ability: string;
  moves: string[];
  ivs: Stats;
  evs: Stats;
  heldItem?: string;
  shiny: boolean;
}

interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}
```

### Move Data Cache

```typescript
// frontend/src/lib/move-data-cache.ts
interface MoveData {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  effectShort: string;
}

const moveCache: Map<string, MoveData>;
async function getMoveData(moveName: string): Promise<MoveData>;
```

## Error Handling

1. **Missing battle data**: Show placeholder with "No hay datos de equipos disponibles"
2. **PokeAPI failures**: Use fallback local data or show move name without tooltip
3. **Missing turns**: Show "Timeline no disponible" message
4. **Analysis parsing errors**: Fall back to plain text display

## Testing Strategy

### Unit Tests
- Type color mapping returns correct hex values
- IV percentage calculation is accurate
- Markdown parsing extracts sections correctly

### Integration Tests
- Tooltips appear on hover with correct data
- Timeline renders correct number of turns
- Team comparison shows both teams correctly



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Type Color Mapping Consistency
*For any* valid Pokémon type string, the `getTypeColor` function SHALL return a valid hex color string matching the standard Pokémon type color palette.
**Validates: Requirements 1.2, 1.3**

### Property 2: IV Color Gradient Correctness
*For any* IV value between 0 and 31, the IV color function SHALL return a color on the gradient from red (0) to green (31), where higher values are progressively greener.
**Validates: Requirements 4.3**

### Property 3: Timeline Turn Count
*For any* battle with N turns, the TurnTimeline component SHALL render exactly N turn markers.
**Validates: Requirements 3.1**

### Property 4: Score Star Rating Bounds
*For any* score value extracted from analysis (1-10), the star rating SHALL render the correct number of filled stars matching the score.
**Validates: Requirements 5.2**

### Property 5: Pokemon/Move Detection in Text
*For any* text containing known Pokémon species names or move names, the ColoredText component SHALL wrap each occurrence with the appropriate tooltip component.
**Validates: Requirements 5.5**

