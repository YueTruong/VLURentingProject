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
