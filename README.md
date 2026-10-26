# Viva

## The oral exam for code

**Viva turns a code file into a five-question engineering interview.** Paste a file
or choose one from a public GitHub repository, explain it out loud with Wispr Flow,
and receive a scorecard with exact quotes, line references, adaptive follow-ups, and
clear improvement areas.

> **If you can build it, can you speak it?**

Built for **WeMakeDevs × Wispr Flow — No Hands: The Wispr Challenge** (Builders
track).

| | |
|---|---|
| **Live app** | [viva-oral-exam.vercel.app](https://viva-oral-exam.vercel.app) |
| **Scripted replays** | [Open the demo gallery](https://viva-oral-exam.vercel.app/demo) |
| **Submission** | [`SUBMISSION.md`](./SUBMISSION.md) |
| **Product brief** | [`PRD.md`](./PRD.md) |
| **Prompt and schema notes** | [`prompts.md`](./prompts.md) |

---

## Why Viva?

Most code tools explain code *to* you. Viva asks whether **you** can explain it:
where the responsibility ends, why a design choice exists, what fails first, and
what you would change.

The code stays visible while the interview moves through five deliberate rungs:

1. **Comprehension** — what the file does and where its responsibility stops.
2. **Decision** — the structural choice that shaped it and the alternative it beat.
3. **Failure** — the first real failure path, anchored to the line where it begins.
4. **Change** — a concrete new requirement, edge case, or load increase.
5. **Ownership** — one non-trivial line: why it exists, what breaks without it,
   and how to test it.

When an answer is vague, Viva asks an evidence-based follow-up. The session is
bounded at five main questions, up to two probes per question, and eight total
turns—enough pressure to reveal reasoning without turning the experience into an
endless interrogation.

### What the report gives you

- Four signals: **correctness, depth, ownership, and clarity**.
- An exact quote from the answer behind each axis.
- The code line range used as evidence.
- A dedicated **confident but wrong** signal when a confident claim contradicts
  the code.
- **Key improvement areas** written as practical coaching, not generic advice.
- A complete transcript and a shareable, redacted public report.
- A replay of the finished viva, so the reasoning can be reviewed like a film.

Viva is an assistive signal—not a hiring verdict. It does not score accent,
grammar, or English fluency.

---

## Voice without a microphone pipeline

Wispr Flow is the input layer. Flow types into the focused answer box exactly as it
would into any other field.

Viva:

- requests **no microphone permission**;
- records and stores **no audio**;
- stores the transcript as text;
- validates every report quote as an exact substring of that transcript.

This keeps the product compatible with the challenge while keeping the data model
simple, inspectable, and privacy-conscious.

---

## Try it

### Scripted replay first

Open [`/demo`](https://viva-oral-exam.vercel.app/demo) to watch three authored
sessions without a microphone, API key, or model call. Replays include:

- a strong explanation;
- a partial explanation with a meaningful probe;
- a confident-but-wrong answer.

They are deterministic and always available—even when a provider is rate-limited.

### Run a live viva

1. Open `/new`.
2. Choose a public GitHub repository and file, or paste code directly.
3. Answer the five questions with Wispr Flow or by typing.
4. Follow the adaptive probes when Viva pushes deeper.
5. Review the report, replay the completed viva, or share the redacted report.

---

## Local development

### Requirements

- Node.js **22 or newer**
- pnpm **9 or newer**
- A Groq API key for the primary provider
- A Google AI Studio key for fallback behavior
- Optional: a Neon Postgres connection string

### Install and run

```bash
cd viva
pnpm install
cp .env.example web/.env.local
```

Fill in `web/.env.local`:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
MODEL_FALLBACK=openai/gpt-oss-120b
MODEL_SMART=gemini-3.8-flash
```

For the simplest local setup, leave `DATABASE_URL` empty or set it to the
placeholder in `.env.example`. Sessions will be written to
`web/.data/sessions.json`.

Start the app:

```bash
cd web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint .
pnpm build
pnpm start
```

The three replay sessions are available at `/demo`; live ingestion starts at
`/new`.

---

## Configuration

Copy [`./.env.example`](./.env.example) to `web/.env.local`. All provider keys
are server-only and must never be exposed to the browser or committed.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon/Postgres connection string. Empty or placeholder uses the local JSON store. |
| `AI_PROVIDER` | Provider order: `groq`, `google`, or `anthropic`. |
| `GROQ_API_KEY` | Primary Groq credential. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini fallback credential. |
| `MODEL_FALLBACK` | Groq model; defaults to `openai/gpt-oss-120b`. |
| `MODEL_SMART` | Google model; defaults to `gemini-3.8-flash`. |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Optional reserve provider. |
| `ALLOW_CLAUDE_FALLBACK` | Enables the Anthropic reserve when set to `true`. |
| `GITHUB_TOKEN` | Optional; raises GitHub API access from 60 to 5,000 requests/hour. |
| `NEXT_PUBLIC_APP_URL` | Canonical app origin. |
| `VIVA_DATA_DIR` | Optional directory for the local JSON store. |
| `MAX_SESSIONS_PER_DAY` | Per-anonymous-browser live-session limit; default 20. |
| `MAX_LIVE_SESSIONS_PER_DAY` | Global live-session limit; default 20. |
| `MAX_TURNS_PER_HOUR` | Per-anonymous-browser turn limit; default 60. |

The limits are rolling windows, not midnight-reset counters. The anonymous browser
cookie is used for ownership and quota checks; there is no login system.

---

## AI architecture

### Provider strategy

Groq is the primary provider because it won the latency bake-off. Google is the
automatic fallback, and Anthropic is an optional reserve.

Groq uses the **native `groq-sdk`** with Groq Structured Outputs:

```ts
response_format: {
  type: "json_schema",
  json_schema: {
    name: "evaluation",
    strict: true,
    schema: ...
  }
}
```

The Zod schemas are converted to JSON Schema and validated again after the response
arrives. Strict mode requires every property to be required, which keeps provider
responses predictable in production.

Google and Anthropic use the AI SDK structured-output adapter. Every provider has a
bounded retry path with explicit error logs. If all configured providers fail,
deterministic heuristics still produce a usable ladder, evaluation, and report
rather than a broken session.

### What is model-generated?

- The question ladder is model-generated and line-anchored.
- Each answer is evaluated against a focused excerpt rather than an unnecessarily
  large file payload.
- Evaluations include axis scores, an exact answer quote, missing concepts, and a
  follow-up when useful.
- The final report’s scores, evidence, band, axes, and improvement areas are owned
  by application code.

The report’s closing copy is deliberately conservative: the system does not ask a
second model to invent a narrative from scratch. Evidence is computed first, then
rendered into a report.

---

## Data model and persistence

With a valid `DATABASE_URL`, the app uses Neon Postgres through
`@neondatabase/serverless`. The first request creates the table automatically—no
migration command is required.

All session data is stored in:

```text
viva_sessions.data  -- JSONB containing the complete SessionData object
```

That JSON includes the source code, questions, answers, evaluations, probes, report,
timestamps, and model labels. The table also stores indexed identity and lifecycle
fields:

```text
id, slug, anon_id, status, created_at, updated_at
```

Relevant routes:

```text
POST /api/sessions              Create a session and generate the ladder
POST /api/sessions/:id/turns   Grade an answer and optionally create a probe
POST /api/sessions/:id/finish  Persist the deterministic final report
GET  /api/reports/:slug        Return a redacted public report
DELETE /api/sessions/:id       Delete an owned session
GET  /api/health               Show store and configured providers
```

For local development without Postgres, the same data shape is stored at
`web/.data/sessions.json`. This file store is not durable on Vercel; production must
use Neon.

---

## Security and privacy boundaries

- Private session routes require the anonymous owner cookie.
- Public report routes expose a redacted report, not private expected points,
  red flags, evaluations, or anonymous identity.
- The source code is treated as untrusted prompt data; instructions inside a code
  file are not followed.
- User answers are bounded and quotes are checked before entering a report.
- Delete removes the stored session and its public report.
- API keys remain server-side.

---

## Deploy to Vercel

The linked production app is deployed from `web/`, which has its own
`package.json` and `pnpm-lock.yaml`.

1. Create or claim a Neon project and copy its pooled connection string.
2. Create a Vercel project for `web/`.
3. Add these **Production** variables:
   ```text
   DATABASE_URL
   AI_PROVIDER=groq
   GROQ_API_KEY
   GOOGLE_GENERATIVE_AI_API_KEY
   MODEL_FALLBACK=openai/gpt-oss-120b
   MODEL_SMART=gemini-3.8-flash
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   MAX_SESSIONS_PER_DAY=20
   ```
4. Deploy:
   ```bash
   cd viva/web
   pnpm dlx vercel login
   pnpm dlx vercel --prod
   ```
5. Verify:
   ```bash
   curl https://your-domain.vercel.app/api/health
   ```

Expected health output includes:

```json
{
  "ok": true,
  "store": "postgres",
  "llm": [
    "groq:openai/gpt-oss-120b",
    "google:gemini-3.8-flash"
  ]
}
```

The health endpoint confirms configuration, not that a provider has remaining
quota. For provider failures, inspect Vercel Function Logs while creating a new
session. The app logs the provider, retry attempt, error name, message, and cause.

---

## Engineering trade-offs

| Decision | Why |
|---|---|
| One focused file per viva | Keeps the interview concrete and the evidence auditable. |
| Text input through Wispr Flow | No audio retention or transcription pipeline is needed. |
| Strict structured output for Groq | Prevents malformed provider responses from reaching scoring code. |
| Deterministic report scoring | Evidence and scores should not change because a second model phrased them differently. |
| JSONB session document | The full transcript and report evolve together while indexes cover lookup paths. |
| Scripted replays | Judges can experience the product without credentials, microphone access, or model quota. |
| Anonymous cookie ownership | Fast, frictionless hackathon UX without pretending to provide full account security. |

---

## Known limits

- One file per session; this is an oral code exam, not a repository-wide review.
- GitHub ingestion supports public repositories; paste is the universal fallback.
- Free provider quotas can still be exhausted. Scripted replays remain available.
- Clearing the anonymous cookie can make a private session inaccessible from that
  browser.
- Viva is an assistive signal, not a hiring decision.

---

## Project layout

```text
viva/
├── web/
│   ├── src/app/                 Next.js routes and API handlers
│   ├── src/components/          Ingest, viva, replay, and report UI
│   ├── src/lib/ai/              Providers, schemas, ladder, evaluation
│   ├── src/lib/store.ts         Neon/Postgres and local JSON persistence
│   ├── src/fixtures/seeds.ts    Deterministic scripted replay sessions
│   └── package.json
├── bakeoff/                     Provider quality/latency comparison
├── .env.example                 Environment template
├── PRD.md                       Product brief
├── prompts.md                   Prompt and schema notes
└── SUBMISSION.md                Hackathon submission copy
```

---

## The one-line pitch

> **Viva is a voice-first oral exam for code: five questions, exact receipts, and
> enough pressure to tell whether the understanding is real.**
