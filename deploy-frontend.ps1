# Script para deployar el frontend a Vercel
# Cobblemon Los Pitufos - Frontend Deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT A VERCEL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la raíz correcta
if (-not (Test-Path "src/app")) {
    Write-Host "ERROR: No se encuentra src/app/" -ForegroundColor Red
    Write-Host "Asegúrate de haber ejecutado migrate-frontend.ps1 primero" -ForegroundColor Yellow
    exit 1
}

# Verificar que no existe la carpeta frontend/
if (Test-Path "frontend/src") {
    Write-Host "ADVERTENCIA: Aún existe la carpeta frontend/" -ForegroundColor Yellow
    Write-Host "Parece que no se ejecutó la migración correctamente" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "¿Deseas continuar de todas formas? (s/n)"
    if ($response -ne "s" -and $response -ne "S") {
        Write-Host "Deployment cancelado" -ForegroundColor Yellow
        exit 0
    }
}

# Paso 1: Limpiar builds anteriores
Write-Host ""
Write-Host "[1/6] Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "  ✓ .next eliminado" -ForegroundColor Green
}
if (Test-Path "out") {
    Remove-Item -Path "out" -Recurse -Force
    Write-Host "  ✓ out eliminado" -ForegroundColor Green
}

# Paso 2: Verificar variables de entorno
Write-Host ""
Write-Host "[2/6] Verificando variables de entorno..." -ForegroundColor Yellow
if (Test-Path ".env.production") {
    $envContent = Get-Content ".env.production" -Raw
    if ($envContent -match "NEXT_PUBLIC_API_URL") {
        Write-Host "  ✓ .env.production encontrado" -ForegroundColor Green
        Write-Host "  Variables configuradas:" -ForegroundColor Gray
        Get-Content ".env.production" | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    } else {
        Write-Host "  ⚠ .env.production no contiene NEXT_PUBLIC_API_URL" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ .env.production no encontrado" -ForegroundColor Yellow
}

# Paso 3: Instalar dependencias
Write-Host ""
Write-Host "[3/6] Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la instalación de dependencias" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Dependencias instaladas" -ForegroundColor Green

# Paso 4: Verificar build local
Write-Host ""
Write-Host "[4/6] Verificando build local..." -ForegroundColor Yellow
Write-Host "  (Esto puede tomar unos minutos...)" -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Falló el build" -ForegroundColor Red
    Write-Host "Revisa los errores arriba y corrígelos antes de deployar" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Errores comunes:" -ForegroundColor Yellow
    Write-Host "  - Errores de TypeScript: revisa los tipos" -ForegroundColor Gray
    Write-Host "  - Imports faltantes: verifica las rutas" -ForegroundColor Gray
    Write-Host "  - Variables de entorno: verifica .env.production" -ForegroundColor Gray
    exit 1
}
Write-Host "  ✓ Build exitoso" -ForegroundColor Green

# Paso 5: Verificar que Vercel CLI esté instalado
Write-Host ""
Write-Host "[5/6] Verificando Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "  - Vercel CLI no encontrado, instalando..." -ForegroundColor Gray
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Falló la instalación de Vercel CLI" -ForegroundColor Red
        exit 1
    }
}

# Verificar login
Write-Host "  - Verificando login..." -ForegroundColor Gray
vercel whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠ No estás logueado en Vercel" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "¿Deseas hacer login ahora? (s/n)"
    if ($response -eq "s" -or $response -eq "S") {
        vercel login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Falló el login" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Deployment cancelado - necesitas estar logueado" -ForegroundColor Yellow
        exit 0
    }
}
Write-Host "  ✓ Vercel CLI disponible y logueado" -ForegroundColor Green

# Paso 6: Deploy a producción
Write-Host ""
Write-Host "[6/6] Deploying a Vercel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE - Configuración en Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "  1. Ve a tu proyecto en vercel.com" -ForegroundColor White
Write-Host "  2. Settings > Environment Variables" -ForegroundColor White
Write-Host "  3. Agrega: NEXT_PUBLIC_API_URL = https://api.playadoradarp.xyz/port/25617" -ForegroundColor White
Write-Host "  4. Selecciona 'Production' environment" -ForegroundColor White
Write-Host ""
Write-Host "Presiona Enter para continuar con el deploy..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "Ejecutando: vercel --prod" -ForegroundColor Cyan
Write-Host ""

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  DEPLOYMENT EXITOSO ✓" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Tu frontend está ahora en producción!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Yellow
    Write-Host "  1. Verifica que el sitio carga correctamente" -ForegroundColor White
    Write-Host "  2. Prueba el gacha" -ForegroundColor White
    Write-Host "  3. Verifica la galería y pokédex" -ForegroundColor White
    Write-Host "  4. Prueba la autenticación con Discord" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  DEPLOYMENT FALLIDO ✗" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Revisa los errores arriba" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Verifica que estés en el proyecto correcto: vercel whoami" -ForegroundColor Gray
    Write-Host "  - Revisa los logs en vercel.com" -ForegroundColor Gray
    Write-Host "  - Verifica las variables de entorno en Vercel Dashboard" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
