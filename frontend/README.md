# Cobblemon Los Pitufos - Frontend

Frontend de la plataforma web Cobblemon Los Pitufos. Aplicación Next.js 14 que consume el backend API.

## Requisitos

- Node.js 18+ 
- npm o yarn
- Backend corriendo en `http://localhost:4000`

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Editar .env.local si es necesario
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:3000
```

## Build para Producción

```bash
# Crear build optimizado
npm run build

# Iniciar servidor de producción
npm start
```

## Estructura del Proyecto

```
frontend/
├── public/              # Assets estáticos
│   ├── pokeballs/      # Sprites de pokéballs
│   ├── sounds/         # Efectos de sonido
│   └── background-music.mp3
├── src/
│   ├── app/            # Páginas (App Router)
│   │   ├── layout.tsx
│   │   ├── page.tsx    # Página principal (Gacha)
│   │   └── globals.css
│   ├── components/     # Componentes reutilizables
│   │   ├── Navbar.tsx
│   │   ├── StarterCard.tsx
│   │   ├── MusicPlayer.tsx
│   │   └── ...
│   └── lib/            # Utilidades y tipos
│       ├── api-client.ts  # Cliente API (IMPORTANTE)
│       ├── sounds.ts
│       └── types/
├── .env.local          # Variables de entorno
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Variables de Entorno

- `NEXT_PUBLIC_API_URL`: URL del backend API (default: http://localhost:4000)

## Características Implementadas

### Fase 1-2: Setup y API Client ✅
- [x] Proyecto Next.js 14 configurado
- [x] Estructura de carpetas
- [x] Variables de entorno
- [x] Tailwind CSS con colores personalizados
- [x] Fuentes y assets
- [x] Tipos TypeScript
- [x] API Client completo con todos los módulos

### Fase 3: Layout y Navegación ✅
- [x] Componente Providers
- [x] Navbar con navegación completa
- [x] ServerIndicator
- [x] Layout principal
- [x] Estilos globales

### Fase 4-5: Sonidos y Componentes ✅
- [x] Librería de sonidos
- [x] MusicPlayer con visualizador
- [x] StarterCard
- [x] SoulDrivenQuestionnaire

## Próximos Pasos

1. Implementar página principal (Gacha) - Tarea 19
2. Implementar autenticación Discord OAuth - Tarea 20
3. Implementar página de Tienda - Tareas 23-26
4. Implementar páginas de Jugadores - Tareas 27-34

## Notas Importantes

- El frontend NO tiene carpeta `src/app/api/` - no usa funciones serverless
- TODAS las llamadas van al backend Express en `backend/`
- El API Client (`src/lib/api-client.ts`) centraliza toda la comunicación
- Los datos de usuario se guardan en localStorage
- El backend maneja TODA la lógica de negocio

## Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Configurar variable de entorno en Vercel Dashboard:
# NEXT_PUBLIC_API_URL = URL del backend en producción
```
