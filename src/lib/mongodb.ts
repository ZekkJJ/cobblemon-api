import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'cobblemon';

if (!MONGODB_URI) {
    throw new Error('Please define MONGODB_URI in .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

// Collections
export async function getUsersCollection() {
    const { db } = await connectToDatabase();
    return db.collection('users');
}

export async function getStartersCollection() {
    const { db } = await connectToDatabase();
    return db.collection('starters');
}

export async function getTournamentsCollection() {
    const { db } = await connectToDatabase();
    return db.collection('tournaments');
}

export async function getLevelCapsCollection() {
    const { db } = await connectToDatabase();
    return db.collection('level_caps');
}

export async function getShopStockCollection() {
    const { db } = await connectToDatabase();
    return db.collection('shop_stock');
}

export async function getShopPurchasesCollection() {
    const { db } = await connectToDatabase();
    return db.collection('shop_purchases');
}

// Simple wrapper for compatibility
export const db = {
    users: {
        find: async (query: any = {}) => {
            const col = await getUsersCollection();
            return await col.find(query).toArray();
        },
        findOne: async (query: any) => {
            const col = await getUsersCollection();
            return await col.findOne(query);
        },
        insertOne: async (doc: any) => {
            const col = await getUsersCollection();
            const result = await col.insertOne({ ...doc, createdAt: new Date() });
            return { ...doc, _id: result.insertedId };
        },
        updateOne: async (query: any, update: any) => {
            const col = await getUsersCollection();
            await col.updateOne(query, { $set: { ...update, updatedAt: new Date() } });
            return true;
        },
        upsert: async (query: any, doc: any) => {
            const col = await getUsersCollection();
            await col.updateOne(
                query,
                { $set: { ...doc, updatedAt: new Date() } },
                { upsert: true }
            );
            return doc;
        },
        deleteOne: async (query: any) => {
            const col = await getUsersCollection();
            const result = await col.deleteOne(query);
            return result.deletedCount;
        },
        deleteMany: async (query: any) => {
            const col = await getUsersCollection();
            const result = await col.deleteMany(query);
            return result.deletedCount;
        }
    },
    starters: {
        find: async (query: any = {}) => {
            const col = await getStartersCollection();
            return await col.find(query).toArray();
        },
        findOne: async (query: any) => {
            const col = await getStartersCollection();
            return await col.findOne(query);
        },
        insertOne: async (doc: any) => {
            const col = await getStartersCollection();
            const result = await col.insertOne({ ...doc, createdAt: new Date() });
            return { ...doc, _id: result.insertedId };
        },
        updateOne: async (query: any, update: any) => {
            const col = await getStartersCollection();
            await col.updateOne(query, { $set: { ...update, updatedAt: new Date() } });
            return true;
        },
        upsert: async (query: any, doc: any) => {
            const col = await getStartersCollection();
            await col.updateOne(
                query,
                { $set: { ...doc, updatedAt: new Date() } },
                { upsert: true }
            );
            return doc;
        },
        deleteMany: async (query: any) => {
            const col = await getStartersCollection();
            const result = await col.deleteMany(query);
            return result.deletedCount;
        }
    },
    tournaments: {
        find: async (query: any = {}) => {
            const col = await getTournamentsCollection();
            return await col.find(query).toArray();
        },
        findOne: async (query: any) => {
            const col = await getTournamentsCollection();
            return await col.findOne(query);
        },
        insertOne: async (doc: any) => {
            const col = await getTournamentsCollection();
            const result = await col.insertOne({ ...doc, createdAt: new Date() });
            return { ...doc, _id: result.insertedId };
        },
        updateOne: async (query: any, update: any) => {
            const col = await getTournamentsCollection();
            await col.updateOne(query, { $set: { ...update, updatedAt: new Date() } });
            return true;
        },
        deleteOne: async (query: any) => {
            const col = await getTournamentsCollection();
            await col.deleteOne(query);
            return true;
        },
        deleteMany: async (query: any) => {
            const col = await getTournamentsCollection();
            const result = await col.deleteMany(query);
            return result.deletedCount;
        }
    },
    level_caps: {
        find: async (query: any = {}) => {
            const col = await getLevelCapsCollection();
            return await col.find(query).toArray();
        },
        findOne: async (query: any) => {
            const col = await getLevelCapsCollection();
            return await col.findOne(query);
        },
        insertOne: async (doc: any) => {
            const col = await getLevelCapsCollection();
            const result = await col.insertOne({ ...doc, createdAt: new Date() });
            return { ...doc, _id: result.insertedId };
        },
        updateOne: async (query: any, update: any, options?: any) => {
            const col = await getLevelCapsCollection();
            await col.updateOne(query, update, options || {});
            return true;
        },
        upsert: async (query: any, doc: any) => {
            const col = await getLevelCapsCollection();
            await col.updateOne(
                query,
                { $set: { ...doc, updatedAt: new Date() } },
                { upsert: true }
            );
            return doc;
        }
    },
    shop_stock: {
        find: async (query: any = {}) => {
            const col = await getShopStockCollection();
            return await col.find(query).toArray();
        },
        findOne: async (query: any) => {
            const col = await getShopStockCollection();
            return await col.findOne(query);
        },
        updateOne: async (query: any, update: any) => {
            const col = await getShopStockCollection();
            await col.updateOne(query, { $set: update });
            return true;
        },
        upsert: async (query: any, doc: any) => {
            const col = await getShopStockCollection();
            await col.updateOne(
                query,
                { $set: doc },
                { upsert: true }
            );
            return doc;
        }
    },
    shop_purchases: {
        find: async (query: any = {}) => {
            const col = await getShopPurchasesCollection();
            return await col.find(query).toArray();
        },
        findOne: async (query: any) => {
            const col = await getShopPurchasesCollection();
            return await col.findOne(query);
        },
        updateOne: async (query: any, update: any) => {
            const col = await getShopPurchasesCollection();
            await col.updateOne(query, { $set: update });
            return true;
        },
        upsert: async (query: any, doc: any) => {
            const col = await getShopPurchasesCollection();
            await col.updateOne(
                query,
                { $set: doc },
                { upsert: true }
            );
            return doc;
        }
    }
};
