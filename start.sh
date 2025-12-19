#!/bin/bash

echo "🚀 Iniciando servidor de producción..."
echo "📍 Puerto: ${PORT:-3000}"
echo "🌐 URL: $NEXTAUTH_URL"

# Iniciar Next.js en modo producción
npm start
