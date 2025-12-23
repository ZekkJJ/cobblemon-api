# Script para iniciar Backend y Frontend en paralelo
Write-Host "🚀 Iniciando Cobblemon Los Pitufos - Desarrollo Local" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Debes ejecutar este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Configuración:" -ForegroundColor Yellow
Write-Host "  Backend:  http://localhost:4000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""

# Función para iniciar el backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    npm run dev
}

# Función para iniciar el frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    npm run dev
}

Write-Host "✅ Backend iniciado (Job ID: $($backendJob.Id))" -ForegroundColor Green
Write-Host "✅ Frontend iniciado (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Para ver los logs:" -ForegroundColor Cyan
Write-Host "  Backend:  Receive-Job -Id $($backendJob.Id) -Keep" -ForegroundColor White
Write-Host "  Frontend: Receive-Job -Id $($frontendJob.Id) -Keep" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Para detener los servidores:" -ForegroundColor Yellow
Write-Host "  Stop-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor White
Write-Host "  Remove-Job -Id $($backendJob.Id),$($frontendJob.Id)" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Esperando a que los servidores inicien..." -ForegroundColor Cyan
Write-Host ""

# Esperar 5 segundos
Start-Sleep -Seconds 5

# Mostrar logs iniciales
Write-Host "📋 Logs del Backend:" -ForegroundColor Yellow
Receive-Job -Id $backendJob.Id -Keep | Select-Object -Last 10
Write-Host ""

Write-Host "📋 Logs del Frontend:" -ForegroundColor Yellow
Receive-Job -Id $frontendJob.Id -Keep | Select-Object -Last 10
Write-Host ""

Write-Host "✨ Servidores iniciados!" -ForegroundColor Green
Write-Host "🌐 Abre http://localhost:3000 en tu navegador" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener los servidores..." -ForegroundColor Yellow

# Mantener el script corriendo y mostrar logs
try {
    while ($true) {
        Start-Sleep -Seconds 2
        
        # Verificar si los jobs siguen corriendo
        if ($backendJob.State -ne "Running") {
            Write-Host "⚠️  Backend detenido" -ForegroundColor Red
            break
        }
        if ($frontendJob.State -ne "Running") {
            Write-Host "⚠️  Frontend detenido" -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Deteniendo servidores..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id, $frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id, $frontendJob.Id -ErrorAction SilentlyContinue
    Write-Host "✅ Servidores detenidos" -ForegroundColor Green
}
