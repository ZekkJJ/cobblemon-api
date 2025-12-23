# Requirements Document

## Introduction

Esta especificación define una página de perfil de jugador completa y profesional para el sistema Cobblemon Los Pitufos. La página mostrará información detallada del jugador incluyendo su equipo Pokémon, almacenamiento PC, estadísticas, historial de torneos, y datos completos de cada Pokémon. El diseño seguirá el estilo visual existente del frontend: tema oscuro con glass-morphism, colores Pokémon (poke-red, poke-blue, poke-yellow, poke-purple, poke-green), animaciones suaves, y componentes card con backdrop-blur. El objetivo es crear una experiencia inmersiva que muestre toda la información relevante del jugador de forma atractiva y funcional.

## Glossary

- **Player_Profile_System**: Sistema que gestiona y muestra la información completa de un jugador
- **Pokemon_Card**: Componente visual que muestra información detallada de un Pokémon individual (similar a StarterCard)
- **Stats_Display**: Componente que visualiza estadísticas (IVs, EVs, base stats) con barras de progreso coloreadas
- **Type_Badge**: Componente visual que muestra el tipo de un Pokémon con colores oficiales (type-grass, type-fire, etc.)
- **Party_Section**: Sección que muestra los 6 Pokémon del equipo activo del jugador
- **PC_Storage_Section**: Sección que muestra las cajas de almacenamiento del PC con grid navegable
- **Tournament_History**: Historial de participación en torneos del jugador
- **Sprite_System**: Sistema que obtiene sprites de PokeAPI (normal, shiny, animated, artwork)
- **Backend_API**: API del servidor que provee datos de jugadores y Pokémon
- **Glass_Card**: Componente card con glass-dark styling (backdrop-blur, border semi-transparente)

## Requirements

### Requirement 1: Header del Perfil de Jugador

**User Story:** Como jugador, quiero ver mi información básica de perfil de forma prominente, para identificar rápidamente mi cuenta y estado.

#### Acceptance Criteria

1. WHEN a user visits the profile page THEN the Player_Profile_System SHALL display the player's username, avatar (first letter styled), and verification status badge
2. WHEN the profile loads THEN the Player_Profile_System SHALL display the player's CobbleDollars balance with animated coin icon
3. WHEN the player has a starter Pokémon THEN the Player_Profile_System SHALL display a special badge showing the starter name, sprite, and shiny status
4. WHEN the profile loads THEN the Player_Profile_System SHALL display total Pokémon count, unique species count, and shiny count as stat cards
5. WHEN the player is online in Minecraft THEN the Player_Profile_System SHALL display a green "Online" indicator with pulse animation

### Requirement 2: Equipo Pokémon (Party)

**User Story:** Como jugador, quiero ver mi equipo de 6 Pokémon con información completa, para revisar mis Pokémon activos en detalle.

#### Acceptance Criteria

1. WHEN the party tab is selected THEN the Party_Section SHALL display up to 6 Pokemon_Cards in a responsive grid layout
2. WHEN a Pokemon_Card renders THEN the Pokemon_Card SHALL display the Pokémon sprite (animated if available), species name, nickname (if exists), and level
3. WHEN a Pokemon_Card renders THEN the Pokemon_Card SHALL display type badges with correct colors for each type
4. WHEN a Pokemon_Card renders THEN the Pokemon_Card SHALL display nature, ability, gender icon, and held item (if any)
5. WHEN a Pokémon is shiny THEN the Pokemon_Card SHALL display a golden border, sparkle effect, and shiny sprite
6. WHEN clicking a Pokemon_Card THEN the Player_Profile_System SHALL expand to show detailed stats modal with IVs, EVs, moves, and full information

### Requirement 3: Visualización de Estadísticas de Pokémon

**User Story:** Como jugador, quiero ver las estadísticas detalladas de mis Pokémon con barras visuales, para evaluar su potencial competitivo.

#### Acceptance Criteria

1. WHEN displaying Pokemon stats THEN the Stats_Display SHALL show HP, Attack, Defense, Sp.Attack, Sp.Defense, and Speed as labeled progress bars
2. WHEN displaying IVs THEN the Stats_Display SHALL use color coding (red 0-10, yellow 11-20, green 21-30, gold 31) for each stat value
3. WHEN displaying EVs THEN the Stats_Display SHALL show the distribution with a maximum of 252 per stat and 510 total
4. WHEN a stat is maxed (31 IV or 252 EV) THEN the Stats_Display SHALL highlight it with a special "MAX" badge
5. WHEN displaying base stats THEN the Stats_Display SHALL calculate and show the total base stat value

### Requirement 4: Sistema de Movimientos

**User Story:** Como jugador, quiero ver los movimientos de mis Pokémon con información de tipo y categoría, para planificar estrategias de batalla.

#### Acceptance Criteria

1. WHEN displaying moves THEN the Pokemon_Card SHALL show up to 4 moves with type-colored backgrounds
2. WHEN a move is displayed THEN the Pokemon_Card SHALL show the move name, type icon, and category (physical/special/status) icon
3. WHEN hovering over a move THEN the Player_Profile_System SHALL display a tooltip with power, accuracy, and PP information
4. IF a Pokémon has fewer than 4 moves THEN the Pokemon_Card SHALL display empty move slots with dashed borders

### Requirement 5: Almacenamiento PC

**User Story:** Como jugador, quiero navegar por mis cajas de PC y ver todos mis Pokémon almacenados, para gestionar mi colección.

#### Acceptance Criteria

1. WHEN the PC tab is selected THEN the PC_Storage_Section SHALL display a box selector with box numbers and navigation arrows
2. WHEN a PC box is displayed THEN the PC_Storage_Section SHALL show a grid of 30 slots (6x5) with Pokémon sprites or empty slots
3. WHEN hovering over a PC Pokémon THEN the PC_Storage_Section SHALL display a mini tooltip with species, level, and shiny status
4. WHEN clicking a PC Pokémon THEN the Player_Profile_System SHALL open the detailed Pokemon_Card modal
5. WHEN a PC slot is empty THEN the PC_Storage_Section SHALL display a subtle placeholder icon

### Requirement 6: Estadísticas del Jugador

**User Story:** Como jugador, quiero ver mis estadísticas generales y logros, para conocer mi progreso en el servidor.

#### Acceptance Criteria

1. WHEN the stats tab is selected THEN the Player_Profile_System SHALL display total Pokémon, unique species, shinies, and average level as animated stat cards
2. WHEN displaying stats THEN the Player_Profile_System SHALL show the strongest Pokémon (highest level) with its sprite and details
3. WHEN displaying stats THEN the Player_Profile_System SHALL show type distribution as a pie chart or bar graph
4. WHEN displaying stats THEN the Player_Profile_System SHALL show the player's registration date and last sync time
5. WHEN the player has tournament history THEN the Player_Profile_System SHALL display wins, losses, and tournament participation count

### Requirement 7: Historial de Torneos

**User Story:** Como jugador, quiero ver mi historial de participación en torneos, para revisar mi desempeño competitivo.

#### Acceptance Criteria

1. WHEN the tournaments tab is selected THEN the Player_Profile_System SHALL display a list of tournaments the player has participated in
2. WHEN displaying a tournament entry THEN the Player_Profile_System SHALL show tournament name, date, final position, and result (win/loss/ongoing)
3. WHEN the player won a tournament THEN the Player_Profile_System SHALL display a trophy icon with gold styling
4. IF the player has no tournament history THEN the Player_Profile_System SHALL display a friendly message encouraging participation

### Requirement 8: Diseño Visual y Animaciones

**User Story:** Como jugador, quiero una interfaz visualmente atractiva con estilo Pokémon, para disfrutar de una experiencia inmersiva.

#### Acceptance Criteria

1. WHEN the profile page loads THEN the Player_Profile_System SHALL use the existing glass-dark theme with backdrop-blur and semi-transparent borders
2. WHEN displaying type badges THEN the Type_Badge SHALL use the existing type-* color classes from tailwind.config.ts (type-grass, type-fire, etc.)
3. WHEN transitioning between tabs THEN the Player_Profile_System SHALL use the existing animate-fadeIn animation class
4. WHEN a shiny Pokémon is displayed THEN the Pokemon_Card SHALL use ring-2 ring-poke-yellow glow-yellow classes with animate-pulse effect
5. WHEN loading data THEN the Player_Profile_System SHALL display a centered spinner with border-4 border-poke-red border-t-transparent animate-spin

### Requirement 9: Responsive Design

**User Story:** Como jugador, quiero acceder a mi perfil desde cualquier dispositivo, para revisar mi información en móvil o desktop.

#### Acceptance Criteria

1. WHEN viewing on mobile THEN the Player_Profile_System SHALL stack content vertically and adjust grid columns
2. WHEN viewing on tablet THEN the Player_Profile_System SHALL use 2-column layouts for Pokemon_Cards
3. WHEN viewing on desktop THEN the Player_Profile_System SHALL use 3-column layouts for Pokemon_Cards
4. WHEN the viewport changes THEN the Player_Profile_System SHALL smoothly transition between layouts

### Requirement 10: Backend API para Perfil Completo

**User Story:** Como sistema, quiero un endpoint que provea toda la información necesaria del jugador, para renderizar el perfil completo.

#### Acceptance Criteria

1. WHEN the frontend requests player data THEN the Backend_API SHALL return player info, party, PC storage, and stats in a single response
2. WHEN returning Pokémon data THEN the Backend_API SHALL include species, speciesId, level, nature, ability, gender, IVs, EVs, moves, held item, shiny status, and ball type
3. WHEN returning player stats THEN the Backend_API SHALL calculate and include total Pokémon, unique species, shinies, average level, and strongest Pokémon
4. WHEN the player has tournament history THEN the Backend_API SHALL include tournament participation data with results
5. IF a player is not found THEN the Backend_API SHALL return a 404 error with appropriate message

### Requirement 11: Serialización y Validación de Datos

**User Story:** Como sistema, quiero validar y serializar correctamente los datos de Pokémon, para garantizar integridad de datos.

#### Acceptance Criteria

1. WHEN receiving Pokémon data from the plugin THEN the Backend_API SHALL validate all fields against the Pokemon schema
2. WHEN serializing Pokémon for the frontend THEN the Backend_API SHALL transform data to match the expected frontend types
3. WHEN serializing stats THEN the Backend_API SHALL ensure IVs are 0-31 and EVs are 0-252 with total max 510
4. WHEN a Pokémon has invalid data THEN the Backend_API SHALL log the error and return sanitized default values
5. WHEN parsing Pokémon data THEN the Backend_API SHALL handle missing optional fields gracefully with defaults
