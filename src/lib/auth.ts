import { AuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { db } from '@/lib/vercel-kv-db';

// Validate required environment variables
if (!process.env.DISCORD_CLIENT_ID) {
    throw new Error('DISCORD_CLIENT_ID environment variable is required');
}
if (!process.env.DISCORD_CLIENT_SECRET) {
    throw new Error('DISCORD_CLIENT_SECRET environment variable is required');
}

export const authOptions: AuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: 'identify guilds',
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'discord') {
                try {
                    const existingUser = await db.users.findOne({ discordId: account.providerAccountId });

                    if (!existingUser) {
                        await db.users.insertOne({
                            discordId: account.providerAccountId,
                            discordUsername: user.name || 'Unknown',
                            nickname: '',
                            starterId: null,
                            starterIsShiny: false,
                            rolledAt: null,
                            isAdmin: false,
                        });
                    }

                    return true;
                } catch (error) {
                    console.error('Error during sign in:', error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).discordId = token.sub;

                try {
                    const userData = await db.users.findOne({ discordId: token.sub });

                    if (userData) {
                        (session.user as any).nickname = userData.nickname;
                        (session.user as any).starterId = userData.starterId;
                        (session.user as any).starterIsShiny = userData.starterIsShiny;
                        (session.user as any).isAdmin = userData.isAdmin;
                        (session.user as any).hasRolled = userData.starterId !== null;
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
            return session;
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
    },
    pages: {
        signIn: '/',
        error: '/',
    },
    session: {
        strategy: 'jwt',
    },
};
