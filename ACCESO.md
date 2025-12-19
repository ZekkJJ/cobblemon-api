# 🌐 Cómo Acceder a tu Web desde Afuera

## 📍 URL de Acceso

Tu web en Pterodactyl estará disponible en:

```
http://IP-DEL-SERVIDOR:PUERTO
```

### Ejemplo:
- IP del servidor: `123.45.67.89`
- Puerto asignado: `25566`
- **URL**: `http://123.45.67.89:25566`

---

## 🔍 Encontrar tu IP y Puerto

### 1. **IP del Servidor**
- Ve al panel de Pterodactyl
- En la pestaña **"Console"** o **"Settings"**
- Busca **"Server Address"** o **"Allocation"**
- Ejemplo: `node1.tuhost.com` o `123.45.67.89`

### 2. **Puerto**
- En **"Network"** o **"Allocation"**
- Verás algo como: `123.45.67.89:25566`
- El número después de `:` es tu puerto

---

## ✅ Configuración Necesaria

### 1. **Variables de Entorno** (CRÍTICO)
En Pterodactyl → **Startup**:

```bash
NEXTAUTH_URL=http://TU-IP:TU-PUERTO
```

**Ejemplo:**
```bash
NEXTAUTH_URL=http://123.45.67.89:25566
```

⚠️ **MUY IMPORTANTE**: Si no configuras esto correctamente, el login con Discord NO funcionará.

---

## 🌍 Opciones de Dominio

### Opción 1: Usar IP Directa (Básico)
```
http://123.45.67.89:25566
```
✅ Funciona inmediatamente
❌ Feo para compartir
❌ Cambia si cambias de servidor

### Opción 2: Usar Dominio (Recomendado)
Si tienes un dominio (ej: `cobblemon.com`):

1. **Crear registro A en tu DNS:**
   - Tipo: `A`
   - Nombre: `@` o `www`
   - Valor: `123.45.67.89` (IP del servidor)

2. **O crear subdominio:**
   - Tipo: `A`
   - Nombre: `api`
   - Valor: `123.45.67.89`
   - URL final: `http://api.cobblemon.com:25566`

3. **Actualizar NEXTAUTH_URL:**
```bash
NEXTAUTH_URL=http://tu-dominio.com:25566
```

### Opción 3: Reverse Proxy (Profesional)

Si quieres quitar el puerto (usar puerto 80/443):

1. Instala **Nginx** o **Caddy** en el servidor
2. Configura proxy hacia `localhost:25566`
3. URL final: `http://cobblemon.com` (sin puerto)

**Ejemplo Nginx:**
```nginx
server {
    listen 80;
    server_name cobblemon.com;
    
    location / {
        proxy_pass http://localhost:25566;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔒 HTTPS (Opcional pero Recomendado)

Para usar Discord OAuth correctamente necesitas HTTPS:

1. **Obtén certificado SSL gratis con Certbot:**
```bash
certbot --nginx -d cobblemon.com
```

2. **Actualiza NEXTAUTH_URL:**
```bash
NEXTAUTH_URL=https://cobblemon.com
```

3. **Actualiza Discord OAuth:**
   - Ve a [Discord Developer Portal](https://discord.com/developers/applications)
   - Redirect URI: `https://cobblemon.com/api/auth/callback/discord`

---

## 📱 Compartir el Link

### Link Público:
```
http://IP:PUERTO
```

### Con Dominio:
```
http://cobblemon.com:25566
```

### Con HTTPS y reverse proxy:
```
https://cobblemon.com
```

---

## 🧪 Verificar que Funciona

1. Abre el navegador
2. Ve a: `http://TU-IP:TU-PUERTO`
3. Deberías ver la página principal

Si NO funciona:
- ✅ Verifica que el servidor esté corriendo en Pterodactyl
- ✅ Revisa que el puerto esté abierto en el firewall
- ✅ Confirma la IP y puerto correctos
- ✅ Mira los logs en la consola de Pterodactyl

---

## 💡 Tips

- **Firewall**: Asegúrate que el puerto esté abierto en el firewall del servidor
- **Puerto 80/443**: Si quieres usar estos puertos, necesitas permisos root o reverse proxy
- **Discord OAuth**: DEBE coincidir exactamente con `NEXTAUTH_URL`
- **Variables**: Reinicia el servidor después de cambiar variables de entorno
