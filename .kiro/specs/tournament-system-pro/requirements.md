# Requirements Document

## Introduction

Este documento especifica los requisitos para un sistema de torneos profesional integrado con Cobblemon para el servidor "Los Pitufos". El sistema permite crear torneos con brackets visuales animados, inscripción mediante códigos in-game, y actualización automática de resultados basada en batallas reales de Cobblemon. La arquitectura separa estrictamente frontend (Next.js), backend (Express/MongoDB), y plugin de Minecraft (Fabric/Cobblemon).

## Glossary

- **Tournament_System**: Sistema completo de gestión de torneos que incluye frontend, backend y plugin de Minecraft
- **Bracket_Engine**: Motor de generación y gestión de brackets de eliminación simple/doble
- **Battle_Listener**: Componente del plugin que detecta eventos de batalla de Cobblemon
- **WebSocket_Server**: Servidor de comunicación en tiempo real para actualizaciones de brackets
- **Tournament_Code**: Código único alfanumérico de 6 caracteres para inscripción in-game
- **Match**: Enfrentamiento individual entre dos participantes dentro de un torneo
- **Round**: Conjunto de matches que deben completarse antes de avanzar a la siguiente fase
- **Bye**: Avance automático cuando un participante no tiene oponente (número impar)
- **Single_Elimination**: Formato donde una derrota elimina al participante
- **Double_Elimination**: Formato donde se requieren dos derrotas para ser eliminado
- **Victory_Type**: Tipo de victoria (KO, FORFEIT, TIMEOUT, DRAW, ADMIN_DECISION)
- **Admin_Panel**: Interfaz de administración para gestión de torneos
- **Participant**: Jugador inscrito en un torneo con UUID de Minecraft vinculado

## Requirements

### Requirement 1: Creación de Torneos

**User Story:** As an administrator, I want to create tournaments with customizable settings, so that I can organize competitive events for the server community.

#### Acceptance Criteria

1. WHEN an administrator submits a tournament creation form THEN the Tournament_System SHALL generate a unique Tournament_Code of 6 alphanumeric characters and persist the tournament to the database
2. WHEN a tournament is created THEN the Tournament_System SHALL send an announcement to the Minecraft server via the plugin containing the tournament name, start date, and Tournament_Code
3. WHEN an administrator specifies bracket type as "single" or "double" THEN the Bracket_Engine SHALL configure the tournament elimination rules accordingly
4. WHEN an administrator sets maximum participants THEN the Tournament_System SHALL enforce this limit during registration and generate appropriate bye slots if needed
5. IF a Tournament_Code collision occurs during generation THEN the Tournament_System SHALL regenerate until a unique code is obtained

### Requirement 2: Inscripción de Jugadores

**User Story:** As a player, I want to register for tournaments using an in-game code, so that I can participate in competitive events without leaving Minecraft.

#### Acceptance Criteria

1. WHEN a player executes "/torneo join [Tournament_Code]" in-game THEN the Battle_Listener SHALL validate the code and register the player's UUID with the backend
2. WHEN a player attempts to register for a tournament THEN the Tournament_System SHALL verify the player is not already registered and the tournament accepts registrations
3. IF a player attempts to register with an invalid or expired Tournament_Code THEN the Tournament_System SHALL display an error message in-game
4. WHEN registration is successful THEN the Tournament_System SHALL send a confirmation message in-game and update the bracket in real-time via WebSocket
5. IF a player is already registered in another tournament with overlapping schedule THEN the Tournament_System SHALL warn the player about the conflict
6. WHEN maximum participants is reached THEN the Tournament_System SHALL reject new registrations and notify the player

### Requirement 3: Visualización de Brackets

**User Story:** As a user, I want to view tournament brackets with smooth animations, so that I can follow the tournament progress visually.

#### Acceptance Criteria

1. WHEN a user views a tournament page THEN the Tournament_System SHALL render an interactive bracket visualization with all matches and participants
2. WHEN a match status changes THEN the WebSocket_Server SHALL push updates and the frontend SHALL animate the transition smoothly within 500ms
3. WHEN displaying a bracket with more than 32 participants THEN the Tournament_System SHALL provide zoom and pan controls for navigation
4. WHEN a match is in progress THEN the Tournament_System SHALL display a pulsing indicator and highlight the active participants
5. WHEN a match completes THEN the Tournament_System SHALL animate the winner advancing to the next round with a connecting line animation

### Requirement 4: Detección Automática de Batallas

**User Story:** As a tournament organizer, I want battle results to update automatically, so that brackets stay current without manual intervention.

#### Acceptance Criteria

1. WHEN a Cobblemon battle ends between two tournament participants THEN the Battle_Listener SHALL capture the winner UUID, loser UUID, and Victory_Type
2. WHEN a battle result is captured THEN the Battle_Listener SHALL query the backend to identify the active Match for those participants
3. IF both participants are in the same active Match THEN the Tournament_System SHALL update the bracket, advance the winner, and mark the loser as eliminated
4. IF a battle occurs between participants not in an active Match THEN the Battle_Listener SHALL discard the event silently
5. WHEN a battle result is processed THEN the WebSocket_Server SHALL broadcast the update to all connected clients within 1 second
6. IF the Battle_Listener fails to detect a battle end event within 30 minutes of match start THEN the Tournament_System SHALL mark the match as requiring admin intervention

### Requirement 5: Administración de Torneos

**User Story:** As an administrator, I want to manage tournament participants and results, so that I can handle edge cases and maintain tournament integrity.

#### Acceptance Criteria

1. WHEN an administrator views the admin panel THEN the Tournament_System SHALL display all active tournaments with participant lists and bracket status
2. WHEN an administrator removes a participant THEN the Tournament_System SHALL mark them as eliminated and advance their opponent automatically
3. WHEN an administrator forces a match result THEN the Tournament_System SHALL update the bracket regardless of actual battle outcome
4. WHEN an administrator disqualifies a player mid-battle THEN the Tournament_System SHALL set Victory_Type to FORFEIT and notify the opponent in-game
5. WHEN an administrator cancels a tournament with active matches THEN the Tournament_System SHALL notify all participants in-game and mark the tournament as cancelled
6. WHEN an administrator uses drag-and-drop to reorder participants THEN the Bracket_Engine SHALL regenerate seeding positions accordingly

### Requirement 6: Notificaciones en Tiempo Real

**User Story:** As a participant, I want to receive notifications about my matches, so that I know when to compete.

#### Acceptance Criteria

1. WHEN a participant's match is scheduled to start THEN the Tournament_System SHALL send an in-game message with opponent name and match details
2. WHEN a participant wins a match THEN the Tournament_System SHALL send a congratulatory message with next match information
3. WHEN a participant is eliminated THEN the Tournament_System SHALL send a notification with final placement
4. WHEN a tournament bracket updates THEN the WebSocket_Server SHALL push the update to all connected frontend clients
5. IF a participant does not appear for their match within 5 minutes THEN the Tournament_System SHALL send a warning message and start a countdown

### Requirement 7: Manejo de Casos Especiales

**User Story:** As a system administrator, I want the system to handle edge cases gracefully, so that tournaments run smoothly despite unexpected situations.

#### Acceptance Criteria

1. IF a battle ends in a draw (Victory_Type DRAW) THEN the Tournament_System SHALL schedule a rematch or prompt admin for decision
2. IF a player disconnects during a match THEN the Tournament_System SHALL wait 3 minutes before declaring forfeit
3. IF the WebSocket connection is lost THEN the frontend SHALL attempt reconnection every 5 seconds and display a connection status indicator
4. IF multiple tournaments are active simultaneously THEN the Battle_Listener SHALL correctly map battles to the appropriate tournament based on participant UUIDs
5. IF bracket generation results in an odd number of participants THEN the Bracket_Engine SHALL assign bye slots to top-seeded participants
6. WHEN a tournament transitions between rounds THEN the Tournament_System SHALL validate all previous round matches are complete before generating next round matches

### Requirement 8: Persistencia y Serialización de Datos

**User Story:** As a developer, I want tournament data to be reliably persisted and serialized, so that the system maintains data integrity across restarts.

#### Acceptance Criteria

1. WHEN tournament data is saved THEN the Tournament_System SHALL serialize all bracket state to JSON format
2. WHEN tournament data is loaded THEN the Tournament_System SHALL deserialize JSON and reconstruct the complete bracket state
3. WHEN a match result is recorded THEN the Tournament_System SHALL persist the change within 1 second using optimistic locking
4. IF concurrent updates occur on the same match THEN the Tournament_System SHALL use version numbers to prevent race conditions
5. WHEN the server restarts THEN the Tournament_System SHALL restore all active tournaments to their previous state

### Requirement 9: Interfaz de Usuario Responsiva

**User Story:** As a mobile user, I want to view tournaments on my phone, so that I can follow progress from anywhere.

#### Acceptance Criteria

1. WHEN viewing on mobile devices THEN the Tournament_System SHALL provide a horizontally scrollable bracket view with touch gestures
2. WHEN the viewport is less than 768px wide THEN the Tournament_System SHALL collapse the bracket into a round-by-round navigation
3. WHEN dark mode is enabled THEN the Tournament_System SHALL render all components with appropriate dark theme colors
4. WHEN a user returns to an inactive tab THEN the frontend SHALL refresh tournament data and display any missed updates

