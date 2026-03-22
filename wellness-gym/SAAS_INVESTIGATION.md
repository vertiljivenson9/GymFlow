# Investigación: Flujo SaaS para Gimnasios
## Mindbody, Zen Planner, Glofox, Pike13

---

## 1. ONBOARDING - Registro de Nuevo Gimnasio

### Flujo General (Similar en todas las plataformas):

```
1. Landing Page → "Start Free Trial" / "Book Demo"
   ↓
2. Formulario inicial:
   - Nombre del gimnasio/estudio
   - Email del owner
   - Teléfono
   - Tipo de negocio (yoga, crossfit, pilates, gym general)
   - Número aproximado de miembros
   ↓
3. Creación de cuenta:
   - Subdominio automático: tunombre.mindbodyonline.com
   - O dominio personalizado (planes superiores)
   ↓
4. Wizard de configuración (5-15 minutos):
   - Logo y colores de marca
   - Horarios de clases
   - Tipos de membresías/precios
   - Ubicación física
   - Datos fiscales
   ↓
5. Configuración de pagos:
   - Conectar Stripe/PayPal/processor nativo
   - Verificación de identidad (KYC)
   ↓
6. Importación de datos (opcional):
   - CSV de miembros existentes
   - Integración con sistemas legacy
```

### Diferencias Clave:

| Plataforma | Trial | Demo Requerido | Tiempo Setup |
|------------|-------|----------------|--------------|
| **Mindbody** | 30 días | Sí (ventas) | 2-7 días |
| **Zen Planner** | 30 días | No obligatorio | 1-3 días |
| **Glofox** | 14 días | Sí (focused en demo) | 1-2 días |
| **Pike13** | 15 días | Sí | 1-3 días |

---

## 2. PERSONALIZACIÓN DEL DUEÑO

### Nivel de Personalización por Área:

```
┌─────────────────────────────────────────────────────────────┐
│                    PERSONALIZACIÓN                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BRANDING                    │  OPERACIONAL                 │
│  ├─ Logo                     │  ├─ Clases y horarios        │
│  ├─ Colores primarios        │  ├─ Capacidad por clase      │
│  ├─ Fuentes                  │  ├─ Instructores             │
│  ├─ Imágenes                 │  ├─ Ubicaciones múltiples    │
│  └─ Mensaje de bienvenida    │  └─ Reglas de cancelación    │
│                             │                              │
│  COMERCIAL                  │  COMUNICACIÓN                │
│  ├─ Membresías/planes       │  ├─ Emails automatizados     │
│  ├─ Precios                 │  ├─ SMS (addon)              │
│  ├─ Descuentos/promociones  │  ├─ Notificaciones push      │
│  ├─ Paquetes de clases      │  └─ Plantillas de mensajes   │
│  └─ Productos (retail)      │                              │
│                             │                              │
│  DIGITAL                    │  INTEGRACIONES               │
│  ├─ Dominio personalizado   │  ├─ Website builder          │
│  ├─ App móvil (white-label) │  ├─ Zapier                   │
│  ├─ Widgets para web        │  ├─ Mailchimp                │
│  └─ Landing pages           │  └─ Contabilidad (Xero, QB)  │
│                             │                              │
└─────────────────────────────────────────────────────────────┘
```

### Apps Móviles:

| Plataforma | App Propia | White Label | Costo White Label |
|------------|------------|-------------|-------------------|
| Mindbody | Sí (consumidor usa app central) | Sí | ~$100-200/mes extra |
| Zen Planner | Sí | Sí | Incluido en planes altos |
| Glofox | Sí | Sí (branded) | Incluido |
| Pike13 | Sí | Sí | Add-on |

---

## 3. RESERVAS DE CLIENTES FINALES

### Dos Modelos Principales:

### MODELO A: Plataforma Central (Mindbody clásico)
```
Cliente → App Mindbody → Busca gimnasio → Reserva
         (marketplace con todos los gimnasios)

Ventajas:
✅ Exposición a nuevos clientes
✅ App ya instalada por muchos usuarios
✅ Marketing gratuito dentro del marketplace

Desventajas:
❌ Menos control de marca
❌ Cliente "pertenece" a Mindbody
❌ Competencia visible en misma app
```

### MODELO B: Dominio/App Dedicada (Glofox, Zen Planner)
```
Cliente → App del gimnasio (branding propio) → Reserva
         (o web: tunombre.glofox.com)

Ventajas:
✅ Branding 100% del gimnasio
✅ Cliente leal a tu marca
✅ Sin competencia visible

Desventajas:
❌ No hay marketplace discovery
❌ Debes atraer tus propios clientes
```

### Flujo de Reserva Típico:

```
1. Cliente accede (web/app)
   ↓
2. Ve calendario de clases
   ↓
3. Selecciona clase → Ve disponibilidad
   ↓
4. Confirma reserva
   ↓
5. Opciones:
   - Usar crédito de membresía
   - Pagar clase individual
   - Usar paquete
   ↓
6. Confirmación (email/SMS/push)
   ↓
7. Check-in (QR code en app)
```

### URLs de Acceso:

| Plataforma | Estructura URL |
|------------|----------------|
| Mindbody | `clients.mindbodyonline.com/Login/launch?studioid=XXXXX` |
| Zen Planner | `tunombre.zenplanner.com` |
| Glofox | `tunombre.glofox.com` o dominio propio |
| Pike13 | `tunombre.pike13.com` |

---

## 4. MANEJO DE PAGOS

### Flujo de Dinero:

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUJO DE PAGOS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cliente Final         Plataforma SaaS           Gimnasio       │
│       │                      │                       │          │
│       │  1. Paga $100        │                       │          │
│       │ ──────────────────→  │                       │          │
│       │                      │                       │          │
│       │                      │  2. Retiene fee       │          │
│       │                      │     (2.5-5% + $0.30)  │          │
│       │                      │                       │          │
│       │                      │  3. Transfiere $95    │          │
│       │                      │ ───────────────────→  │          │
│       │                      │                       │          │
│       │                      │  4. Cobra suscripción │          │
│       │                      │ ←───────────────────  │          │
│       │                      │     ($100-500/mes)    │          │
│       │                      │                       │          │
└─────────────────────────────────────────────────────────────────┘
```

### Quién Cobra al Cliente Final:

| Plataforma | Procesador | El Cliente Ve en Extracto |
|------------|------------|---------------------------|
| **Mindbody** | Mindbody Payments (Stripe backend) | "MINDBODY * NombreGym" |
| **Zen Planner** | Stripe/PayPal | "Nombre del Gimnasio" |
| **Glofox** | Stripe (integrado) | "Nombre del Gimnasio" |
| **Pike13** | Pike13 Payments (Stripe) | "Nombre del Gimnasio" |

### Modelo de Monetización del SaaS:

```
┌────────────────────────────────────────────────────────────┐
│                INGRESOS DEL SAAS                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. SUSCRIPCIÓN MENSUAL (SaaS principal)                  │
│     ├─ Básico:     $100-150/mes                          │
│     ├─ Estándar:   $200-300/mes                          │
│     └─ Premium:    $400-500+/mes                         │
│                                                            │
│  2. PROCESSING FEES (por transacción)                     │
│     ├─ 2.5% - 3.5% + $0.30 por transacción               │
│     └─ Similar a Stripe pero con markup                   │
│                                                            │
│  3. ADD-ONS                                               │
│     ├─ App white-label: $100-300/mes extra               │
│     ├─ SMS marketing: $50-100/mes + por mensaje          │
│     ├─ Marketing suite: $100-200/mes                     │
│     └─ Integraciones avanzadas: variable                 │
│                                                            │
│  4. MARKETPLACE FEES (solo Mindbody)                     │
│     └─ Comisión por clientes nuevos del marketplace       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Tiempo de Liquidación:

```
Mindbody:    T+2 a T+5 (depende del banco)
Zen Planner: T+2 (via Stripe)
Glofox:      T+2 (via Stripe)
Pike13:      T+2 (via Stripe)

Algunos ofrecen "Instant Payout" con fee adicional.
```

---

## 5. VISTAS: ADMIN GIMNASIO vs SUPER ADMIN PLATAFORMA

### VISTA DEL ADMIN DEL GIMNASIO:

```
┌─────────────────────────────────────────────────────────────┐
│             DASHBOARD - ADMIN DEL GIMNASIO                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  METRICAS DE SU NEGOCIO                                    │
│  ├─ Ingresos del mes                                       │
│  ├─ Nuevos miembros                                        │
│  ├─ Retención %                                            │
│  ├─ Clases más populares                                   │
│  └─ Ocupación promedio                                     │
│                                                             │
│  GESTIÓN DE MIEMBROS                                       │
│  ├─ Lista de clientes                                      │
│  ├─ Membresías activas                                     │
│  ├─ Historial de pagos                                     │
│  ├─ Asistencias                                            │
│  └─ Notas/comunicaciones                                   │
│                                                             │
│  GESTIÓN DE CLASES                                         │
│  ├─ Calendario semanal                                     │
│  ├─ Crear/editar clases                                    │
│  ├─ Asignar instructores                                   │
│  └─ Ver reservas                                           │
│                                                             │
│  PAGOS Y FACTURACIÓN                                       │
│  ├─ Transacciones recientes                                │
│  ├─ Facturas emitidas                                      │
│  ├─ Pagos pendientes                                       │
│  └─ Reportes contables                                     │
│                                                             │
│  MI APP Y WEBSITE                                          │
│  ├─ Configurar widget                                      │
│  ├─ Personalizar colores                                   │
│  ├─ Ver preview                                            │
│  └─ Código embed                                           │
│                                                             │
│  CONFIGURACIÓN                                             │
│  ├─ Mi suscripción                                         │
│  ├─ Usuarios staff                                         │
│  ├─ Notificaciones                                         │
│  └─ Integraciones                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### VISTA DEL SUPER ADMIN DE PLATAFORMA:

```
┌─────────────────────────────────────────────────────────────┐
│           DASHBOARD - SUPER ADMIN PLATAFORMA               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  METRICAS GLOBALES DE PLATAFORMA                           │
│  ├─ Total gimnasios activos                                │
│  ├─ Gimnasios nuevos (por período)                         │
│  ├─ Churn rate                                             │
│  ├─ MRR (Monthly Recurring Revenue)                        │
│  ├─ ARR (Annual Recurring Revenue)                         │
│  ├─ ARPU (Average Revenue Per User)                        │
│  └─ GMV (Gross Merchandise Value - todas las transacciones)│
│                                                             │
│  GESTIÓN DE CUENTAS (GIMNASIOS)                            │
│  ├─ Lista de gimnasios con estado                          │
│  │   ├─ Trial activo                                       │
│  │   ├─ Activo (pagando)                                   │
│  │   ├─ Suspendido                                         │
│  │   ├─ Cancelado                                          │
│  │   └─ Demo                                               │
│  ├─ Acceso "Login As" (impersonate)                        │
│  ├─ Gestión de upgrades/downgrades                         │
│  ├─ Historial de soporte                                   │
│  └─ Notas internas por cuenta                              │
│                                                             │
│  BILLING & FINANCE                                         │
│  ├─ Ingresos por suscripciones                             │
│  ├─ Ingresos por processing fees                           │
│  ├─ Facturas a gimnasios                                   │
│  ├─ Reportes fiscales                                      │
│  ├─ Proyecciones de revenue                                │
│  └─ Cohort analysis                                        │
│                                                             │
│  SOPORTE Y OPERACIONES                                     │
│  ├─ Tickets de soporte                                     │
│  ├─ Logs de sistema                                        │
│  ├─ Alertas y monitoreo                                    │
│  ├─ Feature flags                                          │
│  └─ Maintenance mode por tenant                            │
│                                                             │
│  CONFIGURACIÓN DE PLATAFORMA                               │
│  ├─ Planes y precios                                       │
│  ├─ Features por plan                                      │
│  ├─ Integraciones globales                                 │
│  ├─ Email templates                                        │
│  ├─ Términos y condiciones                                 │
│  └─ Idiomas disponibles                                    │
│                                                             │
│  PRODUCT & GROWTH                                          │
│  ├─ Feature usage analytics                                │
│  ├─ Funnel de onboarding                                   │
│  ├─ A/B tests                                              │
│  ├─ NPS scores                                             │
│  └─ Product metrics                                        │
│                                                             │
│  SEGURIDAD Y COMPLIANCE                                    │
│  ├─ Audit logs                                             │
│  ├─ Access control                                         │
│  ├─ Data retention                                         │
│  └─ GDPR compliance                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Matriz de Permisos:

| Funcionalidad | Admin Gym | Super Admin |
|---------------|-----------|-------------|
| Ver sus datos | ✅ | ✅ |
| Ver datos de OTRO gimnasio | ❌ | ✅ |
| Configurar su plan | ❌ | ✅ |
| Cambiar precios plataforma | ❌ | ✅ |
| Impersonate usuarios | ❌ | ✅ |
| Ver métricas globales | ❌ | ✅ |
| Acceder a billing plataforma | ❌ | ✅ |
| Configurar features globales | ❌ | ✅ |
| Exportar todos los datos | ❌ | ✅ |
| Borrar cuentas | Solo la suya | ✅ Todas |

---

## 6. ARQUITECTURA MULTI-TENANT

```
┌──────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA MULTI-TENANT                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    LOAD BALANCER                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│        ┌─────────────────────┼─────────────────────┐           │
│        ▼                     ▼                     ▼           │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐     │
│  │  App     │          │  App     │          │  App     │     │
│  │ Server 1 │          │ Server 2 │          │ Server N │     │
│  └──────────┘          └──────────┘          └──────────┘     │
│        │                     │                     │           │
│        └─────────────────────┼─────────────────────┘           │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              TENANT ROUTING MIDDLEWARE                      ││
│  │  - Subdomain: gym1.app.com → tenant_id: 123                ││
│  │  - Header: X-Tenant-ID: 456                                ││
│  │  - Path: /gym/789/...                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│        ┌─────────────────────┼─────────────────────┐           │
│        ▼                     ▼                     ▼           │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐     │
│  │ Database │          │  Redis   │          │   S3     │     │
│  │ (shared) │          │ (cache)  │          │ (files)  │     │
│  │          │          │          │          │          │     │
│  │ tenant_id│          │ per-tenant│         │ tenant/  │     │
│  │ en todas │          │  cache   │          │  id/     │     │
│  │ tablas   │          │          │          │          │     │
│  └──────────┘          └──────────┘          └──────────┘     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Modelos de Base de Datos:

| Modelo | Descripción | Ventajas | Usado por |
|--------|-------------|----------|-----------|
| **Shared DB + tenant_id** | Una BD, tenant_id en cada tabla | Económico, simple | Mindbody, Glofox |
| **Schema per tenant** | Un schema PostgreSQL por tenant | Mejor aislamiento | Enterprise |
| **Database per tenant** | BD separada por cliente | Máximo aislamiento | Gimnasios grandes |

---

## 7. RESUMEN EJECUTIVO

### Para Construir un SaaS de Gimnasios, Necesitas:

```
1. ONBOARDING
   ├─ Form de registro
   ├─ Wizard de configuración
   ├─ Subdominio automático
   └─ Integración pagos (Stripe Connect)

2. MULTI-TENANCY
   ├─ Routing por subdomain/path
   ├─ Aislamiento de datos
   └─ Configuración por tenant

3. DASHBOARDS DIFERENCIADOS
   ├─ Admin: gestión de SU gimnasio
   └─ Super Admin: gestión de plataforma

4. SISTEMA DE RESERVAS
   ├─ Calendario de clases
   ├─ Gestión de capacidad
   ├─ Waitlist
   └─ Check-in (QR)

5. PAGOS (Stripe Connect)
   ├─ Platform fee (tu %)
   ├─ Processing fee (Stripe %)
   └─ Payouts automáticos a gimnasios

6. APP MÓVIL
   ├─ Opción A: App central (marketplace)
   └─ Opción B: White-label por gimnasio

7. BILLING DE PLATAFORMA
   ├─ Suscripciones a gimnasios
   ├─ Metered billing (por miembro, transacciones)
   └─ Add-ons
```

### Modelo de Revenue Stacking:

```
Tu SaaS de Gimnasios gana de:

1. SUSCRIPCIÓN: $100-500/mes por gimnasio
2. PROCESSING: 2.5-3% de cada transacción
3. ADD-ONS: $50-300/mes por features extra
4. WHITE-LABEL APP: $100-300/mes extra
5. SMS/EMAIL: Markup sobre proveedor

Ejemplo con 100 gimnasios:
- Suscripciones: $30,000/mes (promedio $300)
- Processing (100 gyms × 500 trans × $50 prom × 2.5%): $62,500/mes
- Add-ons: $10,000/mes

Total MRR: ~$100,000/mes
```

---

## 8. PRÓXIMOS PASOS PARA TU PROYECTO

Basado en el código existente en `wellness-gym/`:

### Ya Tienes:
- [x] Página de Admin (para gimnasio individual)
- [x] Página de SuperAdmin (para plataforma)
- [x] Sistema de auth con Firebase
- [x] Flujo de bookings básico

### Para Convertir en SaaS Multi-Tenant:

1. **Añadir `tenant_id` a todas las tablas**
   - bookings, users, services, payments

2. **Implementar routing multi-tenant**
   - Subdominio: `wellness-gym.tuapp.com`
   - O path: `tuapp.com/wellness-gym`

3. **Stripe Connect para pagos**
   - Cada gimnasio conecta su cuenta Stripe
   - Platform fee automático

4. **Onboarding flow**
   - Formulario de registro
   - Wizard de configuración
   - Conexión de pagos

5. **Aislamiento de datos**
   - Middleware que inyecte `tenant_id`
   - Queries filtradas por tenant

---

*Investigación basada en Mindbody, Zen Planner, Glofox y Pike13*
*Fecha: Enero 2025*
