# Implementation Plan

## Phase 1: Core Utilities and Data

- [x] 1. Create Pokemon type colors utility

  - [x] 1.1 Create `frontend/src/lib/pokemon-type-colors.ts` with TYPE_COLORS map
    - Define all 18 type colors as hex values
    - Export `getTypeColor(type: string)` function
    - Export `getTypeGradient(type1, type2?)` for dual-type Pokemon
    - _Requirements: 1.2, 1.3_
  - [x] 1.2 Write property test for type color mapping
    - **Property 1: Type Color Mapping Consistency**
    - **Validates: Requirements 1.2, 1.3**

- [x] 2. Create IV/EV color utilities

  - [x] 2.1 Add IV color gradient function to `pokemon-type-colors.ts`
    - `getIVColor(value: number)` returns color from red (0) to green (31)
    - `getIVPercentage(ivs: Stats)` calculates total IV percentage
    - _Requirements: 4.3_
  - [x] 2.2 Write property test for IV color gradient
    - **Property 2: IV Color Gradient Correctness**
    - **Validates: Requirements 4.3**

- [x] 3. Create move data cache utility

  - [x] 3.1 Create `frontend/src/lib/move-data-cache.ts`
    - Define MoveData interface
    - Implement `getMoveData(moveName)` with PokeAPI fetch and caching
    - Handle errors gracefully with fallback data
    - _Requirements: 2.2_

## Phase 2: Tooltip Components

- [x] 4. Create PokemonTooltip component
  - [x] 4.1 Create `frontend/src/components/battle-analysis/PokemonTooltip.tsx`
    - Use Radix UI Tooltip or similar
    - Display sprite from PokeAPI
    - Show level, nature, ability
    - Show IV bars with color gradient
    - Show moves list with type colors
    - _Requirements: 2.1_

- [x] 5. Create MoveTooltip component
  - [x] 5.1 Create `frontend/src/components/battle-analysis/MoveTooltip.tsx`
    - Fetch move data using cache utility
    - Display type, power, accuracy, PP
    - Show effect description
    - Type-colored background
    - _Requirements: 2.2_

- [x] 6. Create ItemTooltip component
  - [x] 6.1 Create `frontend/src/components/battle-analysis/ItemTooltip.tsx`
    - Display item name and effect
    - Simple styling
    - _Requirements: 2.3_

## Phase 3: Team Comparison Panel

- [x] 7. Create TeamComparisonPanel component
  - [x] 7.1 Create `frontend/src/components/battle-analysis/TeamComparisonPanel.tsx`
    - Side-by-side layout for both teams
    - Winner indicator (crown icon)
    - _Requirements: 4.1_
  - [x] 7.2 Create PokemonCard sub-component
    - Sprite from PokeAPI
    - Level, nature, ability display
    - IV percentage bar with color
    - Moves list (compact)
    - Fainted indicator (reduced opacity + skull)
    - _Requirements: 4.2, 4.3, 4.5_

## Phase 4: Turn Timeline

- [x] 8. Create TurnTimeline component
  - [x] 8.1 Create `frontend/src/components/battle-analysis/TurnTimeline.tsx`
    - Horizontal scrollable timeline
    - Turn markers with numbers
    - KO icon (💀) for turns with KOs
    - Switch icon (🔄) for turns with switches
    - Click handler to select turn
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 8.2 Write property test for timeline turn count
    - **Property 3: Timeline Turn Count**
    - **Validates: Requirements 3.1**
  - [x] 8.3 Create TurnDetails sub-component
    - Shows both players' actions for selected turn
    - Move names with type colors
    - Pokemon names with tooltips
    - _Requirements: 3.5_

## Phase 5: Formatted Analysis

- [x] 9. Create analysis parsing utilities
  - [x] 9.1 Create `frontend/src/lib/analysis-parser.ts`
    - `parseAnalysisSections(text)` extracts sections by headers
    - `extractScore(text)` finds score (1-10) from text
    - `detectPokemonNames(text, knownPokemon[])` finds Pokemon mentions
    - `detectMoveNames(text, knownMoves[])` finds move mentions
    - _Requirements: 5.1, 5.2, 5.5_
  - [x] 9.2 Write property test for score extraction
    - **Property 4: Score Star Rating Bounds**
    - **Validates: Requirements 5.2**
  - [x] 9.3 Write property test for Pokemon/move detection
    - **Property 5: Pokemon/Move Detection in Text**
    - **Validates: Requirements 5.5**

- [x] 10. Create FormattedAnalysis component
  - [x] 10.1 Create `frontend/src/components/battle-analysis/FormattedAnalysis.tsx`
    - Parse markdown sections
    - Render score as star rating (⭐)
    - Render tips as styled cards
    - Render errors/mistakes with warning style
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 11. Create ColoredText component
  - [x] 11.1 Create `frontend/src/components/battle-analysis/ColoredText.tsx`
    - Detect Pokemon names and wrap with PokemonTooltip
    - Detect move names and wrap with MoveTooltip
    - Apply type colors to detected names
    - Handle "Victoria"/"Derrota" with green/red
    - _Requirements: 1.1, 1.2, 1.3, 5.5_

## Phase 6: Integration

- [x] 12. Update battle-analysis page
  - [x] 12.1 Integrate TeamComparisonPanel into page
    - Show when battle is selected and has team data
    - Pass winner/loser data correctly
    - _Requirements: 4.1_
  - [x] 12.2 Integrate TurnTimeline into page
    - Show when battle has turn data
    - Handle turn selection state
    - _Requirements: 3.1_
  - [x] 12.3 Replace plain text analysis with FormattedAnalysis
    - Pass battle data for context
    - Enable tooltips for Pokemon/moves
    - _Requirements: 5.1_
  - [x] 12.4 Add result color highlighting
    - Victory/defeat badges with correct colors
    - _Requirements: 1.1_

- [x] 13. Final Checkpoint
  - All components implemented and integrated
  - No TypeScript errors
  - Ready for testing
