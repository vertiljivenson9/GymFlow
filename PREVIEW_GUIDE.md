# Guía Técnica - Preview del Proyecto

## Problema Común
El usuario no puede ver el preview del proyecto en su interfaz.

## Solución Confirmada

### Paso 1: Verificar proyecto correcto
El proyecto Next.js principal está en:
```
/home/z/my-project/
```

NO usar el proyecto Vite en:
```
/home/z/my-project/wellness-gym/frontend/  ← INCORRECTO
```

### Paso 2: Matar procesos existentes
```bash
pkill -9 -f "next" 2>/dev/null
pkill -9 -f "pnpm" 2>/dev/null
pkill -9 -f "node.*3000" 2>/dev/null
sleep 2
```

### Paso 3: Iniciar servidor correctamente
```bash
cd /home/z/my-project && bun run dev 2>&1 &
```

### Paso 4: Verificar que funciona
```bash
sleep 5
curl -s http://localhost:3000 > /dev/null && echo "Server running on port 3000"
```

## Comandos que NO funcionan
- ❌ `pnpm dev` - pnpm no está instalado globalmente
- ❌ `npm run dev` - No tiene integración con preview
- ❌ Proyecto Vite - No tiene integración con el preview del usuario
- ❌ `npx pnpm dev` - Puede causar conflictos

## Verificar servidor activo
```bash
curl -s http://localhost:3000/
# Debe retornar HTML con status 200
```

## Puerto
Siempre usar puerto 3000 (configurado en package.json)

## Estructura del Proyecto
```
/home/z/my-project/
├── src/app/
│   ├── page.tsx      # Página principal
│   ├── layout.tsx    # Layout
│   └── api/          # API routes
├── public/
│   └── logo.png      # Logo del proyecto
├── package.json
└── dev.log           # Logs del servidor
```

## Logo
El logo está en: `/home/z/my-project/public/logo.png`

## Notas Importantes
1. El usuario usa una interfaz que detecta automáticamente el preview de Next.js
2. Solo proyectos Next.js funcionan con el preview automático
3. Proyectos Vite/React NO muestran preview automático
4. El comando `bun run dev` es el único que funciona consistentemente
