# ContextMesh — Full Stack Implementation Plan

Implementing the complete ContextMesh platform: a shared AI memory layer for engineering teams. The existing frontend has a polished landing page; we need to add Create Team, Login, Dashboard pages, then build the FastAPI backend, Master Context Engine, and MCP Server.

## Proposed Changes

### Phase 1: Frontend Flows (Starting Now)

#### [MODIFY] [Navbar.tsx](file:///z:/Impetus%202026%20context%20project/context-mesh-hub/src/components/Navbar.tsx)
- Add **"Enter Team"** (dark outlined pill) and **"Create Team"** (violet filled pill) buttons to the right side of the navbar, next to existing CTA.

#### [MODIFY] [HeroSection.tsx](file:///z:/Impetus%202026%20context%20project/context-mesh-hub/src/components/HeroSection.tsx)
- Add the same two buttons below the existing CTA buttons in a slightly smaller size.
- Add helper text: *"Already have a passcode? Enter your team →"*

#### [NEW] [CreateTeamModal.tsx](file:///z:/Impetus%202026%20context%20project/context-mesh-hub/src/components/CreateTeamModal.tsx)
- **3-step glassmorphic modal** over landing page:
  1. **Team Name** — input with validation (min 3 chars)
  2. **Your Name** — input with "You will be the team admin" note
  3. **Success** — shows generated Team ID (slugified) + Passcode (WORD-NN-WORD format), copy button, "Go to Dashboard →"
- Stores team data in `localStorage` (until backend connected)
- Passcode generated client-side using random word list

#### [NEW] [EnterTeamModal.tsx](file:///z:/Impetus%202026%20context%20project/context-mesh-hub/src/components/EnterTeamModal.tsx)
- **Single-step modal** with passcode + name inputs
- Validates passcode against `localStorage` stored team
- On success: adds member, redirects to `/dashboard`
- On fail: red error with "Incorrect passcode" message

#### [NEW] [Dashboard.tsx](file:///z:/Impetus%202026%20context%20project/context-mesh-hub/src/pages/Dashboard.tsx)
- **3-panel layout**:
  - **Left**: Team members list from localStorage, status dots, hover actions (View Context, Load into AI)
  - **Center**: Context feed with entry cards (Raw Chat, Decision, Task Complete, Open Question, Conflict), Mode 1 toggle, 🔒 mark private
  - **Right**: Master Context panel — decisions, open questions, conflicts, context health donut chart
- **Header**: Logo, team name, current user + logout

#### [MODIFY] [App.tsx](file:///z:/Impetus%202026%20context%20project/context-mesh-hub/src/App.tsx)
- Add `/dashboard` route pointing to [Dashboard.tsx](file:///z:/Impetus%202026%20context%20project/context-mesh-hub/src/pages/Dashboard.tsx)

---

### Phase 2: Backend (FastAPI + PostgreSQL)

#### [NEW] `contextmesh-backend/` — entire backend project
- [main.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/main.py) — FastAPI entry point with CORS
- [db/database.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/db/database.py) — PostgreSQL connection via SQLAlchemy
- [db/models.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/db/models.py) — 4 tables: teams, members, context_sessions, master_context
- [db/schemas.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/db/schemas.py) — Pydantic request/response models
- [routers/auth.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/routers/auth.py) — POST `/auth/create-team`, POST `/auth/join-team`
- [routers/context.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/routers/context.py) — POST `/context/save`, GET `/context/member`, PATCH `/context/session/{id}/private`
- [routers/master.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/routers/master.py) — GET `/master-context`
- [services/passcode.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/services/passcode.py) — WORD-NN-WORD generation + bcrypt hashing
- [.env](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/.env) template, [requirements.txt](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/requirements.txt)

---

### Phase 3: Master Context Engine

#### [NEW] [contextmesh-backend/services/aggregator.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/services/aggregator.py)
- LangChain + Claude API pipeline to synthesize Master Context from all non-private sessions
- Structured JSON output: decisions, in_progress, open_questions, conflicts

#### [NEW] [contextmesh-backend/services/conflict.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/services/conflict.py)
- Embedding similarity check for pairwise conflict detection

#### [NEW] [contextmesh-backend/scheduler.py](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/scheduler.py)
- APScheduler running aggregation every 30 minutes

---

### Phase 4: MCP Server (Node.js + TypeScript)

#### [NEW] `contextmesh-mcp/` — entire MCP server project
- [src/index.ts](file:///z:/Impetus%202026%20context%20project/contextmesh-mcp/src/index.ts) — main MCP server registering all 4 tools
- [src/tools/getMasterContext.ts](file:///z:/Impetus%202026%20context%20project/contextmesh-mcp/src/tools/getMasterContext.ts), [saveContext.ts](file:///z:/Impetus%202026%20context%20project/contextmesh-mcp/src/tools/saveContext.ts), [loadPeerContext.ts](file:///z:/Impetus%202026%20context%20project/contextmesh-mcp/src/tools/loadPeerContext.ts), [markPrivate.ts](file:///z:/Impetus%202026%20context%20project/contextmesh-mcp/src/tools/markPrivate.ts)
- [src/api.ts](file:///z:/Impetus%202026%20context%20project/contextmesh-mcp/src/api.ts) — Axios client for backend communication
- Platform config examples for Cursor, Claude Code, Codex, Cline

---

### Phase 5: Integration
- Replace all frontend `localStorage` calls with real API `fetch()` calls to backend
- Wire MCP server to backend via [api.ts](file:///z:/Impetus%202026%20context%20project/contextmesh-mcp/src/api.ts)

## Verification Plan

### Browser Testing (Phase 1)
1. **Landing page**: Run `npm run dev` in `context-mesh-hub`, open browser at `http://localhost:8080`
   - Verify "Enter Team" and "Create Team" buttons appear in navbar and hero
2. **Create Team flow**: Click "Create Team" → enter team name → enter admin name → verify success screen shows Team ID + Passcode
3. **Enter Team flow**: Click "Enter Team" → enter passcode + name → verify redirect to `/dashboard`
4. **Dashboard**: Verify 3-panel layout renders with team data from localStorage

### Backend Testing (Phase 2)
- Run `uvicorn main:app --reload --port 8000`
- Test via FastAPI Swagger auto-docs at `/docs`
- Hit each endpoint and verify responses

### Manual End-to-End Test
- User verifies full flow: Create team → share passcode → join team → see dashboard

---

## Phase 6: CLI Onboarding Tool (ContextMesh CLI)

**Goal:** Allow developers to install and connect to ContextMesh in under 30 seconds via a single terminal command (`npx contextmesh`), automating the tedious MCP configuration.

### Architecture
- **NPM Package**: A globally installable CLI built with Node.js (`commander`, `inquirer`/`prompts`, `chalk`).
- **Local Storage**: Stores credentials at `~/.contextmesh/config.json`.
- **MCP Auto-Config**: Modifies IDE JSON configuration files to point to the local ContextMesh MCP server.
- **Embedded MCP Server**: The CLI explicitly contains the MCP server code, so running `contextmesh start` acts as the MCP transport hook for IDEs.

### Directory Structure (`contextmesh-cli/`)
```
contextmesh-cli/
├── bin/
│   └── cli.js            # Entry point mapped in package.json "bin"
├── src/
│   ├── commands/
│   │   ├── _default.js   # Onboarding flow
│   │   ├── start.js      # MCP server runner
│   │   ├── status.js     # Health check
│   │   ├── doctor.js     # Diagnostics
│   │   └── logout.js     # Clear config
│   ├── utils/
│   │   ├── config.js     # ~/.contextmesh/config.json manager
│   │   ├── api.js        # Backend fetch wrappers
│   │   └── mcp-auto.js   # IDE config injectors
│   └── mcp/
│       └── server.js     # The actual MCP server logic (tools)
├── package.json
└── tsconfig.json
```

### Configuration Structure (`~/.contextmesh/config.json`)
```json
{
  "teamId": "beta-team",
  "memberId": "Beta Admin",
  "token": "YOUR_JWT_TOKEN",
  "backendUrl": "http://localhost:8000"
}
```

### Auto-Configuration Method for IDEs
The CLI (`mcp-auto.js`) will detect OS and known paths to IDE config files, parse the JSON, inject the ContextMesh server, and overwrite smoothly.
1. **Cursor**: Reads/Writes `~/.cursor/mcp.json` or `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json` (or standard `mcp.json`).
2. **Claude Code**: Modifies `~/.claude/claude_desktop_config.json`.
3. **Antigravity**: Modifies `<project-root>/.gemini/settings.json` or a global Antigravity config path.

The injected payload will look like:
```json
"contextmesh": {
  "command": "npx",
  "args": ["contextmesh", "start"],
  "env": {} 
}
```
*(No need for env vars since `contextmesh start` will automatically read them from `~/.contextmesh/config.json`!)*

### Required Backend Changes
- The existing `/auth/join-team` endpoint already accepts [passcode](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/services/passcode.py#24-27) and `member_name`, outputting `team_id`.
- **Change**: Ensure `/auth/join-team` returns an auth `token` (could just be a basic hashed secret for MVP or JWT) that the CLI saves to authenticate MCP calls.
- **Change**: All MCP tool calls sent to the backend `/context/*` routes should extract this token from `Authorization: Bearer <token>` for security.

### Example Developer Workflow
1. Developer runs `npx contextmesh` in terminal.
2. Prompts: 
   - `Enter your Team Passcode:` -> user types `ALPHA-34-NEBULA`
   - `Enter your name:` -> user types `Arjun`
3. CLI connects to backend (e.g. `http://localhost:8000/auth/join-team`), verifies passcode, gets token.
4. CLI saves `~/.contextmesh/config.json`.
5. CLI detects IDEs (Cursor installed, Antigravity installed) and writes the MCP config block into them.
6. CLI outputs: `✅ ContextMesh configured for Cursor and Antigravity! Restart your IDEs.`
7. In the background (or prompted by the IDE), `npx contextmesh start` spins up and serves the tools ([save_context](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/routers/context.py#16-46), [get_master_context](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/routers/master.py#24-86)...) to the AI assistant securely.
