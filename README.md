# TalentPilot — Talent Pool (Next.js + Supabase)

## Deploy (no code needed)

1) Create a GitHub repo and upload this folder.
2) In Vercel: New Project → import the repo.
3) Add these environment variables in Vercel Project Settings → Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL = https://kkjljzfabkwvovkvmlqm.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = (your anon key)
4) Deploy. Done.

## Local (optional)
- Create `.env.local` with the two env vars above.
- `npm install`
- `npm run dev`
