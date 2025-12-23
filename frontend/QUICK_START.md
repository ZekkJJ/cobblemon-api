# 🚀 Quick Start - Frontend Cobblemon Los Pitufos

## ✅ Estado: TASKS 1-25 COMPLETADAS

El frontend está completamente funcional y listo para desarrollo local.

---

## 📦 Instalación Rápida

```bash
# 1. Navegar a la carpeta frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Verificar que .env.local existe
# Debe contener: NEXT_PUBLIC_API_URL=http://localhost:4000

# 4. Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en: **http://localhost:3000**

---

## ⚙️ Requisitos Previos

### Backend Debe Estar Corriendo
```bash
cd backend
npm run dev
```
El backend debe estar en: **http://localhost:4000**

### MongoDB Debe Estar Conectado
Verifica que el backend tenga conexión a MongoDB.

---

## 🧪 Pruebas Rápidas

### 1. Página Principal (Gacha)
```
URL: http://localhost:3000
```
- ✅ Ver pantalla de login
- ✅ Probar autenticación por username
- ✅ Ver máquina gacha
- ✅ Hacer tirada clásica o Soul Driven
- ✅ Ver resultado con StarterCard
- ✅ Probar verificación de Minecraft

### 2. Página de Tienda
```
URL: http://localhost:3000/tienda
```
- ✅ Ver catálogo de Pokéballs
- ✅ Ver balance de CobbleDollars
- ✅ Buscar y filtrar
- ✅ Comprar Pokéballs

### 3. Navegación
- ✅ Usar navbar para navegar
- ✅ Ver ServerIndicator
- ✅ Toggle de sonido
- ✅ Logout

---

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Página Gacha ✅
│   │   ├── layout.tsx            # Layout principal ✅
│   │   ├── globals.css           # Estilos globales ✅
│   │   ├── auth/callback/        # OAuth callback ✅
│   │   └── tienda/               # Página tienda ✅
│   ├── components/
│   │   ├── Navbar.tsx            # Navegación ✅
│   │   ├── ServerIndicator.tsx   # Estado servidor ✅
│   │   ├── StarterCard.tsx       # Tarjeta Pokémon ✅
│   │   ├── SoulDrivenQuestionnaire.tsx ✅
│   │   ├── MusicPlayer.tsx       # Reproductor ✅
│   │   └── Providers.tsx         # Context ✅
│   └── lib/
│       ├── api-client.ts         # Cliente API ✅
│       ├── sounds.ts             # Sistema sonidos ✅
│       └── types/                # TypeScript types ✅
├── public/
│   ├── pokeballs/                # 33 sprites ✅
│   ├── background-music.mp3      # Música ✅
│   └── sounds/                   # Efectos (agregar) ⚠️
└── .env.local                    # Variables entorno ✅
```

---

## ⚠️ Notas Importantes

### Archivos de Sonido Faltantes
Agregar en `public/sounds/`:
- click.mp3
- confirm.mp3
- cancel.mp3
- roll.mp3
- success.mp3
- error.mp3

Descargar de: https://freesound.org/ o https://mixkit.co/

### Variables de Entorno
`.env.local` debe contener:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 🐛 Troubleshooting

### Error: Cannot connect to backend
- ✅ Verifica que backend esté en puerto 4000
- ✅ Revisa consola del backend para errores
- ✅ Verifica MongoDB conectado

### Error: Module not found
```bash
cd frontend
npm install
```

### Estilos no se aplican
```bash
# Eliminar cache y reiniciar
rm -rf .next
npm run dev
```

### Puerto 3000 ocupado
```bash
# Usar otro puerto
PORT=3001 npm run dev
```

---

## 📝 Scripts Disponibles

```bash
npm run dev      # Desarrollo (puerto 3000)
npm run build    # Build producción
npm run start    # Servidor producción
npm run lint     # ESLint
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación
- Discord OAuth
- Username/Nickname
- LocalStorage persistence

### ✅ Sistema Gacha
- Modo Clásico (aleatorio)
- Modo Soul Driven (cuestionario)
- Animaciones de tirada
- Reproducción de cries
- Contador de starters

### ✅ Tienda
- Catálogo de Pokéballs
- Balance de CobbleDollars
- Búsqueda y filtros
- Compra con validación
- Indicadores de stock

### ✅ Componentes Globales
- Navbar responsive
- ServerIndicator en tiempo real
- MusicPlayer con visualizador
- Sistema de sonidos

### ✅ Diseño
- Tailwind CSS personalizado
- Colores Pokémon
- Animaciones custom
- Glass morphism
- Responsive design

---

## 📊 Progreso

**Tasks Completadas**: 25/25 (100%)
**Páginas**: 3/3 principales
**Componentes**: 6/6 principales
**API Client**: 8/8 módulos

---

## 🎉 ¡Listo para Desarrollo!

El frontend está completamente funcional. Ejecuta `npm run dev` y comienza a probar.

Para continuar con las siguientes tareas (26-66), consulta:
- `TASKS_1-25_COMPLETE.md` - Resumen detallado
- `.kiro/specs/frontend-rebuild/tasks.md` - Lista completa
- `SETUP_INSTRUCTIONS.md` - Instrucciones completas

---

**Última Actualización**: 21 de Diciembre, 2025
**Estado**: ✅ LISTO PARA DESARROLLO
