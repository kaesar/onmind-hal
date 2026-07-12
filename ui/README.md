# HAL-UI

Service control dashboard for container environments. Visualize Podman/Docker container status and execute actions (start, stop, restart) from a web interface.

> Services to manage: `caddy`, `rustfs`, `postgresql`, `redis`, `kafka`, `pocketid`, `ntfy`, `cloudflared`.

## Features

- Responsive grid of cards with icons and real-time status
- Container control: Start, Stop, Restart
- Automatic runtime detection (Podman/Docker)
- Design with TailwindCSS v4
- SSR with TanStack Start + React 19

## Stack

- **Framework**: TanStack Start (React + Vite + Nitro)
- **Router**: TanStack Router (file-based)
- **State**: TanStack Query (fetching + caching)
- **UI**: React 19 + TailwindCSS v4
- **Runtime**: Bun

> It requires Container Runtime like `docker` or `podman`

## Project Structure

```
  _____
./ ui /
├── .env                              # CONTAINER_RUNTIME=podman
├── vite.config.ts                    # Vite configuration
├── public/data/services.json         # Service definitions
└── src/
    ├── router.tsx                    # Router config
    ├── styles/app.css                # TailwindCSS
    ├── components/                   # Reusable components
    │   ├── DefaultCatchBoundary.tsx
    │   └── NotFound.tsx
    └── routes/
        ├── __root.tsx                # Root layout
        ├── index.tsx                 # Redirect → /dashboard
        ├── dashboard.tsx             # Main dashboard
        └── api/
            ├── services.index.ts     # GET /api/services
            └── services.$id.$action.ts  # POST /api/services/:id/:action
```

## Key Files

| File | Description |
|------|-------------|
| `vite.config.ts` | Vite plugin configuration (TanStack Start, TailwindCSS, Nitro) |
| `.env` | `CONTAINER_RUNTIME` variable for Podman/Docker |
| `public/data/services.json` | List of containers to monitor |
| `src/routes/__root.tsx` | HTML layout, QueryClient provider, global styles |
| `src/routes/dashboard.tsx` | Main component with cards and actions |
| `src/routes/api/services.index.ts` | API that queries status via `podman inspect` |
| `src/routes/api/services.$id.$action.ts` | API that executes `podman start/stop/restart` |

## Quick Start

```bash
# Install dependencies
bun install

# Configure runtime (in .env)
echo "CONTAINER_RUNTIME=podman" > .env

# Start server
bun run dev
```

Open http://localhost:3000

## API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/services` | List services with current status |
| POST | `/api/services/:id/start` | Start container |
| POST | `/api/services/:id/stop` | Stop container |
| POST | `/api/services/:id/restart` | Restart container |
