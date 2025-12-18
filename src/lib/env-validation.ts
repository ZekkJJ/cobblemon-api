import { authOptions } from '@/lib/auth';

// Validate required environment variables at startup
const REQUIRED_ENV_VARS = [
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
] as const;

const OPTIONAL_ENV_VARS = [
    'MONGODB_URI',
    'BLOB_READ_WRITE_TOKEN',
    'DISCORD_BOT_TOKEN',
] as const;

/**
 * Validates that all required environment variables are set
 * Throws error on missing required vars, logs warnings for optional
 */
export function validateEnvironmentVariables() {
    const missingRequired: string[] = [];
    const missingOptional: string[] = [];

    // Check required variables
    for (const varName of REQUIRED_ENV_VARS) {
        if (!process.env[varName]) {
            missingRequired.push(varName);
        }
    }

    // Check optional variables (just warn)
    for (const varName of OPTIONAL_ENV_VARS) {
        if (!process.env[varName]) {
            missingOptional.push(varName);
        }
    }

    // Throw error if any required vars are missing
    if (missingRequired.length > 0) {
        const errorMessage = `Missing required environment variables:\n${missingRequired.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env.local file.`;
        console.error('❌ ' + errorMessage);
        throw new Error(errorMessage);
    }

    // Log warnings for missing optional vars
    if (missingOptional.length > 0) {
        console.warn('⚠️  Missing optional environment variables:', missingOptional);
        console.warn('   Some features may not work correctly.');
    }

    console.log('✅ Environment variables validated successfully');
}

// Auto-validate on import (only in Node.js environment, not during build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
    try {
        validateEnvironmentVariables();
    } catch (error) {
        // In development, log error but don't crash  
        // In production builds this validation is skipped
        console.error(error);
    }
}
