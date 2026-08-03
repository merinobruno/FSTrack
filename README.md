# FSTrack

Aplicación móvil para la carga de formularios de hacienda, desarrollada por **Fisterra SRL**. FSTrack permite a los operarios de campo registrar eventos diarios de hacienda —producción de leche, nacimientos, muertes, traslados y pedidos de compra/venta— y sincronizarlos con el ERP Finnegans, incluso sin conexión.

---

## Qué hace

| Pestaña | Función |
|---------|---------|
| **Inicio** | Datos de dominio/cuenta y selector de empresa |
| **Pedidos** | Envío de pedidos de compra y venta |
| **Formularios** | Carga de formularios de eventos de hacienda |
| **Ayuda** | Guía de uso para usuarios y administradores |

El historial de envíos no es una pestaña: se abre desde el ícono de portapapeles en la cabecera, disponible en Inicio, Formularios y Pedidos.

### Formularios disponibles

- **Producción de Leche** — Producción diaria por lote
- **Nacimientos** — Nacimientos de animales
- **Muertes** — Bajas y pérdidas de hacienda
- **Traslados y Cambios de Categoría** — Movimientos entre lotes o establecimientos
- **Novedades de Sueldo** — Novedades para la liquidación de sueldos
- **Pedido de Compra** — Pedidos de compra
- **Pedido de Venta** — Pedidos de venta

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Router | Expo Router v6 (basado en archivos) |
| Lenguaje | TypeScript 5.9 |
| Base de datos local | expo-sqlite (SQLite) |
| Estado | React Context API |
| Build/Deploy | EAS Build (`eas.json`) |
| Plataformas | iOS, Android, Web |

---

## Arquitectura

```
FSTrack/
├── app/
│   ├── _layout.tsx              # Layout raíz — envuelve todos los providers
│   ├── login.tsx                # Pantalla de ingreso
│   └── (tabs)/
│       ├── _layout.tsx          # Barra de pestañas + panel de envíos
│       ├── index.tsx            # Pestaña Inicio (selector de empresa)
│       ├── ayuda.tsx            # Guía de uso
│       ├── Envios.tsx           # Historial de envíos (fuera de la barra)
│       ├── formularios/         # Formularios de eventos de hacienda
│       │   ├── index.tsx
│       │   ├── produccion.tsx
│       │   ├── nacimientos.tsx
│       │   ├── muertes.tsx
│       │   ├── traslados.tsx
│       │   └── novedades.tsx
│       └── pedidos/             # Formularios de pedidos
│           ├── index.tsx
│           ├── compra.tsx
│           └── venta.tsx
├── components/
│   ├── brand/                   # Biblioteca de componentes del sistema de diseño
│   ├── app-header.tsx           # Acciones de cabecera compartidas
│   ├── searchable-select.tsx    # Desplegable con buscador
│   ├── envios-drawer.tsx        # Panel lateral de envíos
│   ├── pending-review-modal.tsx # Edición y reintento de envíos con error
│   └── SendConfirmationModal.tsx
├── contexts/                    # Providers de React Context
│   ├── AuthContext.tsx          # Sesión + ingreso/salida
│   ├── CompanyContext.tsx       # Empresa seleccionada
│   ├── SubmissionsContext.tsx   # Cola offline + lógica de sincronización
│   └── WorkflowContext.tsx      # Códigos de workflow de venta/compra
├── constants/
│   ├── api.ts                   # URL base de la API
│   └── theme.ts                 # Tokens del sistema de diseño Fisterra
├── utils/
│   ├── local-db.native.ts       # Helpers de SQLite (nativo)
│   ├── local-db.ts              # Stub de SQLite (web)
│   ├── get-finnegans-token.ts   # Intercambio de token con la API de FSTrack
│   ├── api-error.ts             # Parseo de errores
│   ├── options-cache.ts         # Caché de opciones de desplegables
│   └── send-log.ts              # Log de auditoría de envíos
└── hooks/                       # useColorScheme, useThemeColor
```

---

## Flujo de envío offline-first

FSTrack está pensada para funcionar en zonas con mala conectividad. Todo envío sigue este flujo:

```
El usuario envía el formulario
      │
      ▼
Se guarda en SQLite local (status = PENDING)
      │
      ├── ¿Hay red? ──Sí──► POST a la API de Finnegans
      │                             │
      │                       ┌─────┴──────┐
      │                     Éxito        Error
      │                       │              │
      │                 status=SENT    status=ERROR
      │
      └── Sin red ──► queda en PENDING
                              │
                              ▼
                 La app vuelve a primer plano
                              │
                              ▼
                Sincroniza automáticamente todo lo PENDING
```

Los envíos pendientes también se ven en el panel de **Envíos**, donde el usuario puede forzar la sincronización a mano.

---

## Integraciones de API

### Backend de FSTrack
**URL base:** `https://fstrack-gehqf3b4eqfed8aq.canadacentral-01.azurewebsites.net`

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/auth/login` | POST | Autenticación con espacio de trabajo, cuenta y contraseña |
| `/auth/my-companies` | GET | Empresas asignadas a la cuenta |
| `/auth/my-workflow` | GET | Códigos de workflow de venta/compra del usuario |
| `/finnegans/token` | GET | Intercambio de token contra Finnegans |
| `/log` | POST | Registro de auditoría de un envío |
| `/log/mine` | GET | Historial de envíos del usuario |

La autenticación usa **tokens Bearer** guardados en AsyncStorage bajo la clave `fstrack_auth_user`.

### ERP Finnegans
**URL base:** `https://api.finneg.com/api`

Los formularios se envían a Finnegans con un token de vida corta que se obtiene intercambiando el JWT de FSTrack. El intercambio ocurre de forma transparente en `utils/get-finnegans-token.ts`. El token viaja como parámetro `?ACCESS_TOKEN=`, no como header.

| Tipo de formulario | Endpoint |
|--------------------|----------|
| Producción | `/produccionLeche2` |
| Nacimientos | `/NacimientosHacienda` |
| Muertes | `/MuerteHacienda` |
| Traslados | `/TrasladosHacienda` |
| Novedades de Sueldo | `/novedadLiquidacionSueldo` |
| Pedido Compra | `/pedidoCompra` |
| Pedido Venta | `/pedidoVenta` |

---

## Puesta en marcha

### Requisitos previos

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- Para iOS: Xcode + simulador de iOS
- Para Android: Android Studio + emulador, o un dispositivo físico con Expo Go

### Instalación

```bash
cd FSTrack
npm install
```

### Ejecución

```bash
# Levantar el servidor de desarrollo (la plataforma se elige en la terminal)
npm start

# Ejecutar directamente en una plataforma
npm run ios
npm run android
npm run web
```

### Build de producción

FSTrack usa EAS Build. Verificar que el CLI de EAS esté instalado y que la sesión sea la de la cuenta `bmerino` de Expo.

```bash
npm install -g eas-cli
eas build --platform android   # o ios / all
```

---

## Esquema de la base local

La app mantiene una base SQLite local (`fstrack.db`) con una única tabla:

```sql
CREATE TABLE submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  form_type     TEXT NOT NULL,   -- PRODUCCION | NACIMIENTOS | MUERTES | TRASLADOS | PEDIDO_COMPRA | PEDIDO_VENTA | NOVEDADES_SUELDO
  payload       TEXT NOT NULL,   -- JSON enviado a Finnegans
  status        TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | SENT | ERROR
  company_label TEXT,
  created_at    TEXT NOT NULL,
  sent_at       TEXT,
  error_detail  TEXT
);
```

---

## Ingreso

El ingreso se hace con tres datos:

| Campo | Descripción |
|-------|-------------|
| **Espacio de trabajo** | Dominio de la organización |
| **Cuenta** | Nombre de usuario |
| **Contraseña** | Contraseña |

Las sesiones se guardan en AsyncStorage y se restauran automáticamente al abrir la app.

---

## Diseño

La app implementa el sistema de diseño de Fisterra: Montserrat sobre fondo gris, titulares pareados en rojo y azul tinta, paneles de esquinas redondeadas y pills con degradé navy.

- Los tokens viven en `constants/theme.ts`. No usar colores ni tamaños hardcodeados en las pantallas.
- Los componentes vienen de `components/brand/` (`Screen`, `Panel`, `PairedHeading`, `Field`, `StatusBox`, `Button`, entre otros). Las pantallas de formulario se arman como `FormScreen > FormSection > ItemCard`.
- La app es de **modo claro únicamente**: el sistema no define variante oscura.
- El rojo de marca solo se usa en carga tipográfica grande (≥24px bold) o en el isotipo — no pasa contraste en cuerpo de texto.

---

## Cómo contribuir

1. Verificar que `npm run lint` pase antes de hacer commit (reglas de `eslint-config-expo`).
2. La app usa **rutas tipadas** (`experiments.typedRoutes: true`) — mantener los strings de ruta type-safe.
3. Todo nuevo tipo de formulario debe agregarse a la unión `FormType` en `utils/local-db.native.ts` **y** en el stub web `utils/local-db.ts`, con su endpoint correspondiente en el mapa `ENDPOINTS` de `contexts/SubmissionsContext.tsx`.
4. Construir las pantallas con los componentes de `components/brand/` en lugar de escribir paneles, inputs o cajas de estado a mano.
5. Probar el comportamiento offline: poner el dispositivo en modo avión, enviar un formulario, restablecer la conexión y verificar que el panel de Envíos sincronice.
