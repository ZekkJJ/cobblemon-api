# Feature Design: Tournament System Pro

## Overview

El sistema de torneos profesional para Cobblemon Los Pitufos es una solución full-stack que integra:

- **Frontend (Next.js)**: Interfaz de brackets interactiva con animaciones, drag & drop para admins, y actualizaciones en tiempo real via WebSocket
- **Backend (Express/MongoDB)**: API REST para gestión de torneos, WebSocket server para tiempo real, y lógica de brackets
- **Plugin Minecraft (Fabric)**: Listener de eventos de batalla de Cobblemon, comandos de inscripción, y notificaciones in-game

La arquitectura sigue el patrón de eventos donde las batallas de Cobblemon disparan actualizaciones automáticas de brackets.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TOURNAMENT SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   FRONTEND       │    │    BACKEND       │    │  MINECRAFT       │       │
│  │   (Next.js)      │    │   (Express)      │    │  PLUGIN          │       │
│  │                  │    │                  │    │  (Fabric)        │       │
│  │  ┌────────────┐  │    │  ┌────────────┐  │    │                  │       │
│  │  │ Tournament │  │◄───┼──│ WebSocket  │  │◄───┼──┌────────────┐  │       │
│  │  │ Page       │  │ WS │  │ Server     │  │HTTP│  │ Battle     │  │       │
│  │  └────────────┘  │    │  └────────────┘  │    │  │ Listener   │  │       │
│  │                  │    │                  │    │  └────────────┘  │       │
│  │  ┌────────────┐  │    │  ┌────────────┐  │    │                  │       │
│  │  │ Bracket    │  │◄───┼──│ Tournament │  │    │  ┌────────────┐  │       │
│  │  │ Visualizer │  │REST│  │ Service    │  │◄───┼──│ Commands   │  │       │
│  │  └────────────┘  │    │  └────────────┘  │    │  │ Handler    │  │       │
│  │                  │    │                  │    │  └────────────┘  │       │
│  │  ┌────────────┐  │    │  ┌────────────┐  │    │                  │       │
│  │  │ Admin      │  │────┼─►│ Bracket    │  │    │  ┌────────────┐  │       │
│  │  │ Panel      │  │    │  │ Engine     │  │────┼─►│ Notifier   │  │       │
│  │  └────────────┘  │    │  └────────────┘  │    │  └────────────┘  │       │
│  │                  │    │                  │    │                  │       │
│  └──────────────────┘    │  ┌────────────┐  │    └──────────────────┘       │
│                          │  │ MongoDB    │  │                                │
│                          │  │ Database   │  │                                │
│                          │  └────────────┘  │                                │
│                          └──────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Creación de Torneo**: Admin → Frontend → Backend API → MongoDB → Plugin (anuncio)
2. **Inscripción**: Player → Plugin Command → Backend API → MongoDB → WebSocket → Frontend
3. **Batalla**: Cobblemon Event → Battle Listener → Backend API → Bracket Engine → WebSocket → Frontend + Plugin (notificación)

## Components and Interfaces

### Frontend Components

#### TournamentPage (`/torneos/[id]`)
```typescript
interface TournamentPageProps {
  tournamentId: string;
}

// Estado del componente
interface TournamentPageState {
  tournament: Tournament | null;
  wsConnected: boolean;
  selectedMatch: Match | null;
  zoomLevel: number;
  panOffset: { x: number; y: number };
}
```

#### BracketVisualizer
```typescript
interface BracketVisualizerProps {
  tournament: Tournament;
  onMatchClick: (match: Match) => void;
  isAdmin: boolean;
  onParticipantDrop?: (participantId: string, newSeed: number) => void;
}

interface BracketNode {
  matchId: string;
  round: number;
  position: number;
  player1: Participant | null;
  player2: Participant | null;
  winner: Participant | null;
  status: 'pending' | 'active' | 'completed';
  nextMatchId: string | null;
}
```

#### AdminTournamentPanel
```typescript
interface AdminPanelProps {
  tournament: Tournament;
  onForceResult: (matchId: string, winnerId: string) => void;
  onRemoveParticipant: (participantId: string) => void;
  onCancelTournament: () => void;
  onReorderParticipants: (newOrder: Participant[]) => void;
}
```

### Backend Services

#### TournamentService
```typescript
interface ITournamentService {
  // CRUD
  createTournament(data: CreateTournamentDTO): Promise<Tournament>;
  getTournament(id: string): Promise<Tournament>;
  updateTournament(id: string, data: UpdateTournamentDTO): Promise<Tournament>;
  deleteTournament(id: string): Promise<void>;
  
  // Registration
  registerParticipant(tournamentId: string, playerUuid: string, username: string): Promise<Participant>;
  removeParticipant(tournamentId: string, participantId: string): Promise<void>;
  
  // Match Management
  recordMatchResult(matchId: string, winnerId: string, victoryType: VictoryType): Promise<Match>;
  forceMatchResult(matchId: string, winnerId: string, adminId: string): Promise<Match>;
  
  // Queries
  getActiveTournaments(): Promise<Tournament[]>;
  getParticipantActiveTournament(playerUuid: string): Promise<Tournament | null>;
  findMatchByParticipants(player1Uuid: string, player2Uuid: string): Promise<Match | null>;
}
```

#### BracketEngine
```typescript
interface IBracketEngine {
  generateBracket(participants: Participant[], type: 'single' | 'double'): BracketStructure;
  advanceWinner(bracket: BracketStructure, matchId: string, winnerId: string): BracketStructure;
  assignByes(participants: Participant[]): Participant[];
  recalculateSeeds(participants: Participant[], newOrder: number[]): Participant[];
  validateRoundComplete(bracket: BracketStructure, roundNumber: number): boolean;
  getNextRoundMatches(bracket: BracketStructure, roundNumber: number): Match[];
}

interface BracketStructure {
  type: 'single' | 'double';
  rounds: Round[];
  currentRound: number;
  totalRounds: number;
  winnerId: string | null;
}
```

#### WebSocketService
```typescript
interface IWebSocketService {
  broadcastTournamentUpdate(tournamentId: string, update: TournamentUpdate): void;
  broadcastMatchUpdate(tournamentId: string, match: Match): void;
  notifyParticipant(playerUuid: string, notification: Notification): void;
  getConnectedClients(tournamentId: string): number;
}

type TournamentUpdate = 
  | { type: 'PARTICIPANT_JOINED'; participant: Participant }
  | { type: 'MATCH_STARTED'; match: Match }
  | { type: 'MATCH_COMPLETED'; match: Match; nextMatch?: Match }
  | { type: 'ROUND_COMPLETED'; round: number }
  | { type: 'TOURNAMENT_COMPLETED'; winner: Participant }
  | { type: 'TOURNAMENT_CANCELLED' };
```

### Plugin Components

#### TournamentManager
```java
public interface ITournamentManager {
    void handleJoinCommand(ServerPlayerEntity player, String tournamentCode);
    void handleLeaveCommand(ServerPlayerEntity player);
    void sendNotification(UUID playerUuid, String message);
    void announceToServer(String message);
}
```

#### BattleListener
```java
public interface IBattleListener {
    void onBattleStart(BattleStartedEvent event);
    void onBattleEnd(BattleEndEvent event);
    BattleResult extractResult(BattleEndEvent event);
    void reportResultToBackend(BattleResult result);
}

public class BattleResult {
    UUID winnerUuid;
    UUID loserUuid;
    VictoryType victoryType;
    long durationMs;
    String battleId;
}
```

### API Endpoints

```typescript
// Tournament CRUD
POST   /api/tournaments                    // Create tournament (admin)
GET    /api/tournaments                    // List all tournaments
GET    /api/tournaments/:id                // Get tournament details
PUT    /api/tournaments/:id                // Update tournament (admin)
DELETE /api/tournaments/:id                // Delete tournament (admin)

// Registration
POST   /api/tournaments/:id/register       // Register participant (plugin)
DELETE /api/tournaments/:id/participants/:participantId  // Remove participant (admin)

// Match Management
POST   /api/tournaments/matches/:matchId/result    // Record battle result (plugin)
POST   /api/tournaments/matches/:matchId/force     // Force result (admin)

// Queries
GET    /api/tournaments/active             // Get active tournaments
GET    /api/tournaments/player/:uuid       // Get player's active tournament
POST   /api/tournaments/find-match         // Find match by participants (plugin)

// WebSocket
WS     /ws/tournaments/:id                 // Real-time tournament updates
```

## Data Models

### Tournament
```typescript
interface Tournament {
  _id: ObjectId;
  code: string;              // 6-char unique code (e.g., "AX7F9B")
  name: string;
  description: string;
  rules?: string;
  
  // Schedule
  startDate: Date;
  endDate?: Date;
  registrationDeadline?: Date;
  
  // Configuration
  maxParticipants: number;
  minParticipants: number;
  bracketType: 'single' | 'double';
  format?: string;           // e.g., "6v6 Singles"
  
  // State
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
  currentRound: number;
  
  // Participants & Bracket
  participants: Participant[];
  bracket: BracketStructure;
  
  // Results
  winnerId?: string;
  winnerUsername?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;           // For optimistic locking
}
```

### Participant
```typescript
interface Participant {
  id: string;                // Internal ID
  minecraftUuid: string;     // Minecraft UUID
  username: string;          // Minecraft username
  discordId?: string;        // Discord ID if linked
  
  seed: number;              // Seeding position
  status: 'registered' | 'active' | 'eliminated' | 'winner';
  
  eliminatedAt?: Date;
  eliminatedBy?: string;     // Opponent who eliminated them
  finalPlacement?: number;   // Final position (1st, 2nd, etc.)
  
  registeredAt: Date;
}
```

### Match
```typescript
interface Match {
  id: string;
  tournamentId: string;
  
  // Position in bracket
  roundNumber: number;
  matchNumber: number;       // Position within round
  bracketSide?: 'winners' | 'losers';  // For double elimination
  
  // Participants
  player1Id: string | null;  // null = bye or TBD
  player2Id: string | null;
  
  // Result
  winnerId: string | null;
  loserId: string | null;
  victoryType?: VictoryType;
  
  // Status
  status: 'pending' | 'ready' | 'active' | 'completed';
  
  // Timing
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Navigation
  nextMatchId: string | null;      // Winner goes here
  nextLoserMatchId?: string | null; // For double elimination
  
  // Metadata
  adminOverride: boolean;    // True if result was forced by admin
  adminId?: string;          // Admin who forced result
}

type VictoryType = 'KO' | 'FORFEIT' | 'TIMEOUT' | 'DRAW' | 'ADMIN_DECISION' | 'BYE';
```

### WebSocket Message Types
```typescript
// Client → Server
interface WSClientMessage {
  type: 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'PING';
  tournamentId?: string;
}

// Server → Client
interface WSServerMessage {
  type: 'TOURNAMENT_UPDATE' | 'MATCH_UPDATE' | 'NOTIFICATION' | 'PONG' | 'ERROR';
  payload: any;
  timestamp: number;
  version: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following properties have been identified after eliminating redundancy:

### Property 1: Tournament Code Uniqueness and Format
*For any* generated Tournament_Code, the code SHALL be exactly 6 alphanumeric characters AND unique across all existing tournaments in the database.
**Validates: Requirements 1.1, 1.5**

### Property 2: Bracket Generation Correctness
*For any* set of N participants and bracket type (single/double), the Bracket_Engine SHALL generate a valid bracket structure where:
- Total matches = N-1 (single) or 2N-2 (double)
- Each participant appears exactly once in round 1 (or has a bye)
- Bye slots are assigned to top-seeded participants when N is not a power of 2
**Validates: Requirements 1.3, 1.4, 7.5**

### Property 3: Registration Validation
*For any* registration attempt, the Tournament_System SHALL accept if and only if:
- The Tournament_Code is valid and not expired
- The player is not already registered in this tournament
- The tournament is in 'registration' status
- Current participants < maxParticipants
**Validates: Requirements 2.1, 2.2, 2.3, 2.6**

### Property 4: Match Result Bracket Advancement
*For any* completed match with a winner, the Bracket_Engine SHALL:
- Mark the loser as eliminated
- Advance the winner to the next match (nextMatchId)
- Update the winner's status to 'active' in the next match
- Preserve all other bracket state unchanged
**Validates: Requirements 4.3, 5.2, 5.3**

### Property 5: Battle-to-Match Mapping
*For any* battle result between two players, the Battle_Listener SHALL:
- Find a match where both players are participants AND status is 'active'
- If found, update that specific match only
- If not found (casual battle), discard the event without side effects
**Validates: Requirements 4.2, 4.4, 7.4**

### Property 6: Round Progression Invariant
*For any* tournament, the system SHALL NOT generate matches for round N+1 until ALL matches in round N have status 'completed'.
**Validates: Requirements 7.6**

### Property 7: Tournament Serialization Round-Trip
*For any* valid Tournament object, serializing to JSON and deserializing back SHALL produce an equivalent Tournament object with identical bracket state.
**Validates: Requirements 8.1, 8.2, 8.5**

### Property 8: Optimistic Locking Consistency
*For any* concurrent updates to the same match, exactly one update SHALL succeed and increment the version number, while others SHALL fail with a conflict error.
**Validates: Requirements 8.3, 8.4**

### Property 9: Participant Removal Consistency
*For any* participant removal (admin action or disqualification), the bracket SHALL remain valid with:
- The removed participant marked as eliminated
- Their opponent (if any) advanced to the next round
- No orphaned matches or broken bracket links
**Validates: Requirements 5.2, 5.4**

### Property 10: Notification Content Completeness
*For any* match notification sent to a participant, the message SHALL contain:
- Opponent username
- Match round number
- Tournament name
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 11: Draw Handling
*For any* match result with Victory_Type = DRAW, the system SHALL NOT advance either player and SHALL mark the match as requiring admin intervention.
**Validates: Requirements 7.1**

### Property 12: WebSocket Event Propagation
*For any* bracket state change, the WebSocket_Server SHALL broadcast an update containing the changed match data to all subscribed clients.
**Validates: Requirements 6.4**

## Error Handling

### Frontend Errors
| Error | Handling |
|-------|----------|
| WebSocket disconnection | Show indicator, auto-reconnect every 5s, refresh data on reconnect |
| API timeout | Show loading state, retry with exponential backoff (max 3 attempts) |
| Invalid tournament ID | Redirect to tournaments list with error toast |
| Stale data (version mismatch) | Force refresh and show "Data updated" notification |

### Backend Errors
| Error | HTTP Code | Response |
|-------|-----------|----------|
| Tournament not found | 404 | `{ error: 'TOURNAMENT_NOT_FOUND', message: '...' }` |
| Registration closed | 400 | `{ error: 'REGISTRATION_CLOSED', message: '...' }` |
| Already registered | 409 | `{ error: 'ALREADY_REGISTERED', message: '...' }` |
| Tournament full | 400 | `{ error: 'TOURNAMENT_FULL', message: '...' }` |
| Invalid code | 400 | `{ error: 'INVALID_CODE', message: '...' }` |
| Concurrent update conflict | 409 | `{ error: 'VERSION_CONFLICT', message: '...', currentVersion: N }` |
| Match not found | 404 | `{ error: 'MATCH_NOT_FOUND', message: '...' }` |
| Unauthorized | 401 | `{ error: 'UNAUTHORIZED', message: '...' }` |
| Admin required | 403 | `{ error: 'ADMIN_REQUIRED', message: '...' }` |

### Plugin Errors
| Error | In-Game Message |
|-------|-----------------|
| Invalid code | `§c¡Código de torneo inválido!` |
| Already registered | `§c¡Ya estás inscrito en este torneo!` |
| Tournament full | `§c¡El torneo está lleno!` |
| Registration closed | `§c¡Las inscripciones están cerradas!` |
| Backend unreachable | `§c¡Error de conexión. Intenta de nuevo.` |
| Not in tournament | `§c¡No estás inscrito en ningún torneo activo!` |

## Testing Strategy

### Unit Testing
- **Framework**: Vitest
- **Coverage targets**: 
  - BracketEngine: 100% (critical logic)
  - TournamentService: 90%
  - Validation functions: 100%

### Property-Based Testing
- **Framework**: fast-check
- **Minimum iterations**: 100 per property
- **Properties to test**:
  - Tournament code generation (Property 1)
  - Bracket generation (Property 2)
  - Registration validation (Property 3)
  - Match advancement (Property 4)
  - Serialization round-trip (Property 7)
  - Optimistic locking (Property 8)

Each property-based test MUST be tagged with:
```typescript
// **Feature: tournament-system-pro, Property N: [property description]**
```

### Integration Testing
- WebSocket connection and message flow
- Plugin → Backend → Frontend flow
- Concurrent registration handling

### E2E Testing
- Full tournament lifecycle (create → register → battle → complete)
- Admin panel operations
- Mobile responsiveness

