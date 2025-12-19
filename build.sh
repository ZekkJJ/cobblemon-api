#!/bin/bash

echo "🚀 Auto-Deploy desde GitHub..."

# Ejecutar el script de deployment
node deploy.js

# Exit con el código de salida del script
exit $?
