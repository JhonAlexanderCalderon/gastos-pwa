# Gastos Pareja

PWA personal para que dos personas (pareja) lleven el control de gastos compartidos del hogar, con quién pagó qué, cuánto se debe cada uno y gastos fijos que se registran solos cada mes. No es una app genérica de finanzas: las categorías están hechas a la medida de las tiendas donde compran en Australia (Aldi, Coles, Woolworths, etc.), pensada para ingresar un gasto en el menor número de toques posible.

## Stack

- **React 19 + Vite** (`@vitejs/plugin-react`)
- **Tailwind CSS v4** (`@tailwindcss/vite`, sin `tailwind.config.js`, todo por utilidades)
- **react-router-dom** (rutas cliente, `BrowserRouter` con `basename` para GitHub Pages)
- **Firebase**: Auth (Google Sign-In) + Firestore (datos en tiempo real vía `onSnapshot`)
- **lucide-react**: set de íconos SVG (nada de emojis)
- **vite-plugin-pwa**: instalable como PWA, cache offline de Firestore vía Workbox

## Diseño

Paleta blanco + ámbar (`amber-500/600`) + negro (`gray-900`/`black`), estilo limpio tipo Google/Airbnb (headers blancos, acentos ámbar, sin bloques de color sólido). Las tiendas (Aldi, Coles, Woolworths, 7-Eleven, BWS, Kmart, Target) se representan como **badges circulares con el color de marca + inicial** (`src/components/ui/CategoryIcon.jsx`) — no se usan logos oficiales porque no hay assets disponibles ni deben inventarse URLs para descargarlos. El resto de categorías usa íconos de `lucide-react` sobre un fondo suave del color de la categoría.

## Categorías (`src/utils/categories.js`)

Agrupadas en `CATEGORY_GROUPS` para la grilla de selección:

- **Supermercado**: Aldi, Coles, Woolworths, Frutas y Verduras
- **Tiendas**: 7-Eleven, BWS, Kmart, Target
- **Gastos fijos y otros**: Ocio (con subtipo Comida/Servicio), Compras en línea, Gasolina, Renta, Servicio público, Otro

`getCategoryById` cae a "Otro" si el id no existe, así que gastos viejos con categorías descontinuadas se siguen mostrando sin romper nada.

## Moneda

Solo **AUD** (por defecto) y **COP** — ver `src/utils/currency.js`.

## Gastos programados (recurring)

Plantillas configurables desde Ajustes (categoría + monto + quién paga) que:

1. Se **auto-registran el día 1 de cada mes**, disparado desde `AppContext` (`src/context/AppContext.jsx`) apenas la app detecta la pareja cargada. La escritura usa un **ID determinístico** (`recurring_{id}_{month}`) para que sea idempotente: si ambos miembros abren la app el mismo día, no se duplica el gasto.
2. Se pueden **pagar con un solo toque** cualquier día desde la fila "Pagos rápidos" en Inicio (`payRecurringNow` en el contexto), útil sobre todo para Renta.

## Estructura de datos (Firestore)

```
users/{uid}                          — perfil (nombre, email, coupleId, currency)
couples/{coupleId}                   — user1Id, user2Id, nombres, currency, inviteCode
couples/{coupleId}/expenses/{id}     — amount, category, subtype?, paidBy, month, date, recurringId?
couples/{coupleId}/settlements/{mes} — cierre de mes (quién le debe a quién)
couples/{coupleId}/recurring/{id}    — plantilla de gasto programado (category, amount, payerId, active, lastAppliedMonth)
```

## Reglas de seguridad de Firestore

Viven en [`firestore.rules`](./firestore.rules) (versionadas en el repo) y se despliegan con:

```bash
npm install -g firebase-tools   # si no lo tienes
firebase login
firebase deploy --only firestore:rules
```

`.firebaserc` ya apunta al proyecto `gastos-pareja-ca457`. También puedes pegar el contenido de `firestore.rules` directo en Firebase Console → Firestore Database → Reglas.

Puntos clave de las reglas:
- Cada colección (`users`, `couples`, `expenses`, `settlements`, `recurring`) solo es accesible por los miembros de esa pareja (`isCoupleMember`).
- `expenses` permite `paidBy` de **cualquiera de los dos** miembros (`isValidPayer`), no solo de quien hace la petición — necesario porque un gasto programado puede aplicarse desde el dispositivo de cualquiera de los dos aunque el que "pague" sea el otro.

## Setup local

```bash
cp .env.example .env   # completa con los valores de tu app web en Firebase Console
npm install
npm run dev
```

Variables de entorno (`VITE_FIREBASE_*`) en Firebase Console → Configuración del proyecto → tus apps → SDK setup.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción (`dist/`)
- `npm run lint` — oxlint
- `npm run preview` — sirve el build de producción localmente

## Deploy

GitHub Pages vía `.github/workflows/deploy.yml`: en cada push a `main` corre `npm run build` (con los secrets `VITE_FIREBASE_*` del repo) y publica `dist/`. El `base` en `vite.config.js` está fijado a `/gastos-pwa/` para el subpath de Pages.
