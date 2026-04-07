# VLU Renting Project

Monorepo for a student rental platform with:

- **Client**: Next.js 16 + React 19 (`/client`)
- **Server**: NestJS 11 + TypeORM + PostgreSQL (`/server`)

## Repository structure

- `client/`: user-facing web application
- `server/`: REST API + WebSocket services
- `docs/`: project and thesis-related notes
- `*.puml`: architecture and UML diagrams

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL (for backend)


## Environment setup examples

Copy these templates before running locally:

```bash
cp server/.env.example server/.env
cp client/env.local.example client/.env.local
```

## Install dependencies

Install frontend and backend dependencies separately:

```bash
cd client && npm install
cd ../server && npm install
```

## Run locally

### 1) Start backend (NestJS)

```bash
cd server
npm run start:dev
```

### 2) Start frontend (Next.js)

```bash
cd client
npm run dev
```

Frontend default URL: `http://localhost:3000`

## Useful scripts

### Client (`client/`)

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run built app
npm run lint     # run eslint
```

### Server (`server/`)

```bash
npm run start:dev  # start dev server with watch
npm run build      # compile Nest app
npm run lint       # run eslint (with --fix)
npm run test       # unit tests
npm run test:e2e   # end-to-end tests
```

## Quick health checks

From each workspace, run these commands before opening a PR:

```bash
# frontend
cd client
npm run lint
npm run build

# backend
cd ../server
npm run lint
npm run build
```

## Notes

- Configure backend environment variables before running in development.
- Make sure the frontend points to the correct backend API URL.

## AI assistant setup

The rental chatbot now uses the backend as the only place that knows the OpenAI key.

1. Copy `server/.env.example` to `server/.env`
2. Set `OPENAI_API_KEY=...`
3. Keep `AI_PROVIDER=openai`
4. Keep `NEXT_PUBLIC_ENABLE_CLOUD_AI=true` in `client/.env.local`
5. Restart both server and client

If `OPENAI_API_KEY` is missing, the UI falls back to the local parser so the search assistant still works.

### Free local AI option with Ollama

If you want the chatbot to feel more like ChatGPT without using OpenAI credits, you can run a local model with Ollama:

1. Install Ollama
2. Pull a model such as `qwen2.5:7b` or `llama3.1:8b`
3. Set these values in `server/.env`

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
```

4. Restart the server

When Ollama is available, the chatbot uses a real local LLM instead of the scripted fallback.

For this project, "train the chatbot" is optional. The current setup works well by combining:

- prompt instructions
- live listing context from the database
- local fallback parsing

Use fine-tuning only after you have enough real chat examples and evals.

## AI fine-tuning scaffold

Starter assets are available for OpenAI fine-tuning prep:

- `ai/fine-tune/train.example.jsonl`
- `ai/fine-tune/validation.example.jsonl`
- `scripts/validate-finetune-jsonl.mjs`
- `docs/openai-readiness-checklist.md`

Run validation:

```bash
node scripts/validate-finetune-jsonl.mjs ai/fine-tune/train.example.jsonl
node scripts/validate-finetune-jsonl.mjs ai/fine-tune/validation.example.jsonl
```
