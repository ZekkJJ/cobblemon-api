# Requirements Document

## Introduction

Esta especificación define una página de mods para el servidor Cobblemon Los Pitufos. La página permitirá a los jugadores ver, descargar e instalar los mods requeridos/opcionales del servidor. Incluye un sistema de notificaciones para alertar cuando se añaden nuevos mods, generación automática de paquetes ZIP optimizados, y detección de versiones. Los archivos de mods se almacenarán comprimidos en el backend y se servirán de forma eficiente para minimizar el uso de ancho de banda.

## Glossary

- **Mods_Page_System**: Sistema que gestiona la visualización y descarga de mods del servidor
- **Mod_Registry**: Base de datos MongoDB que almacena metadatos de los mods disponibles
- **Mod_Package**: Archivo ZIP que contiene uno o más mods listos para instalar
- **Notification_System**: Sistema que detecta y notifica nuevos mods a los usuarios
- **Version_Tracker**: Sistema que rastrea versiones de mods y detecta actualizaciones
- **Download_Service**: Servicio del backend que genera y sirve archivos ZIP optimizados
- **Mod_Card**: Componente visual que muestra información de un mod individual
- **LocalStorage_Cache**: Almacenamiento local del navegador para rastrear mods vistos/descargados

## Requirements

### Requirement 1: Listado de Mods

**User Story:** Como jugador, quiero ver todos los mods disponibles del servidor organizados por categoría, para saber qué necesito instalar.

#### Acceptance Criteria

1. WHEN a user visits the mods page THEN the Mods_Page_System SHALL display all mods from the Mod_Registry organized by category (required, optional, resource packs)
2. WHEN displaying a mod THEN the Mod_Card SHALL show mod name, version, file size, description, and compatibility info (Minecraft version, Fabric/Forge)
3. WHEN a mod is marked as required THEN the Mod_Card SHALL display a red "Requerido" badge prominently
4. WHEN a mod is marked as optional THEN the Mod_Card SHALL display a blue "Opcional" badge
5. WHEN the mods list loads THEN the Mods_Page_System SHALL show total count of required mods and optional mods

### Requirement 2: Sistema de Notificaciones de Nuevos Mods

**User Story:** Como jugador, quiero ser notificado cuando se añaden nuevos mods al servidor, para mantener mi instalación actualizada.

#### Acceptance Criteria

1. WHEN a user visits the mods page THEN the Notification_System SHALL compare the current mod list with the user's LocalStorage_Cache of seen mods
2. WHEN new mods are detected THEN the Notification_System SHALL display a toast notification "¡X nuevo(s) mod(s) añadido(s)! ¿Descargar?"
3. WHEN the user clicks the notification THEN the Mods_Page_System SHALL scroll to and highlight the new mods
4. WHEN a user views a new mod THEN the Notification_System SHALL mark it as "seen" in LocalStorage_Cache
5. WHEN displaying new mods THEN the Mod_Card SHALL show a pulsing "NUEVO" badge with animation

### Requirement 3: Detección de Versiones y Actualizaciones

**User Story:** Como jugador, quiero saber si mis mods están desactualizados, para actualizar solo lo necesario.

#### Acceptance Criteria

1. WHEN a mod has been updated THEN the Version_Tracker SHALL compare the new version with the user's last downloaded version in LocalStorage_Cache
2. WHEN an update is available THEN the Mod_Card SHALL display an orange "Actualización disponible" badge with the new version number
3. WHEN displaying version info THEN the Mod_Card SHALL show current version and changelog summary if available
4. WHEN the user downloads an updated mod THEN the Version_Tracker SHALL update the LocalStorage_Cache with the new version

### Requirement 4: Descarga Individual de Mods

**User Story:** Como jugador, quiero descargar mods individuales, para actualizar solo los que necesito.

#### Acceptance Criteria

1. WHEN a user clicks download on a Mod_Card THEN the Download_Service SHALL serve the mod file with correct filename and extension
2. WHEN downloading THEN the Mod_Card SHALL show a progress indicator and disable the download button
3. WHEN the download completes THEN the Mod_Card SHALL show a success checkmark and update LocalStorage_Cache
4. WHEN a download fails THEN the Mods_Page_System SHALL display an error message with retry option

### Requirement 5: Descarga de Paquete Completo (All-in-One ZIP)

**User Story:** Como jugador nuevo, quiero descargar todos los mods requeridos en un solo archivo, para instalar rápidamente.

#### Acceptance Criteria

1. WHEN a user clicks "Descargar Todo" THEN the Download_Service SHALL generate a ZIP containing all required mods
2. WHEN generating the ZIP THEN the Download_Service SHALL use maximum compression (level 9) to minimize file size
3. WHEN the ZIP is ready THEN the Download_Service SHALL serve it with filename "LosPitufos-Mods-vX.X.zip" including version
4. WHEN downloading the package THEN the Mods_Page_System SHALL show total size and estimated download time
5. WHEN the download completes THEN the Mods_Page_System SHALL mark all included mods as downloaded in LocalStorage_Cache

### Requirement 6: Almacenamiento y Compresión de Mods en Backend

**User Story:** Como administrador, quiero que los mods se almacenen de forma eficiente, para minimizar costos de almacenamiento y ancho de banda.

#### Acceptance Criteria

1. WHEN a mod is uploaded to the backend THEN the Download_Service SHALL store it compressed using gzip with maximum compression
2. WHEN serving a mod file THEN the Download_Service SHALL set appropriate Content-Encoding headers for browser decompression
3. WHEN storing mod metadata THEN the Mod_Registry SHALL include original size, compressed size, and checksum (SHA-256)
4. WHEN a mod file is requested THEN the Download_Service SHALL stream the file to avoid memory issues with large files
5. WHEN generating ZIP packages THEN the Download_Service SHALL cache the result until any included mod is updated

### Requirement 7: Panel de Administración de Mods

**User Story:** Como administrador, quiero gestionar los mods desde un panel, para añadir, actualizar o eliminar mods fácilmente.

#### Acceptance Criteria

1. WHEN an admin accesses the mods admin panel THEN the Mods_Page_System SHALL display a form to add new mods with file upload
2. WHEN uploading a mod THEN the admin panel SHALL extract mod metadata (name, version) from the JAR manifest if available
3. WHEN a mod is added THEN the Mod_Registry SHALL store the mod and increment the global mod version counter
4. WHEN a mod is updated THEN the Mod_Registry SHALL archive the old version and store the new one
5. WHEN a mod is deleted THEN the Mod_Registry SHALL mark it as inactive rather than removing it completely

### Requirement 8: Instrucciones de Instalación

**User Story:** Como jugador, quiero ver instrucciones claras de instalación, para saber dónde colocar los mods descargados.

#### Acceptance Criteria

1. WHEN the mods page loads THEN the Mods_Page_System SHALL display a collapsible "Cómo Instalar" section at the top
2. WHEN displaying instructions THEN the Mods_Page_System SHALL show the path de instalación (.minecraft/mods) con ejemplos visuales
3. WHEN the user's OS is detected THEN the Mods_Page_System SHALL show OS-specific instructions (Windows, Mac, Linux)
4. WHEN displaying instructions THEN the Mods_Page_System SHALL include a button to copy the mods folder path to clipboard

### Requirement 9: Filtros y Búsqueda

**User Story:** Como jugador, quiero filtrar y buscar mods, para encontrar rápidamente lo que necesito.

#### Acceptance Criteria

1. WHEN the mods page loads THEN the Mods_Page_System SHALL display filter buttons for categories (All, Required, Optional, Resource Packs)
2. WHEN a user types in the search box THEN the Mods_Page_System SHALL filter mods by name or description in real-time
3. WHEN filters are applied THEN the Mods_Page_System SHALL update the mod count display accordingly
4. WHEN no mods match the filter THEN the Mods_Page_System SHALL display a friendly "No se encontraron mods" message

### Requirement 10: API Endpoints para Mods

**User Story:** Como sistema, quiero endpoints API para gestionar mods, para soportar el frontend y futuras integraciones.

#### Acceptance Criteria

1. WHEN the frontend requests the mod list THEN the Backend_API SHALL return all active mods with metadata at GET /api/mods
2. WHEN requesting a mod download THEN the Backend_API SHALL serve the file at GET /api/mods/:id/download with streaming
3. WHEN requesting the all-in-one package THEN the Backend_API SHALL serve the cached ZIP at GET /api/mods/package
4. WHEN an admin uploads a mod THEN the Backend_API SHALL accept multipart form data at POST /api/mods with authentication
5. WHEN checking for updates THEN the Backend_API SHALL return mod versions and checksums at GET /api/mods/versions
