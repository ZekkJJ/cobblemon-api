# Implementation Plan

## Phase 1: Technical Fixes

- [x] 1. Fix Pity Configuration Mismatch
  - [x] 1.1 Update frontend PityDisplay component
    - Fix hardcoded values to use 75/90 instead of 50/200
    - Update probability calculation to match backend
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 1.2 Sync pity types between frontend and backend
    - Update `frontend/src/lib/types/gacha.ts` PityStatus interface
    - Ensure currentPity, softPityStart, hardPity fields match
    - _Requirements: 1.2_
  - [x] 1.3 **CRITICAL FIX**: Update backend JS routes pity values
    - Changed SOFT_PITY_START from 50 to 75
    - Changed HARD_PITY from 200 to 90
    - Changed SOFT_PITY_INCREASE from 0.0005 to 0.05 (5% per pull)
    - Fixed in `backend/routes/pokemon-gacha.routes.js`
  - [x] 1.4 **CRITICAL FIX**: Add totalPulls to pityStatus response
    - Added getTotalPulls() method to count from history
    - Updated pull, multiPull, and pity endpoints to return totalPulls

- [x] 2. Expand Pokemon Pool (400+ Pokemon)
  - [x] 2.1 Expand Common tier Pokemon (~150 Pokemon)
  - [x] 2.2 Expand Uncommon tier Pokemon (~100 Pokemon)
  - [x] 2.3 Expand Rare tier Pokemon (~80 Pokemon)
  - [x] 2.4 Expand Epic tier Pokemon (~50 Pokemon)
  - [x] 2.5 Expand Legendary tier Pokemon (~30 Pokemon)
  - [x] 2.6 Expand Mythic tier Pokemon (~25 Pokemon)

- [x] 3. Checkpoint - Pool expansion complete

## Phase 2: Discord Webhook Integration

- [x] 4. Implement Discord Webhook Service
  - [x] 4.1 Create GachaWebhookService
  - [x] 4.2 Build Discord embed format
  - [x] 4.3 Integrate webhook into pull flow

## Phase 3: Plugin In-Game Effects

- [x] 5. Update Plugin Sound Effects
  - [x] 5.1 Add Ender Dragon death sound for Legendary/Mythic/Shiny
  - [x] 5.2 Add XP orb sound for Epic
  - [x] 5.3 Add server-wide broadcast for rare pulls
  - [x] 5.4 Add color formatting for rarity tiers
- [ ] 6. Checkpoint - Test plugin effects

## Phase 4: Premium Pull Animation

- [x] 7. Redesign Pull Animation
  - [x] 7.1 Create multi-phase animation sequence
  - [x] 7.2 Add screen shake for Epic+ reveals
  - [x] 7.3 Add particle effects for reveals
  - [x] 7.4 Implement skip button with localStorage preference

## Phase 5: Sound Effects

- [x] 8. Add Frontend Sound Effects
  - [x] 8.1 Create gacha-sounds.ts utility
  - [x] 8.2 Add synthesized fallback sounds (Web Audio API)
  - [x] 8.3 Add reveal sounds by rarity
  - [x] 8.4 Add pull sequence sounds
  - [x] 8.5 Add celebration sound for mythic/shiny
  - [x] 8.6 Respect user mute preference

## Phase 6: Enhanced Results Modal

- [x] 9. Upgrade ResultsModal Component
  - [x] 9.1 Add animated particle effects for Epic+ rewards
  - [x] 9.2 Add shiny sparkle animation and golden border
  - [x] 9.3 Add rainbow gradient background for Mythic
  - [x] 9.4 Add celebration overlay for first-time Legendary/Mythic/Shiny
  - [x] 9.5 Dynamic header color based on best reward
- [ ] 10. Checkpoint - Test visual improvements

## Phase 7: Daily Free Pull System

- [x] 11. Implement Daily Pull Backend
  - [x] 11.1 Create DailyPullService
  - [x] 11.2 Create gacha_daily_pulls collection
  - [x] 11.3 Add daily pull API endpoints
  - [x] 11.4 Restrict daily pull to Standard Banner

- [x] 12. Implement Daily Pull Frontend
  - [x] 12.1 Create DailyPullSection component
  - [x] 12.2 Add countdown timer
  - [x] 12.3 Add streak display
  - [x] 12.4 Integrate into main gacha page

## Phase 8: Stardust System

- [x] 13. Implement Stardust Backend
  - [x] 13.1 Create StardustService
  - [x] 13.2 Create GachaPokedexService
  - [x] 13.3 Create gacha_stardust collection
  - [x] 13.4 Create gacha_pokedex collection
  - [x] 13.5 Integrate stardust into pull flow
    - **CRITICAL FIX**: Updated trackPokemonPull to give Stardust for ALL duplicates
    - Stardust rates: Common=10, Uncommon=25, Rare=50, Epic=100, Legendary=250, Mythic=500
    - Shiny duplicates give 5x Stardust
    - All Pokemon are now delivered (no more fusion blocking)
  - [x] 13.6 Add stardust API endpoints
    - Added GET /api/pokemon-gacha/stardust endpoint
    - Updated pull/multiPull responses to include stardust info

- [x] 14. Implement Stardust Frontend
  - [x] 14.1 Create StardustDisplay component
  - [x] 14.2 Add balance display with animation
  - [x] 14.3 Create Stardust Shop UI
  - [x] 14.4 Integrate into main gacha page
- [ ] 15. Checkpoint - Test daily pull and stardust

## Phase 9: Epitomized Path System

- [x] 16. Implement Epitomized Path Backend
  - [x] 16.1 Create EpitomizedPathService
  - [x] 16.2 Create gacha_epitomized collection
  - [x] 16.3 Integrate into pull flow
  - [x] 16.4 Add epitomized API endpoints

- [x] 17. Implement Epitomized Path Frontend
  - [x] 17.1 Create EpitomizedPathSelector component
  - [x] 17.2 Add Fate Points display
  - [x] 17.3 Add Pokemon selector modal
  - [x] 17.4 Integrate into main gacha page

## Phase 10: History and Stats Pages

- [x] 18. Complete History Page
  - [x] 18.1 Add filter panel (rarity, banner, date, shiny)
  - [x] 18.2 Add quick stats summary
  - [x] 18.3 Add CSV export functionality
  - [x] 18.4 Improve history card design
- [x] 19. Complete Stats Page
  - [x] 19.1 Add animated counters
  - [x] 19.2 Add rarity bar chart
  - [x] 19.3 Add luck meter visualization
  - [x] 19.4 Add detailed analysis section
  - [x] 19.5 Add Pokedex progress section
- [ ] 20. Checkpoint - Test history and stats

## Phase 11: Banner Card Improvements

- [x] 21. Enhance BannerCard Component
  - [x] 21.1 Add animated countdown timer
  - [x] 21.2 Add rate info tooltip on hover
  - [x] 21.3 Add animated border for limited banners
  - [x] 21.4 Add Epitomized Path indicator
  - [x] 21.5 Improve featured Pokemon display

## Phase 12: Plugin Updates

- [x] 22. Update GachaManager for New Features
  - [x] 22.1 Add sound effects based on rarity
  - [x] 22.2 Add server-wide broadcasts for Epic+ pulls
  - [x] 22.3 Add /gacha info command for pity, stardust, daily status
  - [x] 22.4 Add color-coded rarity display

## Phase 13: Security and Rate Limiting

- [ ] 23. Implement Rate Limiting (Already exists in routes)
- [ ] 24. Final Checkpoint
