# Script para iniciar el frontend en desarrollo local
Write-Host "🚀 Iniciando Frontend - Cobblemon Los Pitufos" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Error: Debes ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Ir a la carpeta del frontend
Set-Location frontend

# Verificar que existe .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Advertencia: No se encontró .env.local, creándolo..." -ForegroundColor Yellow
    "NEXT_PUBLIC_API_URL=http://localhost:4000" | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ Archivo .env.local creado." -ForegroundColor Green
    Write-Host ""
}

# Verificar que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Iniciar el servidor
Write-Host "🔥 Iniciando servidor frontend en http://localhost:3000" -ForegroundColor Green
Write-Host "📝 Logs:" -ForegroundColor Cyan
Write-Host ""

npm run dev
