import { db } from './json-db';

// 12 fake users for tournament testing
const FAKE_USERS = [
    { discordId: 'fake_001', discordUsername: 'AshKetchum', nickname: 'Ash', starterId: 25 },
    { discordId: 'fake_002', discordUsername: 'MistyWater', nickname: 'Misty', starterId: 7 },
    { discordId: 'fake_003', discordUsername: 'BrockRock', nickname: 'Brock', starterId: 74 },
    { discordId: 'fake_004', discordUsername: 'GaryOak', nickname: 'Gary', starterId: 133 },
    { discordId: 'fake_005', discordUsername: 'TeamRocketJesse', nickname: 'Jessie', starterId: 52 },
    { discordId: 'fake_006', discordUsername: 'TeamRocketJames', nickname: 'James', starterId: 109 },
    { discordId: 'fake_007', discordUsername: 'ProfOak', nickname: 'Prof. Oak', starterId: 143 },
    { discordId: 'fake_008', discordUsername: 'NurseJoy', nickname: 'Joy', starterId: 113 },
];

// Assign starters to fake users (using actual starter IDs)
const STARTER_ASSIGNMENTS = [1, 4, 7, 152, 155, 158, 252, 255];

export function seedFakeUsers() {
    const existingUsers = db.users.find({});
    const existingFakes = existingUsers.filter((u: any) => u.discordId?.startsWith('fake_'));

    if (existingFakes.length > 0) {
        console.log('Fake users already exist');
        return existingFakes;
    }

    const createdUsers = [];

    for (let i = 0; i < FAKE_USERS.length; i++) {
        const fake = FAKE_USERS[i];
        const starterId = STARTER_ASSIGNMENTS[i];

        const user = db.users.insertOne({
            discordId: fake.discordId,
            discordUsername: fake.discordUsername,
            discordAvatar: null,
            nickname: fake.nickname,
            starterId: starterId,
            starterIsShiny: i === 3, // Give Gary a shiny
            rolledAt: new Date().toISOString(),
            isAdmin: false,
            isFake: true,
        });

        // Also mark the starter as claimed
        db.starters.upsert(
            { pokemonId: starterId },
            {
                pokemonId: starterId,
                isClaimed: true,
                claimedBy: fake.discordId,
                claimedByNickname: fake.nickname,
                claimedAt: new Date().toISOString(),
                starterIsShiny: i === 3,
            }
        );

        createdUsers.push(user);
    }

    console.log(`Created ${createdUsers.length} fake users`);
    return createdUsers;
}

// Function to clear fake users
export function clearFakeUsers() {
    const users = db.users.find({});
    const realUsers = users.filter((u: any) => !u.isFake);

    // This is a bit hacky but works for our simple JSON db
    const { writeCollection } = require('./json-db');
    writeCollection('users', realUsers);

    // Also clear fake starters
    const starters = db.starters.find({});
    const realStarters = starters.filter((s: any) => {
        const user = users.find((u: any) => u.discordId === s.claimedBy);
        return !user?.isFake;
    });
    writeCollection('starters', realStarters);
}
