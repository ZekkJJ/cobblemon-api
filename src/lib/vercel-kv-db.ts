import { put, list, del } from '@vercel/blob';

// Blob file names for our data collections
const BLOBS = {
    USERS: 'cobblemon-users.json',
    STARTERS: 'cobblemon-starters.json',
    TOURNAMENTS: 'cobblemon-tournaments.json',
};

// Type definitions
interface User {
    discordId: string;
    discordUsername: string;
    nickname: string;
    starterId: number | null;
    starterIsShiny: boolean;
    rolledAt: string | null;
    isAdmin: boolean;
    minecraftUuid?: string;
    minecraftUsername?: string;
    verified?: boolean;
    verificationCode?: string;
    verifiedAt?: string;
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface StarterClaim {
    pokemonId: number;
    name: string;
    isClaimed: boolean;
    claimedBy: string;
    claimedByNickname: string;
    claimedAt: string;
    starterIsShiny: boolean;
    _id?: string;
    createdAt?: string;
}

// Cache to reduce blob reads
// WARNING: This is an in-memory cache per lambda instance
// In production with multiple Vercel Functions instances, each has its own cache
// This can lead to inconsistent reads across instances for up to CACHE_TTL seconds
const cache: { [key: string]: { data: any[]; timestamp: number } } = {};
const CACHE_TTL = 1000; // 1 second (reduced from 5s to minimize inconsistency)

// Get data from blob with caching
async function getData<T>(blobName: string): Promise<T[]> {
    // Check cache first
    const cached = cache[blobName];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T[];
    }

    try {
        // List blobs to find ours
        const { blobs } = await list({ prefix: blobName });

        if (blobs.length === 0) {
            return [];
        }

        // Get the latest blob
        const latestBlob = blobs[blobs.length - 1];
        const response = await fetch(latestBlob.url);
        const data = await response.json();

        // Update cache
        cache[blobName] = { data, timestamp: Date.now() };

        return data as T[];
    } catch (error) {
        console.error(`Blob getData error for ${blobName}:`, error);
        return [];
    }
}

// Save data to blob
async function setData<T>(blobName: string, data: T[]): Promise<void> {
    try {
        // Delete old blobs first
        const { blobs } = await list({ prefix: blobName });
        for (const blob of blobs) {
            try {
                await del(blob.url);
            } catch (e) {
                // Ignore delete errors
            }
        }

        // Create new blob
        await put(blobName, JSON.stringify(data), {
            access: 'public',
            contentType: 'application/json',
        });

        // Update cache
        cache[blobName] = { data, timestamp: Date.now() };
    } catch (error) {
        console.error(`Blob setData error for ${blobName}:`, error);
    }
}

// Find one item
async function findOne<T extends Record<string, any>>(
    blobName: string,
    query: Partial<T>
): Promise<T | null> {
    const data = await getData<T>(blobName);
    return data.find(item => {
        return Object.entries(query).every(([k, v]) => item[k] === v);
    }) || null;
}

// Find many items
async function findMany<T extends Record<string, any>>(
    blobName: string,
    query: Partial<T> = {}
): Promise<T[]> {
    const data = await getData<T>(blobName);
    if (Object.keys(query).length === 0) {
        return data;
    }
    return data.filter(item => {
        return Object.entries(query).every(([k, v]) => item[k] === v);
    });
}

// Insert one item
async function insertOne<T extends Record<string, any>>(
    blobName: string,
    item: T
): Promise<T> {
    const data = await getData<T>(blobName);
    const newItem = {
        ...item,
        _id: generateId(),
        createdAt: new Date().toISOString(),
    };
    data.push(newItem);
    await setData(blobName, data);
    return newItem;
}

// Update one item
async function updateOne<T extends Record<string, any>>(
    blobName: string,
    query: Partial<T>,
    update: Partial<T>
): Promise<boolean> {
    const data = await getData<T>(blobName);
    const index = data.findIndex(item => {
        return Object.entries(query).every(([k, v]) => item[k] === v);
    });

    if (index === -1) {
        return false;
    }

    data[index] = {
        ...data[index],
        ...update,
        updatedAt: new Date().toISOString(),
    };
    await setData(blobName, data);
    return true;
}

// Upsert (update or insert)
async function upsert<T extends Record<string, any>>(
    blobName: string,
    query: Partial<T>,
    item: T
): Promise<T> {
    const existing = await findOne<T>(blobName, query);

    if (existing) {
        await updateOne(blobName, query, item);
        return { ...existing, ...item };
    } else {
        return insertOne(blobName, item);
    }
}

// Delete one item
async function deleteOne<T extends Record<string, any>>(
    blobName: string,
    query: Partial<T>
): Promise<boolean> {
    const data = await getData<T>(blobName);
    const index = data.findIndex(item => {
        return Object.entries(query).every(([k, v]) => item[k] === v);
    });

    if (index === -1) {
        return false;
    }

    data.splice(index, 1);
    await setData(blobName, data);
    return true;
}

// Generate a simple ID
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Collections interface (matching previous interface)
export const db = {
    users: {
        find: (query: Partial<User> = {}) => findMany<User>(BLOBS.USERS, query),
        findOne: (query: Partial<User>) => findOne<User>(BLOBS.USERS, query),
        insertOne: (item: Omit<User, '_id' | 'createdAt'>) => insertOne(BLOBS.USERS, item as any),
        updateOne: (query: Partial<User>, update: Partial<User>) => updateOne(BLOBS.USERS, query, update),
        upsert: (query: Partial<User>, item: Omit<User, '_id' | 'createdAt'>) => upsert(BLOBS.USERS, query, item as any),
    },
    starters: {
        find: (query: Partial<StarterClaim> = {}) => findMany<StarterClaim>(BLOBS.STARTERS, query),
        findOne: (query: Partial<StarterClaim>) => findOne<StarterClaim>(BLOBS.STARTERS, query),
        insertOne: (item: Omit<StarterClaim, '_id' | 'createdAt'>) => insertOne(BLOBS.STARTERS, item as any),
        updateOne: (query: Partial<StarterClaim>, update: Partial<StarterClaim>) => updateOne(BLOBS.STARTERS, query, update),
        upsert: (query: Partial<StarterClaim>, item: Omit<StarterClaim, '_id' | 'createdAt'>) => upsert(BLOBS.STARTERS, query, item as any),
    },
    tournaments: {
        find: (query: any = {}) => findMany(BLOBS.TOURNAMENTS, query),
        findOne: (query: any) => findOne(BLOBS.TOURNAMENTS, query),
        insertOne: (item: any) => insertOne(BLOBS.TOURNAMENTS, item),
        updateOne: (query: any, update: any) => updateOne(BLOBS.TOURNAMENTS, query, update),
        deleteOne: (query: any) => deleteOne(BLOBS.TOURNAMENTS, query),
    },
};
