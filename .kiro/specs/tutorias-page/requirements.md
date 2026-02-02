# Requirements Document

## Introduction

La página de "Tutorías" es un centro de servicios premium impulsados por IA para jugadores de Cobblemon Los Pitufos. Ofrece análisis de batallas, consejos de equipo, asesoría de breeding basada en el mod Cobbreeding, y gestión avanzada de PokéBox. Todos los servicios de IA tienen un costo en CobbleDollars y un sistema de cooldown para evitar abuso.

## Glossary

- **Tutorías_System**: Sistema principal que gestiona todos los servicios de tutoría y asesoría IA
- **Battle_Analysis_AI**: Servicio de IA que analiza batallas guardadas paso a paso y proporciona consejos estratégicos
- **AI_Tutor**: Servicio de IA que responde consultas sobre mejora de equipos Pokémon
- **Breed_Advisor_AI**: Servicio de IA que proporciona consejos de breeding basados en las mecánicas del mod Cobbreeding
- **PokeBox_Manager**: Sistema de gestión de Pokémon almacenados con filtros, eliminación de duplicados y calculadoras
- **CobbleDollars**: Moneda virtual del servidor usada para pagar servicios
- **Cooldown_System**: Sistema que limita la frecuencia de solicitudes de IA por usuario
- **Battle_Log**: Registro detallado de una batalla incluyendo cada turno, movimientos usados, daño, cambios de estado
- **Cobbreeding**: Mod de breeding para Cobblemon que usa Pasture Blocks para criar Pokémon
- **IV_Calculator**: Herramienta que calcula los Individual Values de un Pokémon
- **EV_Calculator**: Herramienta que calcula los Effort Values de un Pokémon
- **Stat_Planner**: Herramienta que planifica la distribución óptima de EVs para un Pokémon
- **Pending_Sync**: Transacción pendiente de CobbleDollars que el plugin procesa cuando el jugador está online
- **Daily_Limit**: Número máximo de requests de IA permitidos por día por servicio

## Requirements

### Requirement 1: Battle Analysis AI

**User Story:** As a player, I want to save my battles step-by-step and have an AI analyze them, so that I can learn from my mistakes and improve my competitive skills.

#### Acceptance Criteria

1. WHEN a battle occurs in the Minecraft server THEN the Tutorías_System SHALL capture and store each turn's data including moves used, damage dealt, status changes, switches, and weather effects
2. WHEN a user requests battle analysis THEN the Battle_Analysis_AI SHALL retrieve the battle log and generate strategic insights within 30 seconds
3. WHEN the Battle_Analysis_AI generates analysis THEN the system SHALL display turn-by-turn breakdown with recommendations for alternative plays
4. WHEN a user requests battle analysis THEN the Tutorías_System SHALL deduct the configured CobbleDollars cost from the user's balance
5. IF a user has insufficient CobbleDollars balance THEN the Tutorías_System SHALL reject the analysis request and display the required amount
6. WHEN a user views their battle history THEN the Tutorías_System SHALL display a list of saved battles with date, opponent, and result

### Requirement 2: AI Tutor Service

**User Story:** As a player, I want to consult an AI tutor about improving my team, so that I can get personalized advice on team composition, movesets, and strategies.

#### Acceptance Criteria

1. WHEN a user submits a question to the AI_Tutor THEN the system SHALL analyze the user's current team data and provide contextual advice
2. WHEN the AI_Tutor responds THEN the response SHALL include specific recommendations based on the user's actual Pokémon (species, moves, IVs, EVs, abilities)
3. WHEN a user requests AI_Tutor consultation THEN the Tutorías_System SHALL deduct the configured CobbleDollars cost from the user's balance
4. IF a user has insufficient CobbleDollars balance THEN the Tutorías_System SHALL reject the consultation request and display the required amount
5. WHEN the AI_Tutor provides advice THEN the system SHALL format the response with clear sections for team analysis, suggested changes, and reasoning

### Requirement 3: Breed Advisor AI

**User Story:** As a player, I want AI-powered breeding advice based on Cobbreeding mechanics, so that I can efficiently breed Pokémon with optimal IVs, natures, and abilities.

#### Acceptance Criteria

1. WHEN a user requests breeding advice THEN the Breed_Advisor_AI SHALL analyze the user's available Pokémon and suggest optimal breeding pairs
2. WHEN the Breed_Advisor_AI provides advice THEN the response SHALL include egg group compatibility, IV inheritance predictions, nature inheritance with Everstone, and ability inheritance probabilities
3. WHEN advising on shiny breeding THEN the Breed_Advisor_AI SHALL explain Masuda method (different OTs = x4 bonus) and Crystal method (shiny parent = x1 bonus per shiny parent)
4. WHEN a user requests breeding advice THEN the Tutorías_System SHALL deduct the configured CobbleDollars cost from the user's balance
5. IF a user has insufficient CobbleDollars balance THEN the Tutorías_System SHALL reject the breeding advice request and display the required amount
6. WHEN the Breed_Advisor_AI provides advice THEN the system SHALL include step-by-step breeding chains to achieve target IVs/nature/ability

### Requirement 4: PokéBox Manager

**User Story:** As a player, I want to manage my stored Pokémon with advanced filters and duplicate detection, so that I can organize my collection and identify Pokémon to release or trade.

#### Acceptance Criteria

1. WHEN a user opens the PokeBox_Manager THEN the system SHALL display all Pokémon from the user's PC storage with filtering options
2. WHEN a user applies filters THEN the PokeBox_Manager SHALL filter Pokémon by species, type, shiny status, IV ranges, EV totals, nature, ability, and level range
3. WHEN a user requests duplicate detection THEN the PokeBox_Manager SHALL identify Pokémon of the same species and display them grouped with comparison data
4. WHEN viewing duplicates THEN the PokeBox_Manager SHALL allow the user to mark Pokémon as "protected" to exclude them from release suggestions
5. WHEN a user selects a Pokémon THEN the PokeBox_Manager SHALL display the IV_Calculator results showing exact IV values and IV percentage rating
6. WHEN a user selects a Pokémon THEN the PokeBox_Manager SHALL display the EV_Calculator results showing current EV distribution and remaining EV points

### Requirement 5: Stat Planner

**User Story:** As a player, I want to plan optimal stat distributions for my Pokémon, so that I can train them effectively for competitive battles.

#### Acceptance Criteria

1. WHEN a user opens the Stat_Planner for a Pokémon THEN the system SHALL display current stats, IVs, EVs, and nature effects
2. WHEN a user adjusts EV sliders THEN the Stat_Planner SHALL calculate and display projected final stats at level 50 and level 100
3. WHEN the Stat_Planner calculates stats THEN the system SHALL apply nature modifiers correctly (10% boost/reduction to appropriate stats)
4. WHEN a user saves an EV plan THEN the Stat_Planner SHALL store the plan associated with that Pokémon for future reference

### Requirement 6: Cooldown System

**User Story:** As a server administrator, I want to limit AI request frequency per user, so that I can prevent abuse and manage API costs.

#### Acceptance Criteria

1. WHEN a user makes an AI request THEN the Cooldown_System SHALL record the timestamp and request type
2. WHEN a user attempts an AI request within the cooldown period THEN the Cooldown_System SHALL reject the request and display remaining cooldown time
3. WHEN configuring cooldowns THEN the Tutorías_System SHALL support different cooldown durations for Battle_Analysis_AI, AI_Tutor, and Breed_Advisor_AI
4. WHEN a user's cooldown expires THEN the Cooldown_System SHALL allow the next AI request of that type

### Requirement 7: Pricing Configuration

**User Story:** As a server administrator, I want to configure CobbleDollars pricing for each AI service, so that I can balance the in-game economy.

#### Acceptance Criteria

1. WHEN an admin accesses pricing configuration THEN the Tutorías_System SHALL display current prices for all AI services
2. WHEN an admin updates a service price THEN the Tutorías_System SHALL apply the new price to subsequent requests immediately
3. WHEN displaying service options to users THEN the Tutorías_System SHALL show the current CobbleDollars cost for each service

### Requirement 8: Battle Log Capture (Plugin)

**User Story:** As a developer, I want the Minecraft plugin to capture detailed battle data, so that the Battle_Analysis_AI has complete information to analyze.

#### Acceptance Criteria

1. WHEN a PvP battle starts THEN the plugin SHALL begin recording battle state including both teams' Pokémon, moves, items, and abilities
2. WHEN a turn is executed THEN the plugin SHALL record the move used, target, damage dealt, critical hits, effectiveness, and any status changes
3. WHEN a Pokémon switches THEN the plugin SHALL record the switch event with the incoming and outgoing Pokémon
4. WHEN a battle ends THEN the plugin SHALL send the complete battle log to the backend API for storage
5. WHEN recording battle data THEN the plugin SHALL include weather conditions, terrain effects, and field hazards active each turn

### Requirement 9: Navigation and UI

**User Story:** As a user, I want easy navigation between tutoring services, so that I can quickly access the feature I need.

#### Acceptance Criteria

1. WHEN a user visits the Tutorías page THEN the system SHALL display a dashboard with cards for each service (Battle Analysis, AI Tutor, Breed Advisor, PokéBox Manager)
2. WHEN a user selects a service THEN the system SHALL navigate to that service's dedicated interface
3. WHEN displaying the user's balance THEN the Tutorías_System SHALL show current CobbleDollars prominently on all service pages
4. WHEN a service is on cooldown THEN the system SHALL display a visual indicator with remaining time on the service card

### Requirement 10: CobbleDollars Integration

**User Story:** As a player, I want to pay for AI services using my in-game CobbleDollars, so that I can use the tutoring features seamlessly.

#### Acceptance Criteria

1. WHEN a user requests an AI service from the web THEN the Tutorías_System SHALL create a pending deduction that the plugin processes when the player is online
2. WHEN the plugin processes a pending deduction THEN the system SHALL execute the cobbledollars remove command and confirm the sync to the backend
3. IF a player is offline when requesting a service THEN the Tutorías_System SHALL queue the deduction and process it when the player logs in
4. WHEN displaying balance on the web THEN the Tutorías_System SHALL show the last synced balance from the plugin
5. WHEN a deduction fails in-game due to insufficient balance THEN the Tutorías_System SHALL refund the service request and notify the user

### Requirement 11: AI Request Rate Limiting

**User Story:** As a server administrator, I want to limit AI request frequency, so that API costs are controlled and the system remains fair for all players.

#### Acceptance Criteria

1. WHEN a user makes an AI request THEN the Tutorías_System SHALL check if they have exceeded the daily limit for that service type
2. WHEN a user exceeds the daily limit THEN the Tutorías_System SHALL reject the request and display when they can try again
3. WHEN configuring rate limits THEN the Tutorías_System SHALL support different daily limits for Battle_Analysis_AI, AI_Tutor, and Breed_Advisor_AI
4. WHEN the daily limit resets THEN the Tutorías_System SHALL reset at midnight server time
