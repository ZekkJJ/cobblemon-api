# Implementation Plan

- [ ] 1. Create data normalization utilities in API client
  - Create helper function `normalizeStarter()` to ensure all required properties exist
  - Create helper function `generateDefaultSprites()` to generate sprite URLs from pokemonId
  - Create helper function `normalizeStarterResponse()` to validate and normalize API responses
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 1.1 Write property test for data normalization
  - **Property 1: Data normalization preserves count**
  - **Validates: Requirements 1.1, 4.1**

- [ ] 1.2 Write property test for safe data access
  - **Property 2: Safe data access never throws**
  - **Validates: Requirements 1.2, 1.4, 2.2, 2.4, 3.1, 3.2**

- [ ] 1.3 Write property test for sprite URL generation
  - **Property 3: Sprite URLs are always valid**
  - **Validates: Requirements 1.3**

- [ ] 2. Update API client to use normalization
  - Modify `startersAPI.getAll()` to normalize response before returning
  - Add error handling for invalid responses
  - Ensure response always returns valid structure with empty arrays as fallback
  - _Requirements: 1.1, 1.2, 1.4_

- [ ] 3. Refactor StarterCard component for robustness
  - Add prop validation at component entry
  - Replace all property access with optional chaining (`?.`)
  - Replace all array iterations with safe fallbacks (`?? []`)
  - Add error boundary for invalid data
  - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_

- [ ] 3.1 Write property test for component rendering
  - **Property 6: Component renders without errors**
  - **Validates: Requirements 2.3, 3.3, 3.4**

- [ ] 4. Fix Galería page data handling
  - Update data fetching to handle undefined `data.starters`
  - Use safe filtering with optional chaining for `isClaimed`
  - Add validation before setting state
  - Update statistics calculation to use normalized data
  - _Requirements: 2.1, 4.1, 4.2, 4.3, 4.4_

- [ ] 4.1 Write property test for filtering operations
  - **Property 4: Filtering operations are safe and correct**
  - **Validates: Requirements 2.1, 5.1, 5.2, 5.3, 5.4**

- [ ] 4.2 Write property test for statistics calculation
  - **Property 5: Statistics calculation is consistent**
  - **Validates: Requirements 4.2, 4.3, 4.4**

- [ ] 5. Fix Pokédex page data handling
  - Update data fetching to handle undefined `data.starters`
  - Use safe filtering for generation filter with optional chaining
  - Use safe filtering for type filter with optional chaining
  - Use safe filtering for search with optional chaining
  - Use safe filtering for availability with optional chaining
  - Update statistics calculation to use normalized data
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Add comprehensive error logging
  - Add console.error for invalid API responses
  - Add console.error for invalid starter data in components
  - Add console.warn for missing optional properties
  - _Requirements: 3.4_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Manual verification
  - Verify Pokédex shows all 27 starters
  - Verify Galería shows correct claimed starters
  - Verify no console errors appear
  - Verify filters work correctly
  - Verify statistics are accurate
  - _Requirements: 1.1, 2.1, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_
