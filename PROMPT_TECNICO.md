# GUIA TÉCNICA - WELLNESS GYM / GYMFLOW SAAS

## PROYECTO ACTIVO
**Ubicación:** `/home/z/my-project/`
**Tipo:** Next.js 16 + TypeScript + Tailwind CSS
**Puerto:** 3000

## COMANDO PARA PREVIEW
```bash
cd /home/z/my-project && bun run dev 2>&1 &
```

## IMPORTANTE - NO USAR
- ❌ NO usar `pnpm dev` (pnpm no está instalado globalmente)
- ❌ NO usar el proyecto en `/home/z/my-project/wellness-gym/frontend/` (es Vite, no tiene integración con preview)
- ❌ NO usar puerto 5175/5176 (ese era Vite, ya no se usa)

## ARCHIVOS PRINCIPALES
```
/home/z/my-project/
├── src/app/page.tsx      # Página principal (toda la app está aquí)
├── src/app/layout.tsx    # Layout
├── src/app/globals.css   # Estilos globales
├── public/logo.png       # Logo GymFlow
└── package.json          # Scripts
```

## LOGO
- Archivo: `/home/z/my-project/public/logo.png`
- Se muestra en: Header, Landing (hero), Footer, Success page
- Para cambiar: Reemplazar el archivo logo.png

## FLUJO DE RESERVAS (5 pasos)
1. **Landing** → Click "Reservar Sesión"
2. **Service** → Elegir servicio
3. **Time** → Elegir fecha y hora
4. **Details** → Nombre, email, teléfono
5. **Register** → Crear cuenta (opcional) o continuar como invitado
6. **Payment** → Pagar (tarjeta demo: 4242 4242 4242 4242)

## DEMO DATA
- Tarjeta: `4242 4242 4242 4242`
- Vencimiento: `12/25`
- CVC: `123`

## IDIOMA
- Español por defecto (detectado del navegador)
- Botón EN/ES en header para cambiar

## SI EL PREVIEW NO APARECE
1. Verificar que el servidor esté corriendo:
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
   ```
   Debe retornar: `200`

2. Ver el log:
   ```bash
   cat /home/z/my-project/dev.log
   ```

3. Matar procesos y reiniciar:
   ```bash
   pkill -9 -f "next"
   cd /home/z/my-project && bun run dev 2>&1 &
   ```

## VERIFICAR SERVIDOR ACTIVO
```bash
ps aux | grep next | grep -v grep
```
Debe mostrar proceso `next-server`

## TECNOLOGÍAS
- Next.js 16.1.3 (Turbopack)
- React 18
- TypeScript
- Tailwind CSS
- Fuentes: Space Grotesk + Inter

## ÚLTIMA ACTUALIZACIÓN
- Logo GymFlow agregado
- Flujo de registro antes del pago
- Opción premium opcional
- Multi-tenant preparado para SaaS
