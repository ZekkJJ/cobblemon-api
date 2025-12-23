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

// Exportar la función base para uso directo si es necesario
export { apiCall };
