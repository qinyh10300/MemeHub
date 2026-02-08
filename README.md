# DarkHorse Community Platform

A full-stack Web3 community platform featuring an on-chain DEX, gamified quests, prediction markets, yield vault, and social hub — built with Vue 3, Vite, and Tailwind CSS.

## Features

- **On-Chain DEX** — Real-time K-line charts, order book, market & limit orders, token vault (Pharos Atlantic Testnet)
- **Quests** — Create and join community challenges with DHC token rewards
- **Prediction Markets** — Bet on crypto trends, task outcomes, and community events
- **Yield Vault** — Stake tokens in an RWA-backed vault (8.2% APY)
- **Web3 Game** — Interactive campus adventure with a dance mini-game
- **Community Hub** — Social feed, leaderboard, and trending topics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 + scoped CSS/SCSS |
| Routing | Vue Router 4 |
| Blockchain | ethers.js 6 (Pharos Atlantic Testnet) |
| Charts | KlineCharts (candlestick), Chart.js + vue-chartjs |
| Icons | lucide-vue-next |
| Notifications | vue-sonner |

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MetaMask** (or any EVM wallet) — required for DEX trading features

### Install & Run

```bash
# Clone the repository
git clone <repo-url>
cd figma2code

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at **http://localhost:3000**.

### Build for Production

```bash
npm run build
```

Output goes to the `build/` directory. Serve it with any static file server:

```bash
npx serve build
```

## Project Structure

```
src/
├── abi/                    # Smart contract ABI (DEX)
├── assets/                 # Images, coin icons, brand assets
├── components/
│   ├── dex/                # DEX trading components
│   │   ├── KlineChart.vue      # Candlestick chart
│   │   ├── OrderBook.vue       # Bid/ask depth
│   │   ├── TradingPanel.vue    # Buy/sell forms
│   │   ├── LimitOrder.vue      # Open orders
│   │   ├── Coins.vue           # Token grid
│   │   ├── MarketList.vue      # Token list view
│   │   ├── Wallet.vue          # MetaMask connector
│   │   └── ...                 # Vault, assets, brand
│   ├── game/               # Web3 University Game
│   │   ├── GamePage.vue        # Game orchestrator
│   │   ├── CharacterSelection.vue
│   │   ├── CampusMap.vue
│   │   ├── DanceGame.vue
│   │   └── ...
│   ├── LandingPage.vue     # Home / marketing page
│   ├── Dashboard.vue       # User dashboard
│   ├── DexHomePage.vue     # DEX token overview
│   ├── DexTokenPage.vue    # DEX trading view
│   └── ...                 # Tasks, Predictions, Vault, Community
├── composables/            # Vue composables (useWallet)
├── lib/                    # DEX contract helpers, chain config
│   ├── dex.js                  # Contract read/write layer
│   ├── pharos.js               # Pharos chain config
│   ├── useDex.js               # DEX composable
│   └── mockData.js             # Mock data for community features
├── plugins/                # Vue plugins (DEX provider)
├── router/                 # Vue Router config
├── styles/                 # Global CSS
├── main.js                 # App entry point
└── App.vue                 # Root component
```

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Landing | Marketing page with feature showcase |
| `/dashboard` | Dashboard | User overview, stats, charts |
| `/dex` | DEX Home | Token grid/list with balances |
| `/dex/token/:address` | DEX Trading | K-line chart, order book, trading panel |
| `/tasks` | Quest Feed | Browse and join quests |
| `/tasks/create` | Create Quest | Publish a new quest |
| `/tasks/:id` | Quest Detail | Quest info, participants, proof |
| `/predictions` | Prediction Markets | Browse prediction markets |
| `/predictions/:id` | Market Detail | Place bets, view charts |
| `/vault` | Yield Vault | Deposit/withdraw, APY history |
| `/community` | Community Hub | Social feed, leaderboard |
| `/game` | Web3 Game | Interactive campus adventure |

## DEX Configuration

The DEX connects to the **Pharos Atlantic Testnet**:

| Setting | Value |
|---------|-------|
| Chain ID | `688689` |
| RPC URL | `https://atlantic.dplabs-internal.com` |
| Explorer | `https://atlantic.pharosscan.xyz` |
| DEX Contract | `0x887D9Af1241a176107d31Bb3C69787DFff6dbaD8` |

MetaMask will auto-prompt to add/switch to this network when you interact with DEX features.

## Deployment

### Static Hosting (Vercel, Netlify, etc.)

```bash
npm run build
```

Deploy the `build/` directory. For SPAs with client-side routing, configure a fallback to `index.html`:

**Netlify** — add `build/_redirects`:
```
/* /index.html 200
```

**Vercel** — add `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Docker

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    root /usr/share/nginx/html;
    location / {
        try_files $uri /index.html;
    }
}
EOF
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t darkhorse-community .
docker run -p 8080:80 darkhorse-community
```

## License

MIT
