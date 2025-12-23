import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mongodb';

// POST: Verify code from Minecraft plugin (/verify command)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { minecraftUuid, code } = body;

        console.log('[VERIFICATION VERIFY] Received:', { minecraftUuid, code });

        if (!minecraftUuid || !code) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find user with matching UUID and code
        const users = await db.users.find({});
        const user = users.find((u: any) => 
            u.minecraftUuid === minecraftUuid && 
            u.verificationCode === code
        );

        if (!user) {
            console.log('[VERIFICATION VERIFY] Invalid code or UUID');
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid verification code' 
            });
        }

        // Mark as verified (keep Discord link if exists)
        await db.users.updateOne(
            { minecraftUuid } as any,
            {
                verified: true,
                verifiedAt: new Date().toISOString(),
                lastVerificationCode: code,
                verificationCode: undefined
            } as any
        );

        console.log('[VERIFICATION VERIFY] Success for', (user as any).minecraftUsername);

        return NextResponse.json({ 
            success: true,
            message: 'Verification successful'
        });
    } catch (error) {
        console.error('[VERIFICATION VERIFY] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error verifying code' },
            { status: 500 }
        );
    }
}
