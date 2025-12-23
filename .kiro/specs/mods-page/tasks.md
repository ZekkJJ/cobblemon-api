# Implementation Plan

## Mods Page - Download System with Notifications

- [x] 1. Create backend mod types and schemas


  - [x] 1.1 Create Mod types and interfaces


    - Create `backend/src/shared/types/mod.types.ts`
    - Define Mod interface with all fields (name, version, category, sizes, checksum, etc.)
    - Define ModListResponse and ModVersionsResponse types
    - _Requirements: 10.1_
  - [x] 1.2 Create Zod validation schemas for mods


    - Create `backend/src/modules/mods/mods.schema.ts`
    - Define modSchema for validation
    - Define uploadModSchema for file uploads
    - _Requirements: 10.4_

- [x] 2. Create backend file storage service


  - [x] 2.1 Implement FileStorageService


    - Create `backend/src/modules/mods/file-storage.service.ts`
    - Implement saveModFile with gzip compression
    - Implement getModFile with streaming
    - Implement deleteModFile (move to archive)
    - Implement calculateChecksum (SHA-256)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 2.2 Write property test for compression integrity
    - **Property 7: Compression Integrity**
    - **Validates: Requirements 6.1, 6.3**

- [x] 3. Create backend ZIP generator service


  - [x] 3.1 Implement ZipGeneratorService


    - Create `backend/src/modules/mods/zip-generator.service.ts`
    - Implement generatePackage with compression level 9
    - Implement caching logic (invalidate on mod update)
    - Implement getPackageInfo (size, version)
    - _Requirements: 5.1, 5.2, 5.3, 6.5_
  - [ ]* 3.2 Write property test for ZIP package contents
    - **Property 6: ZIP Package Contents**
    - **Validates: Requirements 5.1**
  - [ ]* 3.3 Write property test for cache invalidation
    - **Property 12: Cache Invalidation**
    - **Validates: Requirements 6.5**

- [x] 4. Create backend mods service


  - [x] 4.1 Implement ModsService


    - Create `backend/src/modules/mods/mods.service.ts`
    - Implement getAllMods (active only)
    - Implement getModById
    - Implement createMod (with file processing)
    - Implement updateMod (archive old version)
    - Implement deleteMod (soft delete)
    - Implement getModVersions
    - _Requirements: 7.3, 7.4, 7.5, 10.1, 10.5_
  - [ ]* 4.2 Write property test for soft delete preservation
    - **Property 9: Soft Delete Preservation**
    - **Validates: Requirements 7.5**

- [x] 5. Create backend mods controller and routes


  - [x] 5.1 Implement ModsController


    - Create `backend/src/modules/mods/mods.controller.ts`
    - Implement GET /api/mods (list all)
    - Implement GET /api/mods/versions (version check)
    - Implement GET /api/mods/:id/download (stream file)
    - Implement GET /api/mods/package (serve ZIP)
    - Implement POST /api/mods (admin upload with multer)
    - Implement PUT /api/mods/:id (admin update)
    - Implement DELETE /api/mods/:id (admin soft delete)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [x] 5.2 Create mods routes


    - Create `backend/src/modules/mods/mods.routes.ts`
    - Configure multer for file uploads
    - Add admin authentication middleware for write operations
    - _Requirements: 10.4_
  - [ ]* 5.3 Write property test for API response completeness
    - **Property 10: API Response Completeness**
    - **Validates: Requirements 10.1**

- [x] 6. Checkpoint - Ensure all backend tests pass
  - All backend routes pass syntax validation and diagnostics.

- [x] 7. Create frontend mod types


  - [x] 7.1 Create Mod types for frontend


    - Create `frontend/src/lib/types/mod.ts`
    - Define Mod interface matching backend
    - Define ModsLocalStorage interface
    - _Requirements: 1.2_

- [x] 8. Create frontend LocalStorageService


  - [x] 8.1 Implement LocalStorageService


    - Create `frontend/src/lib/mods-storage.ts`
    - Implement getSeenMods, markModAsSeen
    - Implement getDownloadedVersion, markModAsDownloaded
    - Implement getLastVisit, updateLastVisit
    - _Requirements: 2.1, 2.4, 3.4, 4.3_
  - [ ]* 8.2 Write property test for LocalStorage update on download
    - **Property 8: LocalStorage Update on Download**
    - **Validates: Requirements 4.3, 3.4**

- [x] 9. Create frontend utility functions


  - [x] 9.1 Create version comparison utility


    - Create `frontend/src/lib/mod-utils.ts`
    - Implement compareVersions function (semver comparison)
    - Implement detectOS function (Windows/Mac/Linux)
    - Implement filterMods function (by search and category)
    - _Requirements: 3.1, 8.3, 9.2_
  - [ ]* 9.2 Write property test for version comparison
    - **Property 3: Version Comparison Correctness**
    - **Validates: Requirements 3.1**
  - [ ]* 9.3 Write property test for OS detection
    - **Property 11: OS Detection Accuracy**
    - **Validates: Requirements 8.3**
  - [ ]* 9.4 Write property test for search filter
    - **Property 5: Search Filter Accuracy**
    - **Validates: Requirements 9.2**

- [x] 10. Create ModCard component


  - [x] 10.1 Implement ModCard component


    - Create `frontend/src/components/ModCard.tsx`
    - Display mod name, version, size, description
    - Display category badge (Requerido=red, Opcional=blue)
    - Display "NUEVO" badge with pulse animation for new mods
    - Display "Actualización disponible" badge for updates
    - Download button with progress indicator
    - _Requirements: 1.2, 1.3, 1.4, 2.5, 3.2, 4.2_
  - [ ]* 10.2 Write property test for required badge rendering
    - **Property 4: Required Badge Rendering**
    - **Validates: Requirements 1.3**

- [x] 11. Create NotificationToast component




  - [x] 11.1 Implement NotificationToast component

    - Create `frontend/src/components/ModNotificationToast.tsx`
    - Display "¡X nuevo(s) mod(s) añadido(s)!"
    - "Ver nuevos" button to scroll to new mods
    - Dismiss button
    - Auto-dismiss after 10 seconds
    - _Requirements: 2.2, 2.3_

- [x] 12. Create InstallGuide component





  - [x] 12.1 Implement InstallGuide component

    - Create `frontend/src/components/InstallGuide.tsx`
    - Collapsible section with installation instructions
    - OS-specific paths (.minecraft/mods)
    - Copy path to clipboard button
    - Visual examples/screenshots
    - _Requirements: 8.1, 8.2, 8.3, 8.4_







- [x] 13. Create ModFilters component

  - [x] 13.1 Implement ModFilters component




    - Create `frontend/src/components/ModFilters.tsx`
    - Category filter buttons (All, Required, Optional, Resource Packs)
    - Search input with real-time filtering
    - Display filtered count
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 14. Checkpoint - Ensure all component tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Create ModsPage


  - [x] 15.1 Implement ModsPage

    - Create `frontend/src/app/mods/page.tsx`
    - Fetch mods from API on load
    - Detect new mods by comparing with LocalStorage
    - Show NotificationToast if new mods detected
    - Display mod counts (required, optional)
    - Integrate ModFilters, InstallGuide, ModCard components
    - "Descargar Todo" button for ZIP package
    - Handle download progress and errors
    - _Requirements: 1.1, 1.5, 2.1, 2.2, 5.4, 5.5_
  - [ ]* 15.2 Write property test for mod count accuracy
    - **Property 1: Mod Count Accuracy**
    - **Validates: Requirements 1.5**
  - [ ]* 15.3 Write property test for new mod detection
    - **Property 2: New Mod Detection**
    - **Validates: Requirements 2.1, 2.2**

- [x] 16. Update frontend API client






  - [x] 16.1 Add mods API to api-client






    - Update `frontend/src/lib/api-client.ts`
    - Add modsAPI.getAll()
    - Add modsAPI.getVersions()
    - Add modsAPI.downloadMod(id)
    - Add modsAPI.downloadPackage()
    - _Requirements: 10.1, 10.2, 10.3, 10.5_




- [x] 17. Add mods link to Navbar


  - [x] 17.1 Update Navbar component

    - Add "Mods" link to navigation
    - Add notification badge if new mods available
    - _Requirements: 2.2_

- [x] 18. Create Admin Mods Panel (optional)


  - [x] 18.1 Implement AdminModPanel

    - Create `frontend/src/components/AdminModPanel.tsx`
    - Form to upload new mod (file + metadata)
    - List of existing mods with edit/delete buttons
    - Auto-extract metadata from JAR manifest
    - _Requirements: 7.1, 7.2_

- [x] 19. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.
