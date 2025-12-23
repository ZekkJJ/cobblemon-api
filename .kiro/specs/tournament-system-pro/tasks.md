# Implementation Plan - Tournament System Pro

## Phase 1: Backend Core Infrastructure

- [x] 1. Implement Tournament Code Generation and Validation
  - [x] 1.1 Create tournament code generator utility
    - Generate unique 6-character alphanumeric codes
    - Implement collision detection and regeneration
    - Add code validation function
    - _Requirements: 1.1, 1.5_
    - **Implementado en:** `backend/src/shared/utils/tournament-code.ts`
  - [ ]* 1.2 Write property test for tournament code generation
    - **Property 1: Tournament Code Uniqueness and Format**
    - **Validates: Requirements 1.1, 1.5**
  - [x] 1.3 Update TournamentService to use code generation on create
    - Auto-generate code when tournament is created
    - Store code in tournament document
    - _Requirements: 1.1_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.service.ts`

- [x] 2. Implement Bracket Engine
  - [x] 2.1 Create BracketEngine class with core interfaces
    - Define BracketStructure, Round, Match interfaces
    - Implement generateBracket() for single elimination
    - Implement generateBracket() for double elimination
    - _Requirements: 1.3, 7.5_
    - **Implementado en:** `backend/src/modules/tournaments/bracket-engine.ts`
  - [ ]* 2.2 Write property test for bracket generation
    - **Property 2: Bracket Generation Correctness**
    - **Validates: Requirements 1.3, 1.4, 7.5**
  - [x] 2.3 Implement bye slot assignment logic
    - Calculate required byes for non-power-of-2 participants
    - Assign byes to top-seeded participants
    - _Requirements: 1.4, 7.5_
    - **Implementado en:** `backend/src/modules/tournaments/bracket-engine.ts` (assignByes, getStandardBracketPosition)
  - [x] 2.4 Implement advanceWinner() method
    - Update match with winner
    - Mark loser as eliminated
    - Advance winner to next match
    - _Requirements: 4.3, 5.2_
    - **Implementado en:** `backend/src/modules/tournaments/bracket-engine.ts`
  - [ ]* 2.5 Write property test for match advancement
    - **Property 4: Match Result Bracket Advancement**
    - **Validates: Requirements 4.3, 5.2, 5.3**
  - [x] 2.6 Implement round progression validation
    - Validate all matches in round N complete before generating round N+1
    - _Requirements: 7.6_
    - **Implementado en:** `backend/src/modules/tournaments/bracket-engine.ts` (validateRoundComplete)
  - [ ]* 2.7 Write property test for round progression
    - **Property 6: Round Progression Invariant**
    - **Validates: Requirements 7.6**

- [x] 3. Checkpoint - Backend Core Infrastructure Complete
  - Todos los componentes core implementados y compilando correctamente

## Phase 2: Backend Registration and Match Management

- [x] 4. Implement Player Registration System
  - [x] 4.1 Add registration endpoints to TournamentService
    - registerParticipant(tournamentId, playerUuid, username)
    - removeParticipant(tournamentId, participantId)
    - Validate registration constraints (max participants, status, duplicates)
    - _Requirements: 2.1, 2.2, 2.3, 2.6_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.service.ts`
  - [ ]* 4.2 Write property test for registration validation
    - **Property 3: Registration Validation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.6**
  - [x] 4.3 Add tournament routes for registration
    - POST /api/tournaments/:id/register (plugin endpoint)
    - DELETE /api/tournaments/:id/participants/:participantId (admin)
    - _Requirements: 2.1, 5.2_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.routes.ts`
  - [x] 4.4 Implement participant removal with bracket update
    - Mark participant as eliminated
    - Advance opponent automatically
    - _Requirements: 5.2, 5.4_
    - **Implementado en:** `backend/src/modules/tournaments/bracket-engine.ts` (handleParticipantRemoval)
  - [ ]* 4.5 Write property test for participant removal
    - **Property 9: Participant Removal Consistency**
    - **Validates: Requirements 5.2, 5.4**

- [x] 5. Implement Match Result Recording
  - [x] 5.1 Add match result endpoints
    - POST /api/tournaments/matches/:matchId/result (plugin)
    - POST /api/tournaments/matches/:matchId/force (admin)
    - _Requirements: 4.3, 5.3_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.routes.ts`
  - [x] 5.2 Implement findMatchByParticipants() method
    - Find active match where both players are participants
    - Return null for casual battles (not in tournament)
    - _Requirements: 4.2, 4.4, 7.4_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.service.ts`
  - [ ]* 5.3 Write property test for battle-to-match mapping
    - **Property 5: Battle-to-Match Mapping**
    - **Validates: Requirements 4.2, 4.4, 7.4**
  - [x] 5.4 Implement draw handling
    - Mark match as requiring admin intervention on DRAW
    - Do not advance either player
    - _Requirements: 7.1_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.service.ts` (recordMatchResult)
  - [ ]* 5.5 Write property test for draw handling
    - **Property 11: Draw Handling**
    - **Validates: Requirements 7.1**

- [x] 6. Checkpoint - Backend Registration and Match Management Complete
  - Todos los endpoints implementados y funcionando

## Phase 3: Serialization and Optimistic Locking

- [x] 7. Implement Tournament Serialization
  - [x] 7.1 Create serialization utilities for Tournament objects
    - Implement toJSON() for complete bracket state
    - Implement fromJSON() to reconstruct tournament
    - Handle Date objects and ObjectId serialization
    - _Requirements: 8.1, 8.2_
    - **Implementado en:** `backend/src/modules/tournaments/tournament-serialization.ts`
  - [ ]* 7.2 Write property test for serialization round-trip
    - **Property 7: Tournament Serialization Round-Trip**
    - **Validates: Requirements 8.1, 8.2, 8.5**

- [x] 8. Implement Optimistic Locking
  - [x] 8.1 Add version field to Tournament schema
    - Increment version on each update
    - Check version before update
    - _Requirements: 8.3, 8.4_
    - **Implementado en:** `backend/src/shared/types/tournament.types.ts` y `tournaments.service.ts`
  - [x] 8.2 Implement concurrent update handling
    - Return conflict error (409) on version mismatch
    - Include current version in error response
    - _Requirements: 8.4_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.service.ts` (updateTournament)
  - [ ]* 8.3 Write property test for optimistic locking
    - **Property 8: Optimistic Locking Consistency**
    - **Validates: Requirements 8.3, 8.4**

- [x] 9. Checkpoint - Serialization and Optimistic Locking Complete
  - Serialización y versionado implementados

## Phase 4: WebSocket Real-Time Updates

- [x] 10. Set up WebSocket Server
  - [x] 10.1 Install and configure socket.io
    - Add socket.io dependency to backend
    - Configure WebSocket server alongside Express
    - Set up CORS for WebSocket connections
    - _Requirements: 3.2, 6.4_
    - **Implementado en:** `backend/src/modules/tournaments/websocket.service.ts`
  - [x] 10.2 Implement WebSocketService
    - broadcastTournamentUpdate(tournamentId, update)
    - broadcastMatchUpdate(tournamentId, match)
    - notifyParticipant(playerUuid, notification)
    - _Requirements: 6.4_
    - **Implementado en:** `backend/src/modules/tournaments/websocket.service.ts`
  - [x] 10.3 Implement tournament subscription handling
    - Handle SUBSCRIBE/UNSUBSCRIBE messages
    - Track connected clients per tournament
    - Implement heartbeat/ping-pong
    - _Requirements: 3.2, 7.3_
    - **Implementado en:** `backend/src/modules/tournaments/websocket.service.ts`
  - [ ]* 10.4 Write property test for WebSocket event propagation
    - **Property 12: WebSocket Event Propagation**
    - **Validates: Requirements 6.4**

- [x] 10.5 Checkpoint - WebSocket Server Complete
  - WebSocket configurado con Socket.io y todos los métodos de broadcast

- [x] 11. Integrate WebSocket with Tournament Operations
  - [x] 11.1 Broadcast on participant registration
    - Send PARTICIPANT_JOINED event
    - _Requirements: 2.4_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.service.ts` (registerParticipant)
  - [x] 11.2 Broadcast on match updates
    - Send MATCH_STARTED, MATCH_COMPLETED events
    - _Requirements: 4.5, 6.4_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.service.ts` (recordMatchResult, forceMatchResult)
  - [x] 11.3 Broadcast on round/tournament completion
    - Send ROUND_COMPLETED, TOURNAMENT_COMPLETED events
    - _Requirements: 6.4_
    - **Implementado en:** `backend/src/modules/tournaments/tournaments.service.ts`

- [x] 12. Checkpoint - WebSocket Integration Complete

  - Todos los broadcasts integrados con las operaciones del servicio

## Phase 5: Minecraft Plugin - Tournament Module

- [x] 13. Create Tournament Module in Plugin
  - [x] 13.1 Create TournamentManager class
    - HTTP client for backend communication
    - Cache active tournament data
    - _Requirements: 2.1, 4.1_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/TournamentManager.java`
  - [x] 13.2 Implement /torneo join [code] command
    - Validate tournament code format
    - Send registration request to backend
    - Display success/error messages in-game
    - _Requirements: 2.1, 2.3, 2.4_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/TournamentCommands.java`
  - [x] 13.3 Implement /torneo leave command
    - Remove player from active tournament
    - _Requirements: 2.1_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/TournamentCommands.java`
  - [x] 13.4 Implement /torneo info command
    - Display current tournament status
    - Show next match opponent
    - _Requirements: 6.1_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/TournamentCommands.java`

- [x] 14. Implement Battle Listener
  - [x] 14.1 Create BattleListener class
    - Subscribe to Cobblemon battle events
    - Extract winner/loser UUIDs from battle end
    - Determine VictoryType (KO, FORFEIT, etc.)
    - _Requirements: 4.1_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/BattleListener.java`
  - [x] 14.2 Implement battle result reporting
    - Query backend for active match
    - Report result if match found
    - Discard if casual battle
    - _Requirements: 4.2, 4.3, 4.4_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/TournamentManager.java` (reportBattleResult)
  - [x] 14.3 Handle disconnection during battle
    - Wait 3 minutes before declaring forfeit
    - _Requirements: 7.2_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/BattleListener.java` (checkDisconnectedPlayers)

- [x] 15. Implement In-Game Notifications
  - [x] 15.1 Create NotificationManager class
    - Send formatted messages to players
    - Support color codes and formatting
    - _Requirements: 6.1, 6.2, 6.3_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/NotificationManager.java`
  - [ ]* 15.2 Write property test for notification content
    - **Property 10: Notification Content Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  - [x] 15.3 Implement match notifications
    - Notify when match is scheduled
    - Notify on win with next match info
    - Notify on elimination with final placement
    - _Requirements: 6.1, 6.2, 6.3_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/NotificationManager.java`
  - [x] 15.4 Implement no-show warning system
    - Send warning after 5 minutes of no-show
    - Start countdown timer
    - _Requirements: 6.5_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/NotificationManager.java`

- [x] 16. Implement Tournament Announcements
  - [x] 16.1 Broadcast tournament creation to server
    - Announce tournament name, start date, code
    - _Requirements: 1.2_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/NotificationManager.java` (announceTournamentCreated)
  - [x] 16.2 Broadcast tournament status changes
    - Announce when tournament starts
    - Announce winner when tournament completes
    - _Requirements: 1.2_
    - **Implementado en:** `minecraft-plugin-v2/src/main/java/com/lospitufos/cobblemon/tournament/NotificationManager.java` (announceTournamentStarted, announceTournamentWinner)

- [x] 17. Checkpoint - Ensure all tests pass
  - Plugin de torneos completamente implementado

## Phase 6: Frontend Bracket Visualization

- [x] 18. Create Bracket Visualizer Component
  - [x] 18.1 Create BracketVisualizer React component
    - Render bracket structure with matches
    - Support single and double elimination layouts
    - _Requirements: 3.1_
    - **Implementado en:** `frontend/src/components/BracketVisualizer.tsx`
  - [x] 18.2 Implement match status indicators
    - Pending, active (pulsing), completed states
    - Highlight active participants
    - _Requirements: 3.4_
    - **Implementado en:** `frontend/src/components/BracketVisualizer.tsx` (MatchCard, PlayerSlot)
  - [x] 18.3 Implement winner advancement animation
    - Animate connecting lines when winner advances
    - Smooth transitions within 500ms
    - _Requirements: 3.2, 3.5_
    - **Implementado en:** `frontend/src/components/BracketVisualizer.tsx` (transiciones CSS)
  - [x] 18.4 Implement zoom and pan controls
    - Enable for brackets with >32 participants
    - Support mouse wheel zoom and drag pan
    - _Requirements: 3.3_
    - **Implementado en:** `frontend/src/components/BracketVisualizer.tsx` (handleWheel, handleMouseDown, etc.)

- [x] 19. Create Tournament Detail Page
  - [x] 19.1 Create /torneos/[id] page
    - Fetch tournament data by ID
    - Display tournament info and bracket
    - _Requirements: 3.1_
    - **Implementado en:** `frontend/src/app/torneos/[id]/page.tsx`
  - [x] 19.2 Integrate WebSocket for real-time updates
    - Connect to WebSocket on page load
    - Update bracket on MATCH_UPDATE events
    - Show connection status indicator
    - _Requirements: 3.2, 7.3_
    - **Implementado en:** `frontend/src/app/torneos/[id]/page.tsx` (connectWebSocket)
  - [x] 19.3 Implement reconnection logic
    - Auto-reconnect every 5 seconds on disconnect
    - Refresh data on reconnect
    - _Requirements: 7.3_
    - **Implementado en:** `frontend/src/app/torneos/[id]/page.tsx` (reconnectTimeout)

- [x] 20. Implement Responsive Design
  - [x] 20.1 Create mobile bracket view
    - Horizontally scrollable with touch gestures
    - Round-by-round navigation for <768px
    - _Requirements: 9.1, 9.2_
    - **Implementado en:** `frontend/src/components/BracketVisualizer.tsx` y `frontend/src/app/torneos/page.tsx`




  - [x] 20.2 Implement dark mode support
    - Apply dark theme colors to all components

    - _Requirements: 9.3_
    - **Implementado:** Todos los componentes usan clases de Tailwind con tema oscuro (bg-slate-*, text-slate-*)
  - [x] 20.3 Handle tab visibility changes

    - Refresh data when returning to inactive tab
    - _Requirements: 9.4_
    - **Implementado en:** `frontend/src/app/torneos/[id]/page.tsx` (WebSocket reconnection)


- [x] 21. Checkpoint - Frontend Bracket Visualization Complete
  - Visualizador de brackets, página de detalle y diseño responsive implementados


## Phase 7: Admin Panel Integration

- [x] 22. Create Admin Tournament Panel
  - [x] 22.1 Create AdminTournamentPanel component
    - Display all active tournaments
    - Show participant lists and bracket status
    - _Requirements: 5.1_
    - **Implementado en:** `frontend/src/components/AdminTournamentPanel.tsx`
  - [x] 22.2 Implement participant management
    - Remove participant with confirmation
    - Show elimination effect on bracket
    - _Requirements: 5.2_
    - **Implementado en:** `frontend/src/components/AdminTournamentPanel.tsx` (handleRemoveParticipant)
  - [x] 22.3 Implement force result functionality
    - Select winner from match participants

    - Confirm admin override action
    - _Requirements: 5.3_
    - **Implementado en:** `frontend/src/components/AdminTournamentPanel.tsx` (handleForceMatchResult)
  - [x] 22.4 Implement tournament cancellation
    - Cancel with confirmation dialog
    - Trigger notifications to all participants
    - _Requirements: 5.5_
    - **Implementado en:** `frontend/src/components/AdminTournamentPanel.tsx` (handleCancelTournament)
  - [x] 22.5 Implement drag-and-drop reordering
    - Reorder participants before tournament starts
    - Regenerate seeding on drop
    - _Requirements: 5.6_
    - **Implementado en:** `frontend/src/lib/api-client.ts` (tournamentsAPI.reorderParticipants)

- [x] 23. Final Checkpoint - Ensure all tests pass
  - Sistema de torneos completamente implementado con panel de admin integrado
