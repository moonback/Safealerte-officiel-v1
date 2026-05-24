# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Safe Alert is a real-time crisis management application for coordinating searches for missing persons. It serves two audiences:
- **General public** (mobile-first PWA view) for citizen reporting
- **Crisis authorities** (desktop dashboard) for alert management and operational coordination

## Development Commands

```bash
# Start development server on http://localhost:3000
npm run dev

# Build for production
npm run build

# Run TypeScript type checking (no code generation)
npm run lint

# Clean build artifacts
npm run clean

# Preview production build
npm run preview
```

## Architecture Overview

### Frontend Structure
- **Screens** (`/src/screens/`): Route-based views (e.g., `AdminDashboardScreen.tsx`, `MapScreen.tsx`)
- **Components** (`/src/components/`): Reusable UI components (e.g., `MobileLayout.tsx`)
- **Hooks** (`/src/hooks/`): Custom hooks for data fetching and logic (e.g., `useAlerts.ts`)
- **Contexts** (`/src/contexts/`): React context providers (e.g., `AuthContext.tsx`)
- **Lib** (`/src/lib/`): External service configurations (e.g., `supabase.ts`)

### Key Features
1. **Responsive Design**: Auto-switches between mobile (citizen) and desktop (admin) views based on screen width
2. **Supabase Backend**: Uses PostgreSQL with Row Level Security (RLS) for authorization
3. **Real-time Updates**: Supabase Realtime Channels for live data synchronization
4. **Map Integration**: Leaflet/React-Leaflet with OpenStreetMap Nominatim geocoding
5. **Role-based Access**: Three user types - `citoyen`, `admin`, `membre_equipe`

### Database Schema
The schema is defined in `supabase-schema-phase-1.sql` with:
- User profiles linked to Supabase auth
- Alerts management with status and danger levels
- Citizen reports with geolocation
- Team-based chat system
- Storage buckets for media (avatars, alerts, reports)

## Conventions

### File Naming
- PascalCase for screen components (e.g., `AdminDashboardScreen.tsx`)
- camelCase for hooks and utilities
- UPPER_SNAKE_CASE for constants

### Code Style
- Use functional components with React Hooks
- TypeScript strict typing required
- Tailwind CSS for styling with Safe Alert color palette
- Error handling with try/catch blocks
- Conventional Commits for versioning

### Security
- Never hardcode API keys - use `import.meta.env`
- RLS policies enforce data access rules
- Storage policies control media access

## Common Development Patterns

### Adding New Routes
1. Add route in `App.tsx` with appropriate role guards
2. Create screen component in `/src/screens/`
3. Connect to Supabase via custom hook if needed

### Realtime Subscriptions
```typescript
// Example pattern for real-time updates
useEffect(() => {
  const channel = supabase
    .channel('alerts-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'alerts' },
      (payload) => {
        // Handle real-time update
      }
    )
    .subscribe();
  
  return () => channel.unsubscribe();
}, []);
```

### Data Fetching
Use custom hooks that wrap Supabase client operations:
```typescript
const { data, loading, error } = useAlerts();
```

## Important Notes

- The app adapts UI based on screen size (>1024px = desktop admin view)
- Admin routes are protected by role checks in routing
- Storage buckets must be manually created in Supabase Dashboard:
  - `avatars` (Public)
  - `alerts` (Public) 
  - `reports_media` (Private)
- HMR is disabled in production/AI Studio environments