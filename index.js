#!/usr/bin/env node

/**
 * Cobblemon API - Pterodactyl Entry Point
 * Este archivo inicia el servidor Next.js en modo producción
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando Cobblemon API...');
console.log('📍 Directorio:', __dirname);
console.log('🌐 Puerto:', process.env.PORT || 3000);
console.log('');

// Verificar que existe el build de Next.js
const fs = require('fs');
const { execSync } = require('child_process');
const nextDir = path.join(__dirname, '.next');
const buildIdFile = path.join(nextDir, 'BUILD_ID');

// Check if we need to build
// We need to build if .next doesn't exist OR if BUILD_ID is missing
const needsBuild = !fs.existsSync(nextDir) || !fs.existsSync(buildIdFile);

if (needsBuild) {
    console.log('⚠️  No se encontró build válido de Next.js');
    console.log('🏗️  Ejecutando build automáticamente...\n');

    try {
        execSync('npm run build', {
            stdio: 'inherit',
            cwd: __dirname
        });
        console.log('\n✅ Build completado!\n');
    } catch (err) {
        console.error('\n❌ ERROR: Falló el build de Next.js');
        console.error('💡 Ejecuta manualmente: npm run build');
        console.error('Error:', err.message);
        process.exit(1);
    }
} else {
    console.log('✅ Build de Next.js encontrado\n');
}

// Iniciar Next.js en modo standalone
const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

// Check if standalone server exists, otherwise use next start
const useStandalone = fs.existsSync(standaloneServer);

const startCommand = useStandalone
    ? ['node', [standaloneServer]]
    : ['npx', ['next', 'start']];

if (useStandalone) {
    console.log('🚀 Usando servidor standalone\n');
} else {
    console.log('🚀 Usando next start\n');
}

const nextStart = spawn(startCommand[0], startCommand[1], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
    env: {
        ...process.env,
        PORT: process.env.PORT || '3000',
        NODE_ENV: 'production'
    }
});

nextStart.on('error', (err) => {
    console.error('❌ Error al iniciar servidor:', err);
    process.exit(1);
});

nextStart.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ El servidor se cerró con código: ${code}`);
        process.exit(code);
    }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n⚠️  Recibido SIGTERM, cerrando servidor...');
    nextStart.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('\n⚠️  Recibido SIGINT, cerrando servidor...');
    nextStart.kill('SIGINT');
});
