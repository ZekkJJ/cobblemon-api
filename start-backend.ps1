# Script para iniciar el backend en desarrollo local
Write-Host "🚀 Iniciando Backend - Cobblemon Los Pitufos" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: Debes ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Ir a la carpeta del backend
Set-Location backend

# Verificar que existe .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Advertencia: No se encontró .env, copiando desde .env.example" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Archivo .env creado. Por favor configura las variables necesarias." -ForegroundColor Green
    Write-Host ""
}

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Iniciar el servidor
Write-Host "🔥 Iniciando servidor backend en http://localhost:4000" -ForegroundColor Green
Write-Host "📝 Logs:" -ForegroundColor Cyan
Write-Host ""

npm run dev
