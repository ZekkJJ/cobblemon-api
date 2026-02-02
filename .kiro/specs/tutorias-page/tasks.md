# Implementation Plan

## Phase 1: Backend Foundation

- [x] 1. Set up Tutorías module structure


  - [x] 1.1 Create backend module directory structure (`backend/src/modules/tutorias/`)


    - Create `tutorias.routes.ts`, `tutorias.controller.ts`, `tutorias.service.ts`, `tutorias.schema.ts`
    - _Requirements: 9.1, 9.2_
  - [x] 1.2 Create shared types for Tutorías (`backend/src/shared/types/tutorias.types.ts`)


    - Define interfaces: `ServiceCooldowns`, `ServicePricing`, `BattleSummary`, `BattleLog`, `TurnLog`, `BattleAction`, `FieldState`
    - Define interfaces: `AITutorRequest`, `AITutorResponse`, `BreedAdvisorRequest`, `BreedAdvisorResponse`
    - Define interfaces: `PokeBoxFilters`, `DuplicateGroup`, `PokemonWithCalculations`, `EVPlan`
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

  - [x] 1.3 Create MongoDB schemas for Tutorías collections
    - `tutorias_battle_logs`, `tutorias_cooldowns`, `tutorias_pricing`, `tutorias_ev_plans`, `tutorias_protected_pokemon`
    - _Requirements: 1.1, 6.1, 7.1, 5.4, 4.4_

## Phase 2: Core Services Implementation

- [x] 2. Implement Pricing Service



  - [x] 2.1 Create `pricing.service.ts` with methods: `getPrice()`, `getAllPrices()`, `updatePrice()`, `chargeUser()`

    - _Requirements: 7.1, 7.2, 7.3_
  - [ ]* 2.2 Write property test for Service Payment Deduction
    - **Property 1: Service Payment Deduction**
    - **Validates: Requirements 1.4, 2.3, 3.4**
  - [ ]* 2.3 Write property test for Insufficient Balance Rejection
    - **Property 2: Insufficient Balance Rejection**
    - **Validates: Requirements 1.5, 2.4, 3.5**
  - [ ]* 2.4 Write property test for Price Update Propagation
    - **Property 16: Price Update Propagation**
    - **Validates: Requirements 7.2**

- [-] 3. Implement Cooldown Service


  - [x] 3.1 Create `cooldown.service.ts` with methods: `checkCooldown()`, `recordRequest()`, `getCooldowns()`

    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 3.2 Write property test for Cooldown Enforcement
    - **Property 6: Cooldown Enforcement**
    - **Validates: Requirements 6.1, 6.2**
  - [ ]* 3.3 Write property test for Cooldown Expiration
    - **Property 7: Cooldown Expiration**
    - **Validates: Requirements 6.4**
  - [ ]* 3.4 Write property test for Independent Service Cooldowns
    - **Property 8: Independent Service Cooldowns**
    - **Validates: Requirements 6.3**

- [-] 4. Implement Daily Limit Service


  - [x] 4.1 Create `daily-limit.service.ts` with methods: `checkDailyLimit()`, `incrementUsage()`, `resetLimits()`

    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [ ]* 4.2 Write property test for Daily Limit Enforcement
    - **Property 19: Daily Limit Enforcement**
    - **Validates: Requirements 11.1, 11.2**
  - [ ]* 4.3 Write property test for Daily Limit Reset
    - **Property 20: Daily Limit Reset**
    - **Validates: Requirements 11.4**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Battle Analysis System

- [-] 6. Implement Battle Log Service


  - [x] 6.1 Create `battle-log.service.ts` with methods: `storeBattleLog()`, `getBattleLog()`, `getBattlesForUser()`

    - _Requirements: 1.1, 1.6, 8.4_
  - [ ]* 6.2 Write property test for Battle Log Completeness
    - **Property 3: Battle Log Completeness**
    - **Validates: Requirements 1.1, 8.1, 8.2, 8.4**
  - [ ]* 6.3 Write property test for Turn Record Completeness
    - **Property 4: Turn Record Completeness**
    - **Validates: Requirements 8.2, 8.5**
  - [ ]* 6.4 Write property test for Battle History Retrieval
    - **Property 5: Battle History Retrieval**
    - **Validates: Requirements 1.6**

- [-] 7. Implement AI Service Integration


  - [x] 7.1 Create `ai.service.ts` with OpenAI/Groq integration

    - Methods: `analyzeBattle()`, `answerTeamQuestion()`, `getBreedingAdvice()`
    - Include retry logic with exponential backoff (up to 3 retries)
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 3.1, 3.2_

  - [x] 7.2 Create AI prompt templates for each service type
    - Battle analysis prompts with turn-by-turn breakdown
    - Team advice prompts with Pokémon context
    - Breeding advice prompts with Cobbreeding mechanics (Masuda method, Crystal method)
    - _Requirements: 1.3, 2.5, 3.3, 3.6_

## Phase 4: PokéBox Manager & Stat Planner

- [-] 8. Implement PokéBox Manager Service


  - [x] 8.1 Create `pokebox.service.ts` with methods: `getPokeBox()`, `getDuplicates()`, `updateProtection()`

    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 8.2 Write property test for Filter Correctness
    - **Property 9: Filter Correctness**
    - **Validates: Requirements 4.2**
  - [ ]* 8.3 Write property test for Duplicate Grouping
    - **Property 10: Duplicate Grouping**
    - **Validates: Requirements 4.3**
  - [ ]* 8.4 Write property test for Protection Exclusion
    - **Property 11: Protection Exclusion**
    - **Validates: Requirements 4.4**

- [-] 9. Implement IV/EV Calculators


  - [x] 9.1 Create `stat-calculator.service.ts` with IV percentage and EV remaining calculations

    - _Requirements: 4.5, 4.6, 5.1, 5.2, 5.3_
  - [ ]* 9.2 Write property test for IV Percentage Calculation
    - **Property 12: IV Percentage Calculation**
    - **Validates: Requirements 4.5**
  - [ ]* 9.3 Write property test for EV Remaining Calculation
    - **Property 13: EV Remaining Calculation**
    - **Validates: Requirements 4.6**
  - [ ]* 9.4 Write property test for Stat Calculation with Nature
    - **Property 14: Stat Calculation with Nature**
    - **Validates: Requirements 5.3**

- [-] 10. Implement EV Plan Service

  - [x] 10.1 Create `ev-plan.service.ts` with methods: `saveEVPlan()`, `getEVPlan()`, `calculateProjectedStats()`


    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 10.2 Write property test for EV Plan Round Trip
    - **Property 15: EV Plan Round Trip**
    - **Validates: Requirements 5.4**

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Anti-Tamper & Anti-Abuse System

- [-] 12. Implement Balance Integrity Service


  - [x] 12.1 Create `balance-integrity.service.ts` with transaction ledger and validation

    - Methods: `validatePluginSync()`, `debit()`, `credit()`, `verifyUserLedger()`, `detectAnomalies()`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ]* 12.2 Write property test for Transaction Ledger Integrity
    - **Property 18: Transaction Ledger Integrity**
    - **Validates: Anti-Tamper System**
  - [ ]* 12.3 Write property test for Balance Jump Detection
    - **Property 20: Balance Jump Detection**
    - **Validates: Anti-Tamper System**

- [ ] 13. Implement AI Abuse Detection Service
  - [ ] 13.1 Create `ai-abuse-detection.service.ts` with request fingerprinting and bot detection
    - Methods: `validateRequest()`, `detectBotTiming()`, `calculateSimilarity()`
    - _Requirements: 11.1, 11.2_
  - [ ]* 13.2 Write property test for Progressive Cooldown Scaling
    - **Property 21: Progressive Cooldown Scaling**
    - **Validates: Anti-Abuse System**

- [-] 14. Implement Suspicious Activity Monitoring

  - [x] 14.1 Create `suspicious-activity.service.ts` with auto-moderation


    - Methods: `flagActivity()`, `processFlag()`, `getUserFlags()`
    - _Requirements: Anti-Tamper System_

## Phase 6: Backend API Routes

- [-] 15. Implement Tutorías Controller and Routes

  - [x] 15.1 Create battle analysis endpoints

    - `POST /api/tutorias/battle-analysis/request`
    - `GET /api/tutorias/battle-analysis/history`
    - `GET /api/tutorias/battle-analysis/:battleId`
    - _Requirements: 1.2, 1.6_

  - [x] 15.2 Create AI tutor endpoints
    - `POST /api/tutorias/ai-tutor/ask`
    - `GET /api/tutorias/ai-tutor/history`

    - _Requirements: 2.1, 2.5_
  - [x] 15.3 Create breed advisor endpoint

    - `POST /api/tutorias/breed-advisor/ask`
    - _Requirements: 3.1, 3.6_
  - [x] 15.4 Create PokéBox endpoints
    - `GET /api/tutorias/pokebox`

    - `POST /api/tutorias/pokebox/protect`
    - `GET /api/tutorias/pokebox/duplicates`
    - _Requirements: 4.1, 4.3, 4.4_
  - [x] 15.5 Create pricing and cooldown endpoints

    - `GET /api/tutorias/pricing`
    - `PUT /api/tutorias/pricing` (admin)
    - `GET /api/tutorias/cooldowns`
    - _Requirements: 7.1, 7.2, 6.2_
  - [x] 15.6 Create admin endpoints for anti-abuse monitoring
    - `GET /api/admin/suspicious-activity`
    - `POST /api/admin/suspicious-activity/:id/resolve`
    - `GET /api/admin/balance-ledger/:userId`
    - _Requirements: Anti-Tamper System_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Frontend Implementation

- [-] 17. Create Frontend Types and API Client


  - [x] 17.1 Create frontend types (`frontend/src/lib/types/tutorias.ts`)

    - Mirror backend types for type safety
    - _Requirements: All_
  - [x] 17.2 Add Tutorías API methods to api-client


    - Battle analysis, AI tutor, breed advisor, PokéBox, pricing, cooldowns
    - _Requirements: All_

- [-] 18. Implement Tutorías Dashboard Page

  - [x] 18.1 Create main Tutorías page (`frontend/src/app/tutorias/page.tsx`)


    - Dashboard with service cards (Battle Analysis, AI Tutor, Breed Advisor, PokéBox Manager)
    - Display user balance prominently
    - Show cooldown indicators on service cards
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [ ]* 18.2 Write property test for Balance Display Consistency
    - **Property 17: Balance Display Consistency**
    - **Validates: Requirements 9.3**

- [-] 19. Implement Battle Analysis Page

  - [x] 19.1 Create Battle Analysis page (`frontend/src/app/tutorias/battle-analysis/page.tsx`)


    - Battle history list with date, opponent, result
    - Analysis request button with cost display
    - Turn-by-turn analysis display with recommendations
    - _Requirements: 1.2, 1.3, 1.6_

- [-] 20. Implement AI Tutor Page

  - [x] 20.1 Create AI Tutor page (`frontend/src/app/tutorias/ai-tutor/page.tsx`)



    - Chat-style interface for questions
    - Option to include team data
    - Response display with team analysis and suggestions
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 21. Implement Breed Advisor Page
  - [x] 21.1 Create Breed Advisor page (`frontend/src/app/tutorias/breed-advisor/page.tsx`)
    - Target species/IVs/nature/ability selection
    - Shiny advice toggle
    - Breeding pairs and chain display
    - Shiny odds calculator (Masuda, Crystal methods)
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

- [x] 22. Implement PokéBox Manager Page
  - [x] 22.1 Create PokéBox Manager page (`frontend/src/app/tutorias/pokebox/page.tsx`)
    - Pokémon grid with filtering (species, type, shiny, IV range, EV total, nature, ability, level)
    - Duplicate detection view with grouping
    - Protection toggle for Pokémon
    - IV/EV calculator display for selected Pokémon
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 23. Implement Stat Planner Modal
  - [x] 23.1 Create Stat Planner component (`frontend/src/components/tutorias/StatPlannerModal.tsx`)
    - Current stats, IVs, EVs, nature display
    - EV sliders with real-time stat projection
    - Level 50 and Level 100 stat calculations
    - Save EV plan functionality
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 24. Add Navigation Integration
  - [x] 24.1 Add Tutorías link to main Navbar
    - _Requirements: 9.1_
  - [x] 24.2 Create Tutorías sub-navigation component (integrated in each page with back links)
    - _Requirements: 9.2_

## Phase 8: Plugin Integration

- [x] 25. Implement Battle Log Capture in Plugin
  - [x] 25.1 Create `BattleLogCapture.java` in minecraft-plugin-v2
    - Capture battle start with initial state (teams, moves, items, abilities)
    - Capture each turn's actions (move, target, damage, critical, effectiveness, status)
    - Capture switches (incoming/outgoing Pokémon)
    - Capture field state (weather, terrain, hazards)
    - Send complete battle log to backend API on battle end
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 26. Implement Secure Plugin Communication
  - [x] 26.1 Add HMAC signing to plugin HTTP requests (`SecureHttpClient.java`)
    - Include timestamp and nonce for replay attack prevention
    - _Requirements: Anti-Tamper System_
  - [ ]* 26.2 Write property test for Signed Request Validation
    - **Property 19: Signed Request Validation**
    - **Validates: Anti-Tamper System**
  - [ ]* 26.3 Write property test for Replay Attack Prevention
    - **Property 22: Replay Attack Prevention**
    - **Validates: Anti-Tamper System**

- [ ] 27. Implement Pending Sync System
  - [ ] 27.1 Create pending deduction queue in backend
    - Queue deductions for offline players
    - Process when player logs in
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 27.2 Add pending sync processing to plugin
    - Check for pending deductions on player login
    - Execute cobbledollars remove command
    - Confirm sync to backend
    - _Requirements: 10.2, 10.5_
  - [ ]* 27.3 Write property test for Pending Sync Creation
    - **Property 18: Pending Sync Creation**
    - **Validates: Requirements 10.1**

## Phase 9: Admin Panel Integration

- [x] 28. Add Tutorías Admin Controls
  - [x] 28.1 Add pricing configuration panel to admin page
    - View/edit prices for all AI services
    - View/edit cooldown durations
    - View/edit daily limits
    - _Requirements: 7.1, 7.2, 6.3, 11.3_
  - [x] 28.2 Add suspicious activity monitoring panel
    - List flagged activities with severity
    - Resolve/action buttons
    - User balance ledger view
    - _Requirements: Anti-Tamper System_

- [ ] 29. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
