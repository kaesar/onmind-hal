# OnMind-HAL UI - Documentación Técnica

Panel de control de servicios claves para entornos de contenedores. Permite visualizar el estado de contenedores Podman/Docker y ejecutar acciones (start, stop, restart) desde una interfaz web. Evita el uso o definición de `.sock` de docker, facilitando una implementación estándar al invocar comandos directos de `docker` o `podman`.

Los servicios son preestablecidos o configurados en archivo `json`, actualmente: `caddy`, `rustfs`, `postgresql`, `redis`, `kafka`, `tinyauth`, `ntfy`, `cloudflared`.

## Stack Tecnológico

| Componente | Tecnología      | Versión |
|------------|-----------------|---------|
| Framework  | TanStack Start  | 1.168.x |
| Router     | TanStack Router | 1.170.x |
| State      | TanStack Query  | 5.101.x |
| UI         | React           | 19.2.x  |
| Estilos    | TailwindCSS     | 4.3.x   |
| Build      | Vite            | 8.1.3   |
| Server     | Nitro           | 3.0.x   |
| Runtime    | Bun             | 1.3.x   |

> Requiere Container Runtime como `docker` o `podman`

## Estructura de Carpetas

```
  _____
./ ui /
│
├── .env                                 # Variables de entorno (CONTAINER_RUNTIME)
├── vite.config.ts                       # Configuración Vite + TanStack Start
├── tsconfig.json                        # Configuración TypeScript
├── package.json                         # Dependencias y scripts
├── public/
│   └── data/
│       └── services.json                # Definición de servicios/contenedores
└── src/
    ├── router.tsx                       # Configuración del router
    ├── routeTree.gen.ts                 # Árbol de rutas (auto-generado)
    ├── styles/
    │   └── app.css                      # Estilos globales (TailwindCSS)
    ├── components/
    │   ├── DefaultCatchBoundary.tsx     # Boundary de errores
    │   └── NotFound.tsx                 # Página 404
    └── routes/
        ├── __root.tsx                   # Layout raíz (HTML, QueryClient)
        ├── index.tsx                    # Redirect a /dashboard
        ├── dashboard.tsx                # Dashboard principal
        └── api/
            ├── services.index.ts        # GET /api/services
            └── services.$id.$action.ts  # POST /api/services/:id/:action
```

## Flujo de Arranque

### 1. Inicialización de Vite

```typescript
// vite.config.ts
export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({ srcDirectory: "src" }),
    viteReact(),
    nitro(),
  ],
});
```

**Proceso:**
1. Vite carga los plugins en orden: TailwindCSS → TanStack Start → React → Nitro
2. TanStack Start genera el árbol de rutas desde `src/routes/`
3. Nitro configura el servidor SSR

### 2. Root Route (`__root.tsx`)

```typescript
export const Route = createRootRoute({
  head: () => ({
    meta: [...],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }) {
  return (
    <html>
      <head><HeadContent /></head>
      <body className="bg-blue-50 text-blue-900">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

**Responsabilidades:**
- Configurar meta tags y links globales
- Proveer `QueryClientProvider` para TanStack Query
- Envolver toda la app con el layout HTML

### 3. Redirect Inicial

```typescript
// routes/index.tsx
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
```

## Flujo de las Tarjetas de Servicios

### 1. Carga de Datos

```typescript
// dashboard.tsx
const { data, isLoading, error } = useQuery({
  queryKey: ["services"],
  queryFn: fetchServices,  // GET /api/services
});
```

**Flujo:**
1. React Query ejecuta `fetchServices()` al montar el componente
2. `fetchServices()` hace `fetch("/api/services")`
3. El servidor ejecuta el endpoint `services.index.ts`
4. El endpoint lee `services.json` y ejecuta `podman inspect` para cada contenedor
5. Retorna JSON con servicios y sus estados reales

### 2. Renderizado de Tarjetas

```typescript
{data?.services.map((service) => (
  <ServiceCard
    key={service.id}
    service={service}
    onAction={(action) => handleAction(service.id, action)}
    isPending={mutation.isPending}
  />
))}
```

### 3. Componente ServiceCard

```typescript
function ServiceCard({ service, onAction, isPending }) {
  const Icon = getServiceIcon(service.icon);
  
  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-6">
      {/* Icono del servicio */}
      <Icon style={{ color: service.color }} />
      
      {/* Badge de estado */}
      <span className={getStatusColor(service.status)}>
        {service.status}
      </span>
      
      {/* Nombre y contenedor */}
      <h3>{service.name}</h3>
      <p className="font-mono">{service.container}</p>
      
      {/* Botones de acción */}
      <button onClick={() => onAction("start")}>Start</button>
      <button onClick={() => onAction("stop")}>Stop</button>
      <button onClick={() => onAction("restart")}>Restart</button>
    </div>
  );
}
```

### 4. Colores por Estado

| Estado | Color Badge | Color Dot |
|--------|------------|-----------|
| running | `bg-emerald-500/20 text-emerald-400` | `bg-emerald-400` |
| stopped | `bg-red-500/20 text-red-400` | `bg-red-400` |
| restarting | `bg-amber-500/20 text-amber-400` | `bg-amber-400 animate-pulse` |
| unknown | `bg-blue-500/20 text-blue-400` | `bg-blue-400` |

### 5. Acciones y Recheck

```typescript
const mutation = useMutation({
  mutationFn: ({ id, action }) => executeAction(id, action),
  
  onMutate: async ({ id, action }) => {
    // Optimistic update: cambiar estado localmente
    queryClient.setQueryData(["services"], (old) => ({
      ...old,
      services: old.services.map((s) =>
        s.id === id ? { ...s, status: action === "stop" ? "stopped" : "restarting" } : s
      ),
    }));
  },
  
  onSettled: () => {
    // Recheck después de 6s y 12s
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["services"] }), 6000);
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["services"] }), 12000);
  },
});
```

**Flujo de acción:**
1. Usuario presiona Start/Stop/Restart
2. Se ejecuta `POST /api/services/:id/:action`
3. Optimistic update cambia el estado localmente
4. El servidor ejecuta `podman start/stop/restart <container>`
5. After 6s: recheck automático
6. After 12s: segundo recheck

## Configuración Esencial

### Variables de Entorno

```bash
# .env
CONTAINER_RUNTIME=podman  # o "docker"
```

### Estructura de datos: services.json

```json
{
  "services": [
    {
      "id": "caddy",
      "name": "Caddy",
      "container": "caddy",      // Nombre del contenedor en Podman
      "icon": "caddy",           // Clave para el ícono Lucide
      "status": "stopped",       // Estado inicial (se sobreescribe con inspect)
      "color": "#1d4ed8"       // Color del ícono
    }
  ]
}
```

### Mapeo de Íconos

```typescript
const iconMap = {
  postgresql: Database,
  redis: Server,
  rustfs: Box,
  kafka: Radio,
  tinyauth: Shield,
  ntfy: Bell,
  cloudflared: Cloud,
  caddy: Shield,
  default: Zap,
};
```

## API Endpoints

### GET /api/services

Retorna todos los servicios con su estado actual.

```typescript
// services.index.ts
const runtime = process.env.CONTAINER_RUNTIME || "docker";
const { stdout } = await execAsync(
  `${runtime} inspect --format='{{.State.Status}}' ${container}`
);
```

### POST /api/services/:id/:action

Ejecuta una acción sobre un contenedor.

```typescript
// services.$id.$action.ts
const cmd = `${runtime} ${action} ${container}`;
await execAsync(cmd);
// Ejemplo: "podman start caddy"
```

## Scripts

```bash
bun run dev      # Iniciar servidor de desarrollo (puerto 3000)
bun run build    # Build para producción
bun run preview  # Vista previa del build
bun run start    # Iniciar servidor producción
```
