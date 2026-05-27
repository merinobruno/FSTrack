# FSTrack

Mobile app for livestock (hacienda) form submission, built by **Fisterra SRL**. FSTrack lets field operators log daily livestock events — milk production, births, deaths, transfers, and purchase/sale orders — and syncs them to the Finnegans ERP, even when offline.

---

## What it does

| Tab | Purpose |
|-----|---------|
| **Home** | Domain/account info and company (empresa) selector |
| **Formularios** | Fill out livestock event forms |
| **Pedidos** | Submit purchase and sale orders |
| **Envíos** | View submission history and sync pending items |

### Forms available

- **Producción de Leche** — Daily milk production by lot
- **Nacimientos** — Animal births
- **Muertes** — Livestock deaths / losses
- **Traslados y Cambios de Categoría** — Transfers between lots or establishments
- **Pedido de Compra** — Purchase orders
- **Pedido de Venta** — Sales orders

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Router | Expo Router v6 (file-based) |
| Language | TypeScript 5.9 |
| Local DB | expo-sqlite (SQLite) |
| State | React Context API |
| Build/Deploy | EAS Build (`eas.json`) |
| Platforms | iOS, Android, Web |

---

## Architecture

```
FSTrack/
├── app/
│   ├── _layout.tsx              # Root layout — wraps all providers
│   ├── login.tsx                # Login screen
│   └── (tabs)/
│       ├── index.tsx            # Home tab (company selector)
│       ├── Envios.tsx           # Submission history tab
│       ├── formularios/         # Livestock event forms
│       │   ├── produccion.tsx
│       │   ├── nacimientos.tsx
│       │   ├── muertes.tsx
│       │   └── traslados.tsx
│       └── pedidos/             # Order forms
│           ├── compra.tsx
│           └── venta.tsx
├── components/                  # Shared UI components
├── contexts/                    # React Context providers
│   ├── AuthContext.tsx          # Auth state + sign in/out
│   ├── CompanyContext.tsx       # Selected company state
│   ├── SubmissionsContext.tsx   # Offline queue + sync logic
│   └── WorkflowContext.tsx      # Venta/Compra workflow codes
├── constants/
│   ├── api.ts                   # API base URL
│   └── theme.ts                 # Colors and fonts
├── utils/
│   ├── local-db.native.ts       # SQLite helpers (native)
│   ├── local-db.ts              # SQLite stub (web)
│   ├── get-finnegans-token.ts   # Token exchange with FSTrack API
│   ├── api-error.ts             # Error parsing helpers
│   ├── options-cache.ts         # Dropdown option caching
│   └── send-log.ts              # Submission audit log
└── hooks/                       # useColorScheme, useThemeColor
```

---

## Offline-first submission flow

FSTrack is built to work in areas with poor connectivity. Every form submission goes through this flow:

```
User submits form
      │
      ▼
Save to local SQLite (status = PENDING)
      │
      ├── Network available? ──Yes──► POST to Finnegans API
      │                                     │
      │                               ┌─────┴──────┐
      │                            Success        Error
      │                               │              │
      │                         status=SENT    status=ERROR
      │
      └── No network ──► status stays PENDING
                              │
                              ▼
                    App comes to foreground
                              │
                              ▼
                    Auto-sync all PENDING items
```

Pending submissions are also visible on the **Envíos** tab, where users can manually trigger a sync.

---

## API integrations

### FSTrack backend
**Base URL:** `https://fstrack-gehqf3b4eqfed8aq.canadacentral-01.azurewebsites.net`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Authenticate with workspace, username, password |
| `/auth/my-workflow` | GET | Fetch venta/compra workflow codes for the user |
| `/log/mine` | GET | Fetch this user's submission audit log |

Authentication uses **Bearer tokens** stored in AsyncStorage under the key `fstrack_auth_user`.

### Finnegans ERP
**Base URL:** `https://api.finneg.com/api`

Forms are submitted to Finnegans using a short-lived token obtained by exchanging the FSTrack JWT. The token exchange happens transparently inside `utils/get-finnegans-token.ts`.

| Form type | Endpoint |
|-----------|----------|
| Producción | `/produccionLeche` |
| Nacimientos | `/NacimientosHacienda` |
| Muertes | `/MuerteHacienda` |
| Traslados | `/TrasladosHacienda` |
| Pedido Compra | `/pedidoCompra` |
| Pedido Venta | `/pedidoVenta` |

---

## Getting started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- For iOS: Xcode + iOS Simulator
- For Android: Android Studio + emulator, or a physical device with Expo Go

### Install

```bash
cd FSTrack
npm install
```

### Run

```bash
# Start dev server (choose platform in terminal)
npm start

# Run directly on a platform
npm run ios
npm run android
npm run web
```

### Build (production)

FSTrack uses EAS Build. Make sure you have the EAS CLI installed and are logged into the `bmerino` Expo account.

```bash
npm install -g eas-cli
eas build --platform android   # or ios / all
```

---

## Local database schema

The app maintains a local SQLite database (`fstrack.db`) with a single table:

```sql
CREATE TABLE submissions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  form_type     TEXT NOT NULL,   -- PRODUCCION | NACIMIENTOS | MUERTES | TRASLADOS | PEDIDO_COMPRA | PEDIDO_VENTA
  payload       TEXT NOT NULL,   -- JSON payload sent to Finnegans
  status        TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | SENT | ERROR
  company_label TEXT,
  created_at    TEXT NOT NULL,
  sent_at       TEXT,
  error_detail  TEXT
);
```

---

## Login

Users log in with three fields:

| Field | Description |
|-------|-------------|
| **Workspace** | The organisation's domain/slug |
| **Cuenta** | Username |
| **Password** | Password |

Sessions are persisted to AsyncStorage and restored automatically on app launch.

---

## Contributing

1. Make sure `npm run lint` passes before committing (`eslint-config-expo` rules).
2. The app uses **typed routes** (`experiments.typedRoutes: true`) — keep route strings type-safe.
3. Any new form type must be added to the `FormType` union in `utils/local-db.native.ts` and a corresponding endpoint added to `ENDPOINTS` in `contexts/SubmissionsContext.tsx`.
4. Test offline behaviour: put the device in airplane mode, submit a form, then restore connectivity and verify the Envíos tab syncs.
