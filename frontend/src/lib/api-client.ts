// API Client para comunicación con el backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Función helper para hacer llamadas al backend con manejo de errores
 */
async function apiCall<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error en la solicitud' }));
      throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error de conexión con el servidor');
  }
}

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  /**
   * Obtiene la URL de autenticación de Discord
   */
  getDiscordAuthUrl: () => {
    return `${API_BASE_URL}/api/auth/discord`;
  },

  /**
   * Maneja el callback de Discord OAuth
   */
  handleCallback: (code: string) => 
    apiCall(`/api/auth/callback?code=${code}`),

  /**
   * Verifica un usuario por nombre de usuario (sin OAuth)
   */
  verifyUsername: (data: { discordUsername: string; nickname?: string }) =>
    apiCall('/api/auth/verify-username', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// GACHA API
// ============================================================================

export const gachaAPI = {
  /**
   * Obtiene el estado de gacha de un usuario
   */
  getStatus: (discordId: string) =>
    apiCall(`/api/gacha/roll?discordId=${discordId}`),

  /**
   * Realiza una tirada de gacha clásica
   */
  roll: (data: { discordId: string; discordUsername: string }) =>
    apiCall('/api/gacha/roll', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Realiza una tirada de gacha Soul Driven
   */
  soulDriven: (data: { 
    discordId: string; 
    discordUsername: string; 
    answers: string[] 
  }) =>
    apiCall('/api/gacha/soul-driven', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// SHOP API
// ============================================================================

export const shopAPI = {
  /**
   * Obtiene el stock de Pokéballs disponibles
   */
  getStock: () =>
    apiCall('/api/shop/stock'),

  /**
   * Obtiene el balance de CobbleDollars de un jugador
   * Acepta discordId o minecraftUuid
   */
  getBalance: (identifier: string) =>
    apiCall(`/api/shop/balance?discordId=${identifier}`),

  /**
   * Realiza una compra en la tienda
   */
  purchase: (data: { uuid: string; itemId: string; quantity: number }) =>
    apiCall('/api/shop/purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Obtiene el historial de compras de un jugador
   */
  getPurchases: (uuid: string) =>
    apiCall(`/api/shop/purchases?uuid=${uuid}`),

  /**
   * Marca una compra como reclamada
   */
  claimPurchase: (data: { uuid: string; purchaseId: string }) =>
    apiCall('/api/shop/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// PLAYERS API
// ============================================================================

export const playersAPI = {
  /**
   * Obtiene la lista de todos los jugadores
   */
  getAll: () =>
    apiCall('/api/players'),

  /**
   * Obtiene los datos de un jugador por UUID
   */
  getByUuid: (uuid: string) =>
    apiCall(`/api/players/${uuid}`),

  /**
   * Obtiene los datos de un jugador por Discord ID
   */
  getByDiscordId: (discordId: string) =>
    apiCall(`/api/players?discordId=${discordId}`),
};

// ============================================================================
// TOURNAMENTS API
// ============================================================================

export const tournamentsAPI = {
  /**
   * Obtiene la lista de todos los torneos
   */
  getAll: () =>
    apiCall('/api/tournaments'),

  /**
   * Obtiene torneos activos
   */
  getActive: () =>
    apiCall('/api/tournaments/active'),

  /**
   * Obtiene los datos de un torneo por ID
   */
  getById: (id: string) =>
    apiCall(`/api/tournaments/${id}`),

  /**
   * Obtiene un torneo por código
   */
  getByCode: (code: string) =>
    apiCall(`/api/tournaments/code/${code}`),

  // ============ ADMIN FUNCTIONS ============

  /**
   * Crea un nuevo torneo (admin)
   */
  create: (data: {
    name: string;
    description: string;
    startDate: string;
    maxParticipants: number;
    bracketType: 'single' | 'double';
    prizes: string;
    rules?: string;
    format?: string;
  }) =>
    apiCall('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Actualiza un torneo (admin)
   */
  update: (id: string, data: {
    name?: string;
    description?: string;
    startDate?: string;
    maxParticipants?: number;
    status?: string;
    prizes?: string;
    rules?: string;
  }) =>
    apiCall(`/api/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Elimina un torneo (admin)
   */
  delete: (id: string) =>
    apiCall(`/api/tournaments/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Inicia un torneo (admin)
   */
  start: (id: string) =>
    apiCall(`/api/tournaments/${id}/start`, {
      method: 'POST',
    }),

  /**
   * Cancela un torneo (admin)
   */
  cancel: (id: string) =>
    apiCall(`/api/tournaments/${id}/cancel`, {
      method: 'POST',
    }),

  /**
   * Remueve un participante (admin)
   */
  removeParticipant: (tournamentId: string, participantId: string) =>
    apiCall(`/api/tournaments/${tournamentId}/participants/${participantId}`, {
      method: 'DELETE',
    }),

  /**
   * Reordena participantes (admin)
   */
  reorderParticipants: (tournamentId: string, newOrder: string[]) =>
    apiCall(`/api/tournaments/${tournamentId}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ newOrder }),
    }),

  /**
   * Fuerza el resultado de un match (admin)
   */
  forceMatchResult: (matchId: string, winnerId: string, tournamentId?: string) =>
    apiCall(`/api/tournaments/matches/${matchId}/force`, {
      method: 'POST',
      body: JSON.stringify({ winnerId, tournamentId }),
    }),

  // ============ USER FUNCTIONS ============

  /**
   * Inscribirse en un torneo (requiere cuenta verificada)
   */
  register: (code: string, minecraftUuid: string, username: string) =>
    apiCall('/api/tournaments/register', {
      method: 'POST',
      body: JSON.stringify({ code, minecraftUuid, username }),
    }),

  /**
   * Salir de un torneo
   */
  leave: (tournamentId: string, minecraftUuid: string) =>
    apiCall(`/api/tournaments/${tournamentId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ minecraftUuid }),
    }),
};

// ============================================================================
// STARTERS API
// ============================================================================

export const startersAPI = {
  /**
   * Obtiene la lista de todos los starters
   */
  getAll: () =>
    apiCall('/api/starters'),
};

// ============================================================================
// VERIFICATION API
// ============================================================================

export const verificationAPI = {
  /**
   * Genera un código de verificación desde la WEB (nuevo flujo)
   * El código se genera después del gacha roll y se usa en-game con /verify
   */
  generateWebCode: (discordId: string, discordUsername?: string) =>
    apiCall('/api/verification/generate-web', {
      method: 'POST',
      body: JSON.stringify({ discordId, discordUsername }),
    }),

  /**
   * Obtiene el estado de verificación de un usuario
   */
  getStatus: (discordId: string) =>
    apiCall(`/api/verification/status?discordId=${discordId}`),

  /**
   * Verifica el estado de un código específico
   */
  checkCode: (code: string) =>
    apiCall(`/api/verification/status?code=${code}`),

  /**
   * LEGACY: Genera un código de verificación para un UUID de Minecraft
   */
  generate: (uuid: string) =>
    apiCall('/api/verification/generate', {
      method: 'POST',
      body: JSON.stringify({ uuid }),
    }),

  /**
   * LEGACY: Verifica un código de verificación
   */
  verify: (data: { code: string; discordId: string }) =>
    apiCall('/api/verification/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// SERVER API
// ============================================================================

export const serverAPI = {
  /**
   * Obtiene el estado del servidor de Minecraft
   */
  getStatus: () =>
    apiCall('/api/server-status'),
};

// ============================================================================
// MODS API
// ============================================================================

export const modsAPI = {
  /**
   * Obtiene la lista de todos los mods activos
   */
  getAll: () =>
    apiCall('/api/mods'),

  /**
   * Obtiene las versiones de todos los mods
   */
  getVersions: () =>
    apiCall('/api/mods/versions'),

  /**
   * Obtiene información de un mod específico
   */
  getById: (id: string) =>
    apiCall(`/api/mods/${id}`),

  /**
   * Busca mods por texto
   */
  search: (query: string) =>
    apiCall(`/api/mods/search?q=${encodeURIComponent(query)}`),

  /**
   * Obtiene información del paquete ZIP
   */
  getPackageInfo: () =>
    apiCall('/api/mods/package/info'),

  /**
   * Obtiene la URL de descarga de un mod individual
   */
  getDownloadUrl: (id: string) =>
    `${API_BASE_URL}/api/mods/${id}/download`,

  /**
   * Obtiene la URL de descarga del paquete completo
   */
  getPackageDownloadUrl: () =>
    `${API_BASE_URL}/api/mods/package`,

  /**
   * Descarga un mod individual (retorna blob)
   */
  downloadMod: async (id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/api/mods/${id}/download`);
    if (!response.ok) {
      throw new Error('Error al descargar el mod');
    }
    return response.blob();
  },

  /**
   * Descarga el paquete completo (retorna blob)
   */
  downloadPackage: async (): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/api/mods/package`);
    if (!response.ok) {
      throw new Error('Error al descargar el paquete');
    }
    return response.blob();
  },
};

// ============================================================================
// PLAYER SHOP API
// ============================================================================

export const playerShopAPI = {
  /**
   * Obtiene listings activos con filtros
   */
  getListings: (filters?: {
    species?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    shinyOnly?: boolean;
    saleMethod?: 'direct' | 'bidding';
    sortBy?: 'pitufipuntos' | 'price' | 'createdAt' | 'expiresAt';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      });
    }
    return apiCall(`/api/player-shop/listings?${params.toString()}`);
  },

  /**
   * Obtiene detalle de un listing
   */
  getListing: (id: string) =>
    apiCall(`/api/player-shop/listings/${id}`),

  /**
   * Crea un nuevo listing
   */
  createListing: (data: {
    pokemonUuid: string;
    saleMethod: 'direct' | 'bidding';
    price?: number;
    startingBid?: number;
    duration?: number;
  }) =>
    apiCall('/api/player-shop/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Cancela un listing
   */
  cancelListing: (id: string) =>
    apiCall(`/api/player-shop/listings/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Obtiene los listings del usuario autenticado
   */
  getMyListings: (uuid: string) =>
    apiCall(`/api/player-shop/my-listings?uuid=${uuid}`),

  /**
   * Compra directa de un listing
   */
  purchaseListing: (id: string) =>
    apiCall(`/api/player-shop/listings/${id}/purchase`, {
      method: 'POST',
    }),

  /**
   * Coloca una puja en una subasta
   */
  placeBid: (id: string, amount: number) =>
    apiCall(`/api/player-shop/listings/${id}/bid`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  /**
   * Obtiene el historial de pujas de un listing
   */
  getBidHistory: (id: string) =>
    apiCall(`/api/player-shop/listings/${id}/bids`),
};

// ============================================================================
// TUTORIAS API
// ============================================================================

export const tutoriasAPI = {
  // ---- Pricing & Cooldowns ----
  /**
   * Obtiene los precios de todos los servicios
   */
  getPricing: () =>
    apiCall('/api/tutorias/pricing'),

  /**
   * Obtiene los cooldowns del usuario
   */
  getCooldowns: () =>
    apiCall('/api/tutorias/cooldowns'),

  // ---- Battle Analysis ----
  /**
   * Obtiene el historial de batallas del usuario
   */
  getBattleHistory: () =>
    apiCall('/api/tutorias/battle-analysis/history'),

  /**
   * Solicita análisis de una batalla
   */
  requestBattleAnalysis: (battleId: string) =>
    apiCall('/api/tutorias/battle-analysis/request', {
      method: 'POST',
      body: JSON.stringify({ battleId }),
    }),

  /**
   * Obtiene el análisis de una batalla específica
   */
  getBattleAnalysis: (battleId: string) =>
    apiCall(`/api/tutorias/battle-analysis/${battleId}`),

  // ---- Battle Logs (from Plugin) ----
  /**
   * Obtiene los battle logs del plugin (batallas PvP completas)
   */
  getBattleLogs: (params?: { discordId?: string; minecraftUuid?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.discordId) searchParams.set('discordId', params.discordId);
    if (params?.minecraftUuid) searchParams.set('minecraftUuid', params.minecraftUuid);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    return apiCall(`/api/tutorias/battle-log/list?${searchParams.toString()}`);
  },

  /**
   * Obtiene un battle log específico
   */
  getBattleLog: (battleId: string) =>
    apiCall(`/api/tutorias/battle-log/${battleId}`),

  /**
   * Solicita análisis AI de un battle log
   */
  analyzeBattleLog: (battleId: string, discordId?: string) =>
    apiCall('/api/tutorias/battle-log/analyze', {
      method: 'POST',
      body: JSON.stringify({ battleId, discordId }),
    }),

  // ---- AI Tutor ----
  /**
   * Hace una pregunta al AI Tutor
   */
  askAITutor: (question: string, includeTeamData: boolean = true) =>
    apiCall('/api/tutorias/ai-tutor/ask', {
      method: 'POST',
      body: JSON.stringify({ question, includeTeamData }),
    }),

  /**
   * Obtiene el historial de consultas al AI Tutor
   */
  getAITutorHistory: () =>
    apiCall('/api/tutorias/ai-tutor/history'),

  // ---- Breed Advisor ----
  /**
   * Solicita consejos de breeding
   */
  askBreedAdvisor: (request: {
    targetSpecies?: string;
    targetIVs?: Record<string, number>;
    targetNature?: string;
    targetAbility?: string;
    includeShinyAdvice: boolean;
  }) =>
    apiCall('/api/tutorias/breed-advisor/ask', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  // ---- PokéBox ----
  /**
   * Obtiene los Pokémon del PC con filtros
   */
  getPokeBox: (filters?: {
    discordId?: string;
    species?: string;
    shiny?: boolean;
    ivMin?: number;
    ivMax?: number;
    nature?: string;
    ability?: string;
    levelMin?: number;
    levelMax?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      });
    }
    return apiCall(`/api/tutorias/pokebox?${params.toString()}`);
  },

  /**
   * Obtiene los Pokémon duplicados
   */
  getDuplicates: (params?: { discordId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.discordId) {
      searchParams.set('discordId', params.discordId);
    }
    return apiCall(`/api/tutorias/pokebox/duplicates?${searchParams.toString()}`);
  },

  /**
   * Actualiza la protección de un Pokémon
   */
  updateProtection: (pokemonUuid: string, isProtected: boolean, discordId?: string) =>
    apiCall('/api/tutorias/pokebox/protect', {
      method: 'POST',
      body: JSON.stringify({ pokemonUuid, protected: isProtected, discordId }),
    }),

  // ---- Stat Planner ----
  /**
   * Guarda un plan de EVs
   */
  saveEVPlan: (data: {
    pokemonUuid: string;
    pokemonSpecies: string;
    evDistribution: Record<string, number>;
  }) =>
    apiCall('/api/tutorias/stat-planner/save', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Obtiene el plan de EVs de un Pokémon
   */
  getEVPlan: (pokemonUuid: string) =>
    apiCall(`/api/tutorias/stat-planner/${pokemonUuid}`),
};

// ============================================================================
// POKEMON SYNC API
// ============================================================================

export const pokemonSyncAPI = {
  /**
   * Smart remove duplicates - analyzes and removes duplicate Pokemon keeping the best
   * @param dryRun - If true, only returns what would be removed without actually removing
   */
  smartRemoveDuplicates: (data: { 
    discordId?: string; 
    playerUuid?: string; 
    dryRun?: boolean 
  }) =>
    apiCall('/api/pokemon-sync/smart-remove-duplicates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Bulk remove multiple Pokemon at once
   */
  bulkRemove: (data: {
    discordId?: string;
    playerUuid?: string;
    pokemonUuids: string[];
    reason?: string;
  }) =>
    apiCall('/api/pokemon-sync/bulk-remove', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get queue status for pending operations
   */
  getQueueStatus: () =>
    apiCall('/api/pokemon-sync/queue-status'),

  /**
   * Add a Pokemon to a player (admin only)
   */
  addPokemon: (data: {
    adminDiscordId: string;
    playerUuid: string;
    pokemon: {
      species: string;
      level?: number;
      shiny?: boolean;
      nature?: string;
      ability?: string;
      ivs?: Record<string, number>;
      evs?: Record<string, number>;
      moves?: string[];
      heldItem?: string;
    };
  }) =>
    apiCall('/api/pokemon-sync/add', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Remove a Pokemon from a player (admin only)
   */
  removePokemon: (data: {
    adminDiscordId: string;
    playerUuid: string;
    pokemonUuid: string;
    reason?: string;
  }) =>
    apiCall('/api/pokemon-sync/remove', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// GENERIC API CLIENT
// ============================================================================

/**
 * Cliente API genérico para uso directo
 */
export const apiClient = {
  get: <T = any>(endpoint: string) => apiCall<T>(endpoint),
  post: <T = any>(endpoint: string, data?: any) => 
    apiCall<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T = any>(endpoint: string, data?: any) =>
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  delete: <T = any>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'DELETE' }),
};

// Exportar la función base para uso directo si es necesario
export { apiCall };
