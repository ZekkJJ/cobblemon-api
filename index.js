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

if (!fs.existsSync(nextDir)) {
    console.log('⚠️  No se encontró build de Next.js (.next)');
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
        process.exit(1);
    }
}

// Iniciar Next.js directamente
const nextStart = spawn('npx', ['next', 'start'], {
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
