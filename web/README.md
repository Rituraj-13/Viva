# Viva — web app

The Next.js 16 App Router app for **Viva**, the oral exam for code.

Product, setup, environment, architecture, and deployment notes live in the
[repository README](../README.md). The short version:

```bash
cd viva
pnpm install
cp .env.example web/.env.local   # fill in Groq + Google keys
cd web
pnpm dev                         # http://localhost:3000
pnpm build                       # production build
```

The three scripted demo replays are at `/demo`; the live ingest is `/new`; a
completed owner session can be replayed from `/s/:id/replay`. Without a real
`DATABASE_URL`, sessions are stored locally in `.data/sessions.json`. With Neon,
the app creates the `viva_sessions` table on the first request.

Groq is the primary provider through the native `groq-sdk` Structured Outputs API.
Google is the automatic fallback. See the [repository README](../README.md) for
the full architecture, persistence model, privacy boundaries, and Vercel deploy
checklist.
