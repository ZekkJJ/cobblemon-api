# Script para migrar el nuevo frontend a la raíz del proyecto
# Cobblemon Los Pitufos - Frontend Migration
# Este script reemplaza el frontend viejo (src/) con el nuevo (frontend/)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIGRACION DE FRONTEND A RAIZ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe la carpeta frontend/
if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: No se encuentra la carpeta frontend/" -ForegroundColor Red
    Write-Host "Asegúrate de estar en la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe frontend/src/app
if (-not (Test-Path "frontend/src/app")) {
    Write-Host "ERROR: No se encuentra frontend/src/app/" -ForegroundColor Red
    Write-Host "La carpeta frontend no parece contener el nuevo frontend" -ForegroundColor Yellow
    exit 1
}

# Paso 1: Crear carpeta para el frontend antiguo
Write-Host "[1/7] Creando carpeta old-frontend..." -ForegroundColor Yellow
if (Test-Path "old-frontend") {
    Write-Host "  - Carpeta old-frontend ya existe, eliminando..." -ForegroundColor Gray
    Remove-Item -Path "old-frontend" -Recurse -Force
}
New-Item -ItemType Directory -Path "old-frontend" | Out-Null
Write-Host "  ✓ Carpeta creada" -ForegroundColor Green

# Paso 2: Mover archivos del frontend antiguo a old-frontend/
Write-Host ""
Write-Host "[2/7] Moviendo frontend antiguo a old-frontend/..." -ForegroundColor Yellow

$oldFrontendItems = @(
    "src",
    "public",
    ".next",
    "next.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    "tsconfig.json",
    "next-env.d.ts",
    "package.json",
    "package-lock.json"
)

$movedCount = 0
foreach ($item in $oldFrontendItems) {
    if (Test-Path $item) {
        Write-Host "  - Moviendo $item..." -ForegroundColor Gray
        Move-Item -Path $item -Destination "old-frontend/" -Force
        $movedCount++
    }
}
Write-Host "  ✓ $movedCount archivos/carpetas movidos" -ForegroundColor Green

# Paso 3: Mover contenido de frontend/ a la raíz
Write-Host ""
Write-Host "[3/7] Moviendo nuevo frontend a la raíz..." -ForegroundColor Yellow

$newFrontendItems = Get-ChildItem -Path "frontend" -Force | Where-Object { 
    $_.Name -ne "node_modules" -and 
    $_.Name -ne ".next" -and
    $_.Name -ne ".git"
}

$movedNewCount = 0
foreach ($item in $newFrontendItems) {
    Write-Host "  - Moviendo $($item.Name)..." -ForegroundColor Gray
    
    # Si el archivo ya existe en la raíz, eliminarlo primero
    $destPath = Join-Path "." $item.Name
    if (Test-Path $destPath) {
        Remove-Item -Path $destPath -Recurse -Force
    }
    
    Move-Item -Path $item.FullName -Destination "." -Force
    $movedNewCount++
}
Write-Host "  ✓ $movedNewCount archivos/carpetas movidos a la raíz" -ForegroundColor Green

# Paso 4: Eliminar carpeta frontend vacía
Write-Host ""
Write-Host "[4/7] Limpiando carpeta frontend..." -ForegroundColor Yellow
if (Test-Path "frontend") {
    # Verificar si está vacía o solo tiene node_modules/.next
    $remainingItems = Get-ChildItem -Path "frontend" -Force | Where-Object { 
        $_.Name -ne "node_modules" -and $_.Name -ne ".next" 
    }
    
    if ($remainingItems.Count -eq 0) {
        Remove-Item -Path "frontend" -Recurse -Force
        Write-Host "  ✓ Carpeta frontend eliminada" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Carpeta frontend no está vacía, no se eliminó" -ForegroundColor Yellow
        Write-Host "  Archivos restantes:" -ForegroundColor Gray
        $remainingItems | ForEach-Object { Write-Host "    - $($_.Name)" -ForegroundColor Gray }
    }
}

# Paso 5: Actualizar .gitignore
Write-Host ""
Write-Host "[5/7] Actualizando .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env.local
.env.vercel

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Old frontend backup
old-frontend/
frontend/

# Backend
backend/node_modules/
backend/.env
backend/dist/

# Minecraft plugins
minecraft-plugin/
minecraft-plugin-v2/

# Data
data/
pokeball_models/

# Kiro
.kiro/
.zencoder/
.zenflow/
"@

Set-Content -Path ".gitignore" -Value $gitignoreContent
Write-Host "  ✓ .gitignore actualizado" -ForegroundColor Green

# Paso 6: Crear/actualizar archivo de variables de entorno para producción
Write-Host ""
Write-Host "[6/7] Configurando variables de entorno..." -ForegroundColor Yellow

# .env.production
$envProduction = @"
# Frontend - Production Environment Variables
NEXT_PUBLIC_API_URL=https://api.playadoradarp.xyz/port/25617
"@
Set-Content -Path ".env.production" -Value $envProduction
Write-Host "  ✓ .env.production creado" -ForegroundColor Green

# .env.local (para desarrollo local)
if (-not (Test-Path ".env.local")) {
    $envLocal = @"
# Frontend - Local Development Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:4000
"@
    Set-Content -Path ".env.local" -Value $envLocal
    Write-Host "  ✓ .env.local creado" -ForegroundColor Green
}

# Paso 7: Verificar estructura
Write-Host ""
Write-Host "[7/7] Verificando estructura..." -ForegroundColor Yellow

$requiredItems = @(
    "src/app",
    "src/components",
    "src/lib",
    "public",
    "package.json",
    "next.config.js",
    "tailwind.config.ts"
)

$allGood = $true
foreach ($item in $requiredItems) {
    if (Test-Path $item) {
        Write-Host "  ✓ $item" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $item NO ENCONTRADO" -ForegroundColor Red
        $allGood = $false
    }
}

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  MIGRACION COMPLETADA EXITOSAMENTE" -ForegroundColor Green
} else {
    Write-Host "  MIGRACION COMPLETADA CON ADVERTENCIAS" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Estructura actual:" -ForegroundColor Cyan
Write-Host "  ✓ Nuevo frontend en raíz (src/, public/, etc.)" -ForegroundColor Green
Write-Host "  ✓ Frontend antiguo respaldado en old-frontend/" -ForegroundColor Green
Write-Host ""
Write-Host "Siguientes pasos:" -ForegroundColor Yellow
Write-Host "  1. Instala dependencias: npm install" -ForegroundColor White
Write-Host "  2. Prueba el build: npm run build" -ForegroundColor White
Write-Host "  3. Prueba localmente: npm run dev" -ForegroundColor White
Write-Host "  4. Deploy a Vercel: vercel --prod" -ForegroundColor White
Write-Host ""
Write-Host "Notas:" -ForegroundColor Gray
Write-Host "  - El frontend antiguo está en old-frontend/" -ForegroundColor Gray
Write-Host "  - Variables de entorno configuradas en .env.production" -ForegroundColor Gray
Write-Host "  - Para desarrollo local usa .env.local" -ForegroundColor Gray
Write-Host ""
