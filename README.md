# PRISM — See your progress. Shape your future.

PRISM includes its brand, auth, database, dashboard, DSA and RL roadmaps, plus Aurora styling and working personal workspace pages.

## Setup
1. Create a Supabase project. In the SQL editor run, in order: `supabase/migrations/001_schema.sql`, `002_seed_rl_curriculum.sql`, `003_user_defaults.sql`, `004_workspace_pages.sql`.
2. Authentication → Providers: enable Email and Google. Add redirect URLs: `http://localhost:3000/auth/callback` and your Vercel URL + `/auth/callback`.
3. `cp .env.example .env.local` and fill in the project URL and anon key.
4. `npm install && npm run dev`
5. Deploy: push to GitHub, import in Vercel, add the same two env vars.

Accounts created before migration 003 need one-time seeding: `select public.seed_user_defaults('<your-user-uuid>');` (run in the SQL editor).

## What works now
Signup/login/Google/forgot/reset, persistent sessions, onboarding with avatar upload, RLS on user data, overview computed from real rows (focus hours, streak, habits, DSA, RL), daily ritual check-ins, DSA roadmap, and the 54-topic RL curriculum with personal progress/notes/hours. Aurora light and midnight blue themes combine ice blue, lavender and ocean colors with reduced-motion support.

Notes supports custom subjects, private file uploads and searchable saved notes. Focus Room records completed focus sessions. Rituals use the existing habits and daily logs. Reflections, fitness logs, Scaler/IITM coursework, AI Engineering milestones and Library resources are stored per-user. Insights summarizes workspace activity. Settings update the color mode, accent, focus lengths and daily focus goal.

## Database update
For an existing Supabase project, run `supabase/migrations/004_workspace_pages.sql` in the SQL editor to add the user-owned workspace entries table and private upload bucket policies. The app uses the existing public URL and anon key; no service-role key or new credentials are needed.
