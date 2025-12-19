#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://github.com/ZekkJJ/cobblemon-api.git';
const APP_DIR = process.cwd();

console.log('🚀 Cobblemon API - Auto Deployment Script');
console.log('='.repeat(50));

// Helper function to run commands
function run(command, description) {
    console.log(`\n📦 ${description}...`);
    try {
        execSync(command, { stdio: 'inherit', cwd: APP_DIR });
        console.log(`✅ ${description} - Completado`);
        return true;
    } catch (error) {
        console.error(`❌ Error en: ${description}`);
        console.error(error.message);
        return false;
    }
}

// Check if git is installed
function checkGit() {
    try {
        execSync('git --version', { stdio: 'pipe' });
        return true;
    } catch {
        console.error('❌ Git no está instalado!');
        process.exit(1);
    }
}

// Check if it's a git repo
function isGitRepo() {
    return fs.existsSync(path.join(APP_DIR, '.git'));
}

// Main deployment flow
async function deploy() {
    console.log(`📍 Directorio: ${APP_DIR}`);
    console.log(`🔗 Repositorio: ${REPO_URL}\n`);

    // Step 1: Check git
    checkGit();

    // Step 2: Clone or Pull
    if (isGitRepo()) {
        console.log('📂 Repositorio ya existe, haciendo pull...');

        // Check remote URL
        try {
            const currentRemote = execSync('git config --get remote.origin.url', {
                encoding: 'utf-8',
                cwd: APP_DIR
            }).trim();

            if (currentRemote !== REPO_URL) {
                console.log(`⚠️  Remote actual: ${currentRemote}`);
                console.log(`🔄 Actualizando a: ${REPO_URL}`);
                run(`git remote set-url origin ${REPO_URL}`, 'Actualizar remote');
            }
        } catch (e) {
            console.log('⚠️  No se pudo verificar remote, continuando...');
        }

        // Pull latest changes
        if (!run('git fetch origin', 'Fetch cambios')) {
            console.error('❌ Error al hacer fetch');
            process.exit(1);
        }

        // Reset to origin/main (or master)
        const branches = ['main', 'master'];
        let pulled = false;

        for (const branch of branches) {
            try {
                execSync(`git reset --hard origin/${branch}`, {
                    stdio: 'inherit',
                    cwd: APP_DIR
                });
                console.log(`✅ Pull de origin/${branch} exitoso`);
                pulled = true;
                break;
            } catch (e) {
                console.log(`⚠️  Branch ${branch} no encontrado, probando siguiente...`);
            }
        }

        if (!pulled) {
            console.error('❌ No se pudo hacer pull de ningún branch');
            process.exit(1);
        }

    } else {
        console.log('📥 Inicializando repositorio (Pterodactyl mode)...');

        // Initialize git
        run('git init', 'Inicializar Git');

        // Add remote
        try {
            execSync(`git remote add origin ${REPO_URL}`, { stdio: 'pipe', cwd: APP_DIR });
        } catch (e) {
            // Remote already exists, update it
            run(`git remote set-url origin ${REPO_URL}`, 'Actualizar remote');
        }

        // Fetch
        if (!run('git fetch origin', 'Fetch repositorio')) {
            console.error('❌ Error al hacer fetch');
            process.exit(1);
        }

        // Checkout main or master
        const branches = ['main', 'master'];
        let checkedOut = false;

        for (const branch of branches) {
            try {
                execSync(`git checkout -B ${branch} origin/${branch}`, {
                    stdio: 'inherit',
                    cwd: APP_DIR
                });
                console.log(`✅ Checkout de ${branch} exitoso`);
                checkedOut = true;
                break;
            } catch (e) {
                console.log(`⚠️  Branch ${branch} no encontrado...`);
            }
        }

        if (!checkedOut) {
            console.error('❌ No se pudo hacer checkout');
            process.exit(1);
        }
    }

    // Step 3: Check if package.json exists
    if (!fs.existsSync(path.join(APP_DIR, 'package.json'))) {
        console.error('❌ No se encontró package.json en el repositorio!');
        process.exit(1);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📦 Instalando dependencias...');
    console.log('='.repeat(50));

    // Step 4: Install dependencies
    if (!run('npm ci', 'Instalar dependencias (production)')) {
        console.log('⚠️  npm ci falló, intentando npm install...');
        if (!run('npm install', 'Instalar dependencias')) {
            console.error('❌ Error al instalar dependencias');
            process.exit(1);
        }
    }

    // Step 5: Build
    console.log('\n' + '='.repeat(50));
    console.log('🏗️  Building aplicación...');
    console.log('='.repeat(50));

    if (!run('npm run build', 'Build de producción')) {
        console.error('❌ Error al hacer build');
        process.exit(1);
    }

    // Step 6: Success!
    console.log('\n' + '='.repeat(50));
    console.log('✅ DEPLOYMENT EXITOSO!');
    console.log('='.repeat(50));
    console.log('\n🎉 La aplicación está lista para iniciar');
    console.log('\n📝 Siguiente paso:');
    console.log('   npm start\n');
}

// Run deployment
deploy().catch(error => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
});
