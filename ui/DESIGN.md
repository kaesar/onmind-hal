# OnMind-HAL UI Design System

## Color Palette

### Primary (Blue / Slate)
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `blue-50` | `#eff6ff` | `#0f172a` | Page background |
| `blue-100` | `#dbeafe` | `#1e293b` | Card background |
| `blue-200` | `#bfdbfe` | `#334155` | Borders |
| `blue-300` | `#93c5fd` | `#475569` | Muted text, subtle elements |
| `blue-400` | `#60a5fa` | `#64748b` | Secondary text, container names |
| `blue-600` | `#2563eb` | `#3b82f6` | Primary actions, links |
| `blue-700` | `#1d4ed8` | `#60a5fa` | Button hover text |
| `blue-900` | `#1e3a5f` | `#e2e8f0` | Primary text |

### Dark Mode Surfaces (Slate)
| Token | Usage |
|-------|-------|
| `slate-900` | Page background |
| `slate-800` | Card background |
| `slate-700` | Card hover background |
| `slate-700` | Card border (default) |

### Status Colors
| Status | Dot | Badge BG | Badge Text | Badge Border |
|--------|-----|----------|------------|--------------|
| Running | `emerald-400` | `emerald-500/20` | `emerald-400` / `emerald-600` | `emerald-500/30` |
| Stopped | `red-400` | `red-500/20` | `red-400` / `red-600` | `red-500/30` |
| Restarting | `amber-400` | `amber-500/20` | `amber-400` / `amber-600` | `amber-500/30` |
| Unknown | `blue-400` | `blue-500/20` | `blue-400` / `blue-600` | `blue-500/30` |

### Action Button Colors
| Action | BG | Text | Hover BG | Hover Text (dark) |
|--------|----|------|----------|-------------------|
| Start | `emerald-50` / `emerald-900/50` | `emerald-600` / `emerald-300` | `emerald-100` / `emerald-900` | `emerald-200` |
| Stop | `red-50` / `red-900/50` | `red-600` / `red-300` | `red-100` / `red-900` | `red-200` |
| Restart | `amber-50` / `amber-900/50` | `amber-600` / `amber-300` | `amber-100` / `amber-900` | `amber-200` |

## Typography

- **Heading**: `text-3xl font-bold tracking-tight`
- **Subheading**: `text-lg font-semibold`
- **Body**: `text-sm` (base content)
- **Caption/mono**: `font-mono text-sm` (container names)
- **Badge**: `text-xs font-medium`
- **Timestamp**: `text-xs`

## Spacing & Layout

- **Page**: `max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8`
- **Card grid**: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Card padding**: `p-6`
- **Card gap to header**: `mb-8`
- **Section gap**: `mt-4`, `mt-5`

## Components

### ServiceCard
```
rounded-2xl border p-6 shadow-sm
transition-all hover:shadow-md
```
- Border: `border-blue-200` / `dark:border-slate-700`
- Background: `bg-white` / `dark:bg-slate-800`
- Hover border: `hover:border-blue-400` / `dark:hover:border-blue-500`
- Hover background: `hover:bg-blue-50/50` / `dark:hover:bg-slate-700`
- Hover shadow: `hover:shadow-md` / `dark:hover:shadow-lg dark:hover:shadow-blue-500/5`
- Icon container: `h-14 w-14 rounded-xl` with `service.color` at 8% opacity

### Buttons (Action)
```
flex flex-1 items-center justify-center gap-1.5
rounded-lg px-3 py-2 text-sm font-medium
transition cursor-pointer
disabled:cursor-not-allowed disabled:opacity-40
```

### Header Buttons (Start All / Refresh)
```
flex items-center gap-1.5 rounded-lg border
px-3 py-2 text-sm font-medium shadow-sm
transition cursor-pointer
disabled:cursor-not-allowed disabled:opacity-40
```
- Light: `border-blue-200 bg-white text-blue-700 hover:bg-blue-50`
- Dark: `dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800`
- Start All icon: `Play` (`h-3.5 w-3.5`)
- Refresh icon: `RefreshCw` (`h-3.5 w-3.5`)

### Theme Toggle
Same style as header buttons. Uses `Sun`/`Moon` icons from lucide-react.
Persist preference in `localStorage` key `hal-theme`.

### Status Badge
```
rounded-full border px-2.5 py-0.5 text-xs font-medium
```

### Status Dot
```
h-2 w-2 rounded-full
```

## Interactive States

- **Cursor**: All clickable elements use `cursor-pointer`
- **Disabled**: `disabled:cursor-not-allowed disabled:opacity-40`
- **Hover cards (light)**: `hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md`
- **Hover cards (dark)**: `dark:hover:border-blue-500 dark:hover:bg-slate-700 dark:hover:shadow-lg dark:hover:shadow-blue-500/5`
- **Hover buttons (light)**: `hover:bg-{color}-100`
- **Hover buttons (dark)**: `dark:hover:bg-{color}-900 dark:hover:text-{color}-200`

## Dark Mode

Toggle via `.dark` class on `<html>`. All colors have `dark:` counterparts.
Preference persisted in `localStorage` key `hal-theme`.

## Icons

Library: `lucide-react`
- Service icons: `h-7 w-7` inside `h-14 w-14` container
- Button icons: `h-3.5 w-3.5`
- Header icons: `h-4 w-4`
