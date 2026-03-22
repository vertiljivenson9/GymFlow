# =======================================================
# 🧠 GYMFLOW - SISTEMA COMPLETO FINAL (PRODUCTION READY)
# =======================================================

## 📦 Estructura del Proyecto

```
src/
├── lib/
│   ├── db.ts              # Firestore database layer
│   ├── subscription.ts    # Período y fechas
│   ├── access.ts          # Control de acceso
│   ├── qr.ts              # Tokens anti-fraude
│   ├── paypal-api.ts      # PayPal API segura
│   ├── checkin.ts         # Lógica de check-in
│   └── utils.ts           # Utilidades generales
│
├── app/api/
│   ├── orders/
│   │   ├── create/route.ts    # Crear orden PayPal
│   │   └── capture/route.ts   # Capturar pago (BACKEND)
│   │
│   ├── checkin/route.ts       # Check-in con QR
│   │
│   ├── paypal/
│   │   ├── create-order/route.ts
│   │   └── capture-order/route.ts
│   │
│   └── subscriptions/route.ts
│
└── app/g/[slug]/checkin/      # Página de check-in
```

---

## 🔄 FLUJO COMPLETO (CERRADO)

```
┌─────────────────────────────────────────────────────────────┐
│                      ENTRADA                                 │
│                   Usuario escanea QR                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              1. VERIFICACIÓN DEL TOKEN QR                   │
│                                                              │
│   token = "gymId.timestamp.signature"                       │
│           ├─ Verificar formato                               │
│           ├─ Verificar HMAC signature                        │
│           └─ Verificar expiración (30 seg)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
        VÁLIDO             INVÁLIDO
            │                   │
            ▼                   ▼
┌───────────────────┐   ┌─────────────────┐
│   CONTINUAR       │   │  ERROR:         │
│                   │   │  QR inválido    │
└─────────┬─────────┘   └─────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│              2. VERIFICACIÓN DE ACCESO                      │
│                                                              │
│   getUserAccess(userId, gymId)                               │
│   ├─ Buscar suscripción activa                               │
│   ├─ Verificar status = 'active'                             │
│   └─ Verificar currentPeriodEnd > now                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    ACTIVE       NO_SUBSCRIPTION  EXPIRED
        │             │             │
        ▼             ▼             ▼
┌───────────┐  ┌─────────────┐  ┌──────────┐
│ CHECK-IN  │  │   PAYPAL    │  │ RENOVAR  │
│ PERMITIDO │  │   CHECKOUT  │  │  PAYPAL  │
└─────┬─────┘  └──────┬──────┘  └────┬─────┘
      │               │              │
      │               └──────┬───────┘
      │                      │
      ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    3. PAYPAL CHECKOUT                        │
│                                                              │
│   a) POST /api/orders/create                                │
│      ├─ createPayPalOrder() → PayPal API                    │
│      └─ Guardar en DB: payments { status: 'created' }       │
│                                                              │
│   b) Usuario aprueba en PayPal                              │
│                                                              │
│   c) POST /api/orders/capture                               │
│      ├─ capturePayPalOrder() → PayPal API (SECRET)          │
│      ├─ Verificar status === 'COMPLETED'                    │
│      └─ Actualizar DB: payments { status: 'completed' }     │
│                                                              │
│   d) Crear subscription:                                     │
│      └─ subscriptions.create({                              │
│           status: 'active',                                  │
│           currentPeriodEnd: calculatePeriodEnd(interval)    │
│         })                                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    4. CHECK-IN                               │
│                                                              │
│   performCheckin(userId, gymId)                              │
│   ├─ Verificar último check-in (anti-spam: 2 min)          │
│   ├─ Crear registro: checkins.create()                      │
│   └─ Retornar success: true                                  │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    5. CONFIRMACIÓN                           │
│                                                              │
│   Usuario ve:                                                │
│   "¡Bienvenido! Check-in confirmado"                         │
│   + Fecha y hora                                             │
│   + Nombre del gimnasio                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 SEGURIDAD IMPLEMENTADA

### QR Tokens (Anti-Fraude)
```javascript
// Generación
token = `${gymId}.${timestamp}.${hmacSignature}`

// Verificación
1. Formato válido (3 partes)
2. Timestamp no expirado (30 seg)
3. HMAC signature válido
```

### PayPal (Captura Segura)
```javascript
// ❌ NUNCA en cliente
actions.order.capture() // INSEGURO

// ✅ SIEMPRE en backend
POST /api/orders/capture
├─ Usa PAYPAL_CLIENT_SECRET
└─ Verifica status === 'COMPLETED'
```

### Check-in Anti-Spam
```javascript
// Mínimo 2 minutos entre check-ins
if (Date.now() - lastCheckin.timestamp < 120000) {
  return { success: false, reason: 'TOO_SOON' }
}
```

---

## 📋 VARIABLES DE ENTORNO (VERCEL)

```
# App
NEXT_PUBLIC_APP_URL=https://gym-flow-wine.vercel.app

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_MODE=sandbox
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# Seguridad
QR_SECRET=tu-clave-secreta-qr

# Firebase
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
```

---

## ✅ CHECKLIST PRODUCCIÓN

- [x] QR usa URL dinámica (`window.location.origin`)
- [x] QR usa slug (no ID interno)
- [x] Token QR con HMAC signature
- [x] Token QR expira en 30 seg
- [x] PayPal NO se renderiza en SSR
- [x] PayPal script NO se duplica
- [x] Captura de pago SOLO en backend
- [x] Access control antes de check-in
- [x] Anti-spam check-in (2 min)
- [x] Variables de entorno en Vercel

---

## 🧪 TESTING

### Test QR Flow:
```bash
# 1. Generar QR desde dashboard
# 2. Escanear con teléfono
# 3. Verificar URL: /g/[slug]/checkin?member=xxx&code=xxx
# 4. Confirmar check-in
```

### Test PayPal Flow:
```bash
# 1. Ir a suscripción
# 2. Click "Suscribirse"
# 3. Completar pago en PayPal Sandbox
# 4. Verificar redirección exitosa
# 5. Confirmar suscripción en DB
```

---

## 📊 MONITOREO

Logs importantes:
```
[PayPal] Token obtained successfully
[PayPal] Order created: xxx
[PayPal] Payment captured successfully: xxx
[CHECKIN] Created: { userId, gymId, timestamp }
[DB] Firestore not available, returning null (demo mode)
```
