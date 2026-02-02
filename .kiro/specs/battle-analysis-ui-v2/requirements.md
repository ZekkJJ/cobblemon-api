# Requirements Document

## Introduction

Enhanced Battle Analysis UI for the Tutorías system. This feature transforms the current text-based battle analysis into a rich, interactive visual experience with color-coded highlights, tooltips, turn-by-turn timeline, team comparison with sprites, and formatted AI analysis.

## Glossary

- **Battle_Analysis_System**: The system that displays and analyzes PvP battle data captured from Cobblemon
- **Turn_Timeline**: A horizontal visualization showing each turn's events with icons
- **Type_Color**: Standard Pokémon type colors (Fire=#F08030, Water=#6890F0, etc.)
- **Stat_Highlight**: Visual indicators for IVs, EVs using color gradients

## Requirements

### Requirement 1: Color-Coded Analysis Display

**User Story:** As a player, I want the AI analysis to have color-coded highlights, so that I can quickly identify key information like victories, defeats, and important tips.

#### Acceptance Criteria

1. WHEN displaying battle result THEN the Battle_Analysis_System SHALL render victory text in green (#22c55e) and defeat text in red (#ef4444)
2. WHEN displaying Pokémon names THEN the Battle_Analysis_System SHALL color them according to their primary type using standard Pokémon type colors
3. WHEN displaying move names THEN the Battle_Analysis_System SHALL color them according to move type
4. WHEN displaying stat comparisons THEN the Battle_Analysis_System SHALL use green for advantages and red for disadvantages
5. WHEN displaying key moments like KOs THEN the Battle_Analysis_System SHALL highlight them with distinct visual styles

### Requirement 2: Interactive Tooltips

**User Story:** As a player, I want tooltips when hovering over Pokémon, moves, and items, so that I can see detailed information without leaving the analysis page.

#### Acceptance Criteria

1. WHEN hovering over a Pokémon name THEN the Battle_Analysis_System SHALL display a tooltip with species, level, nature, ability, and IV percentage
2. WHEN hovering over a move name THEN the Battle_Analysis_System SHALL display a tooltip with move type, power, accuracy, and effect description
3. WHEN hovering over an item name THEN the Battle_Analysis_System SHALL display a tooltip with item effect description
4. WHEN on mobile THEN the Battle_Analysis_System SHALL use tap instead of hover for tooltips

### Requirement 3: Turn-by-Turn Timeline

**User Story:** As a player, I want to see a visual timeline of the battle, so that I can understand the flow and identify turning points.

#### Acceptance Criteria

1. WHEN displaying battle data with turns THEN the Battle_Analysis_System SHALL render a horizontal timeline showing each turn
2. WHEN a turn contains a KO THEN the Battle_Analysis_System SHALL mark that turn with a skull icon
3. WHEN a turn contains a switch THEN the Battle_Analysis_System SHALL mark that turn with a swap icon
4. WHEN clicking on a turn in the timeline THEN the Battle_Analysis_System SHALL show that turn's details
5. WHEN displaying turn details THEN the Battle_Analysis_System SHALL show both players' actions

### Requirement 4: Team Comparison Panel

**User Story:** As a player, I want to see both teams side by side with visual stats, so that I can understand the matchup at a glance.

#### Acceptance Criteria

1. WHEN displaying teams THEN the Battle_Analysis_System SHALL show both teams in a side-by-side layout with Pokémon sprites from PokeAPI
2. WHEN displaying a Pokémon THEN the Battle_Analysis_System SHALL show level, nature, ability, and moves
3. WHEN displaying IVs THEN the Battle_Analysis_System SHALL use a color gradient from red (0) to green (31) for each stat
4. WHEN displaying EVs THEN the Battle_Analysis_System SHALL show a compact bar visualization
5. WHEN a Pokémon was KO'd THEN the Battle_Analysis_System SHALL display it with reduced opacity and a fainted indicator

### Requirement 5: Enhanced AI Analysis Formatting

**User Story:** As a player, I want the AI analysis to be formatted with sections and visual hierarchy, so that it's easier to read and understand.

#### Acceptance Criteria

1. WHEN displaying AI analysis THEN the Battle_Analysis_System SHALL parse and render markdown with proper headings, lists, and emphasis
2. WHEN displaying the score THEN the Battle_Analysis_System SHALL render it as a visual star rating (1-10)
3. WHEN displaying tips THEN the Battle_Analysis_System SHALL render them as styled cards with icons
4. WHEN displaying errors/mistakes THEN the Battle_Analysis_System SHALL highlight them with a warning style
5. WHEN the analysis mentions a specific Pokémon or move THEN the Battle_Analysis_System SHALL make it interactive with tooltip on hover
