/**
 * API Client for Backend Communication
 * Centralizes all API calls to the Express backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    credentials: 'include', // Include cookies for auth
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  /**
   * Get Discord OAuth URL
   */
  getDiscordAuthUrl: () => `${API_BASE_URL}/api/auth/discord`,

  /**
   * Get current session
   */
  getSession: () => apiFetch<{ user: any }>('/api/auth/session'),

  /**
   * Logout
   */
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
};

// ============================================================================
// PLAYERS API
// ============================================================================

export const playersAPI = {
  /**
   * Get all players
   */
  getAll: () => apiFetch<{ players: any[] }>('/api/players'),

  /**
   * Get player by UUID
   */
  getByUuid: (uuid: string) => apiFetch<any>(`/api/players/${uuid}`),

  /**
   * Sync player data
   */
  sync: (data: { uuid: string; discordId?: string; minecraftUsername?: string }) =>
    apiFetch('/api/players/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get player by Discord ID
   */
  getByDiscordId: (discordId: string) =>
    apiFetch<any>('/api/players', { params: { discordId } }),
};

// ============================================================================
// GACHA API
// ============================================================================

export const gachaAPI = {
  /**
   * Roll gacha
   */
  roll: (data: { discordId: string; discordUsername: string; minecraftUsername: string }) =>
    apiFetch<any>('/api/gacha/roll', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Soul-driven gacha roll
   */
  soulDriven: (data: { discordId: string; discordUsername: string; minecraftUsername: string; preferences: string }) =>
    apiFetch<any>('/api/gacha/soul-driven', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get user gacha status
   */
  getStatus: (discordId: string) =>
    apiFetch<any>('/api/gacha/roll', { params: { discordId } }),
};

// ============================================================================
// SHOP API
// ============================================================================

export const shopAPI = {
  /**
   * Get shop stock
   */
  getStock: () => apiFetch<{ stock: any[] }>('/api/shop/stock'),

  /**
   * Get player balance
   */
  getBalance: (uuid: string) =>
    apiFetch<{ balance: number }>('/api/shop/balance', { params: { uuid } }),

  /**
   * Purchase item
   */
  purchase: (data: { uuid: string; itemId: string; quantity: number }) =>
    apiFetch<any>('/api/shop/purchase', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get purchase history
   */
  getPurchases: (uuid: string) =>
    apiFetch<{ purchases: any[] }>('/api/shop/purchases', { params: { uuid } }),

  /**
   * Claim purchased item
   */
  claim: (data: { uuid: string; purchaseId: string }) =>
    apiFetch<any>('/api/shop/claim', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// TOURNAMENTS API
// ============================================================================

export const tournamentsAPI = {
  /**
   * Get all tournaments
   */
  getAll: () => apiFetch<Tournament[]>('/api/tournaments'),

  /**
   * Get tournament by ID
   */
  getById: (id: string) => apiFetch<Tournament>(`/api/tournaments/${id}`),

  /**
   * Create tournament (admin)
   */
  create: (data: any) =>
    apiFetch<Tournament>('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update tournament (admin)
   */
  update: (id: string, data: any) =>
    apiFetch<Tournament>(`/api/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete tournament (admin)
   */
  delete: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/tournaments/${id}`, {
      method: 'DELETE',
    }),
};

// Tournament type for type safety
interface Tournament {
  _id: string;
  title: string;
  name: string; // Alias for title, used in some pages
  description?: string;
  startDate: string;
  maxParticipants: number;
  prizes?: string;
  status: 'upcoming' | 'active' | 'completed';
  participants: any[];
  winnerId?: string;
  createdBy: string;
  createdAt: Date;
  rounds?: any[]; // Tournament bracket rounds
  bracketType?: string; // single, double, etc.
}

// ============================================================================
// VERIFICATION API
// ============================================================================

export const verificationAPI = {
  /**
   * Generate verification code
   */
  generate: (data: { discordId: string; minecraftUsername: string }) =>
    apiFetch<{ code: string }>('/api/verification/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Verify code
   */
  verify: (data: { discordId: string; code: string }) =>
    apiFetch<{ verified: boolean }>('/api/verification/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Check verification status
   */
  checkStatus: (discordId: string) =>
    apiFetch<{ verified: boolean }>('/api/verification/status', { params: { discordId } }),
};

// ============================================================================
// LEVEL CAPS API
// ============================================================================

export const levelCapsAPI = {
  /**
   * Get effective level cap for player
   */
  getEffective: (uuid: string) =>
    apiFetch<{ levelCap: number }>('/api/level-caps/effective', { params: { uuid } }),

  /**
   * Get level cap version
   */
  getVersion: () => apiFetch<{ version: string }>('/api/level-caps/version'),

  /**
   * Get config (admin)
   */
  getConfig: () => apiFetch<any>('/api/admin/level-caps/config'),

  /**
   * Update config (admin)
   */
  updateConfig: (data: any) =>
    apiFetch<any>('/api/admin/level-caps/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Get history (admin)
   */
  getHistory: () => apiFetch<{ history: any[] }>('/api/admin/level-caps/history'),
};

// ============================================================================
// STARTERS API
// ============================================================================

export const startersAPI = {
  /**
   * Get all starters data
   */
  getAll: () => apiFetch<{ starters: any[]; stats?: any }>('/api/starters'),
};

// ============================================================================
// ADMIN API
// ============================================================================

export const adminAPI = {
  /**
   * Ban player
   */
  ban: (data: { uuid: string; reason: string }) =>
    apiFetch<any>('/api/admin/ban', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Reset database
   */
  resetDb: () =>
    apiFetch<any>('/api/admin/reset-db', {
      method: 'POST',
    }),
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthAPI = {
  /**
   * Check backend health
   */
  check: () => apiFetch<{ status: string; uptime: number }>('/health'),
};

export default {
  auth: authAPI,
  players: playersAPI,
  gacha: gachaAPI,
  shop: shopAPI,
  tournaments: tournamentsAPI,
  verification: verificationAPI,
  levelCaps: levelCapsAPI,
  starters: startersAPI,
  admin: adminAPI,
  health: healthAPI,
};
