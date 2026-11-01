# VisTube

VisTube is a video sharing platform built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
3. Run `npm run dev`.

`VITE_SUPABASE_PUBLISHABLE_KEY` is intended for browser use with Supabase Row Level Security enabled. Never put a service-role key or OAuth client secret in a `VITE_` variable.

## Supabase setup

The app connects to the `videohub` Supabase project. The browser client uses `@supabase/supabase-js` with PKCE, persisted sessions, and the publishable API key. The Supabase CLI is pinned as a development dependency; use `npx supabase migration list` to inspect local migration files.

Google OAuth is initiated by the `/auth` page. To complete the provider setup, create a Google OAuth **Web application** client, add its authorized JavaScript origins for local development and the eventual production site, then add the client ID and secret under Supabase **Authentication → Providers → Google**. Add `http://127.0.0.1:5173/auth/callback` and `http://localhost:5173/auth/callback` to Supabase's redirect URL allow list. Keep the Google client secret only in Supabase Auth settings; never place it in `.env.local` or a `VITE_` variable. The production redirect origin must be added after the `yt-web` Netlify site is created.

The auth-user trigger creates a profile for newly registered users. Video and thumbnail buckets are private; metadata stores `<channel-id>/<video-id>/<filename>` paths, and clients must request short-lived signed URLs for playback and display. The video bucket's current request size limit is 100 MB; resumable upload handling is a later phase.

Database migrations are in `supabase/migrations/`. The first two files capture the existing remote migrations, and the Phase 2 migration hardens their RLS and storage policies.

## Current implementation

VisTube includes the responsive application shell, Google OAuth entry and callback, account profile editing, channel management, a Supabase-backed public video feed, private Storage uploads, and signed-URL video playback.

## Video uploads

Signed-in users with a channel can upload MP4, MOV, or WebM files up to 100 MB and optional JPEG, PNG, WebP, or AVIF thumbnails up to 5 MB. Uploads are stored privately in Supabase Storage; video metadata and visibility are stored in Postgres. Public videos appear in the home feed and channel page, unlisted videos open by direct link, and private videos can be played only by their channel owner. The browser requests short-lived signed URLs under the Storage RLS policies.

The browser upload uses a single Storage upload request. A dedicated resumable upload flow for larger media and video transcoding/streaming are future work; the current bucket limit is 100 MB.

## Deployment

Netlify can build with `npm run build` and publish the `dist` directory. Configure the two `VITE_SUPABASE_*` variables in the site's environment settings. `netlify.toml` includes SPA route fallback behavior.

## Application structure

- `src/components`: shared layout and reusable interface components
- `src/pages`: route-level screens
- `src/auth`: session state and OAuth actions
- `src/lib`: Supabase browser client
- `supabase/migrations`: version-controlled database changes
- `netlify/functions`: privileged server operations if needed (later phase)

