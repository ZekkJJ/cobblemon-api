import fs from 'fs';
import path from 'path';

// Data directory - in production on Vercel, you'd use Vercel Blob Storage
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

// Get file path for a collection
function getFilePath(collection: string): string {
    return path.join(DATA_DIR, `${collection}.json`);
}

// Read a collection
export function readCollection<T>(collection: string): T[] {
    ensureDataDir();
    const filePath = getFilePath(collection);

    if (!fs.existsSync(filePath)) {
        return [];
    }

    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error(`Error reading ${collection}:`, e);
        return [];
    }
}

// Write a collection
export function writeCollection<T>(collection: string, data: T[]): void {
    ensureDataDir();
    const filePath = getFilePath(collection);

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`Error writing ${collection}:`, e);
    }
}

// Find one item in a collection
export function findOne<T extends Record<string, any>>(
    collection: string,
    query: Partial<T>
): T | null {
    const data = readCollection<T>(collection);

    return data.find(item => {
        return Object.entries(query).every(([key, value]) => item[key] === value);
    }) || null;
}

// Find many items in a collection
export function findMany<T extends Record<string, any>>(
    collection: string,
    query: Partial<T> = {}
): T[] {
    const data = readCollection<T>(collection);

    if (Object.keys(query).length === 0) {
        return data;
    }

    return data.filter(item => {
        return Object.entries(query).every(([key, value]) => item[key] === value);
    });
}

// Insert one item
export function insertOne<T extends Record<string, any>>(
    collection: string,
    item: T
): T {
    const data = readCollection<T>(collection);
    const newItem = { ...item, _id: generateId(), createdAt: new Date().toISOString() };
    data.push(newItem);
    writeCollection(collection, data);
    return newItem;
}

// Update one item
export function updateOne<T extends Record<string, any>>(
    collection: string,
    query: Partial<T>,
    update: Partial<T>
): boolean {
    const data = readCollection<T>(collection);

    const index = data.findIndex(item => {
        return Object.entries(query).every(([key, value]) => item[key] === value);
    });

    if (index === -1) {
        return false;
    }

    data[index] = { ...data[index], ...update, updatedAt: new Date().toISOString() };
    writeCollection(collection, data);
    return true;
}

// Upsert (update or insert)
export function upsert<T extends Record<string, any>>(
    collection: string,
    query: Partial<T>,
    item: T
): T {
    const existing = findOne<T>(collection, query);

    if (existing) {
        updateOne(collection, query, item);
        return { ...existing, ...item };
    } else {
        return insertOne(collection, item);
    }
}

// Delete one item
export function deleteOne<T extends Record<string, any>>(
    collection: string,
    query: Partial<T>
): boolean {
    const data = readCollection<T>(collection);

    const index = data.findIndex(item => {
        return Object.entries(query).every(([key, value]) => item[key] === value);
    });

    if (index === -1) {
        return false;
    }

    data.splice(index, 1);
    writeCollection(collection, data);
    return true;
}

// Generate a simple ID
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Collections interface for type safety
export const db = {
    users: {
        find: (query: any = {}) => findMany('users', query),
        findOne: (query: any) => findOne('users', query),
        insertOne: (item: any) => insertOne('users', item),
        updateOne: (query: any, update: any) => updateOne('users', query, update),
        upsert: (query: any, item: any) => upsert('users', query, item),
    },
    starters: {
        find: (query: any = {}) => findMany('starters', query),
        findOne: (query: any) => findOne('starters', query),
        insertOne: (item: any) => insertOne('starters', item),
        updateOne: (query: any, update: any) => updateOne('starters', query, update),
        upsert: (query: any, item: any) => upsert('starters', query, item),
    },
    tournaments: {
        find: (query: any = {}) => findMany('tournaments', query),
        findOne: (query: any) => findOne('tournaments', query),
        insertOne: (item: any) => insertOne('tournaments', item),
        updateOne: (query: any, update: any) => updateOne('tournaments', query, update),
        deleteOne: (query: any) => deleteOne('tournaments', query),
    },
};
