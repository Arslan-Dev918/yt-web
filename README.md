# YT Web

YT Web is a video sharing platform foundation built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set the Supabase project URL and publishable key.
3. Run `npm run dev`.

`VITE_SUPABASE_PUBLISHABLE_KEY` is intended for browser use with Supabase Row Level Security enabled. Never put a service-role key or OAuth client secret in a `VITE_` variable.

## Current foundation

The first phase establishes the responsive application shell, navigation, category strip, video grid, and initial route structure. The home feed currently uses presentation fixtures; interactive platform data and actions are not connected yet. Supabase authentication, data queries, storage policies, and upload flows are planned for later phases.

## Deployment

Netlify can build with `npm run build` and publish the `dist` directory. Configure the two `VITE_SUPABASE_*` variables in the site's environment settings. `netlify.toml` includes SPA route fallback behavior.

## Planned application structure

- `src/components`: shared layout and reusable interface components
- `src/pages`: route-level screens
- `src/services`: Supabase access and domain operations (next phase)
- `supabase/migrations`: version-controlled database changes (next phase)
- `netlify/functions`: privileged server operations if needed (later phase)
