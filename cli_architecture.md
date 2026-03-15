# ContextMesh CLI Architecture & Implementation Plan

**Objective:** A professional, globally distributed NPM package (`contextmesh`) that allows developers to install, authenticate, and configure ContextMesh in under 30 seconds with a single command.

---

## 1. Full Architecture of the CLI System

The CLI acts as the bridge between the developer's local environment (IDEs), the ContextMesh Backend, and the MCP protocol.

- **Distribution:** Hosted on NPM. Installed globally via `npm install -g contextmesh` or run dynamically via `npx contextmesh`.
- **Framework:** Node.js with `commander` (for routing commands), `inquirer` or `@clack/prompts` (for beautiful terminal UI), `chalk` (for coloring), and `axios` (for API calls).
- **State Management:** Credentials and configurations are stored locally in the home directory (`~/.contextmesh/config.json`).
- **Embedded MCP Server:** The CLI package will *bundle* the MCP server logic within it. The `contextmesh start` command will execute the MCP StdioServerTransport, exposing the tools.
- **Auto-Configurator:** A utility script that detects installed IDEs, locates their MCP configuration files, and dynamically injects the `contextmesh start` payload.

---

## 2. Directory Structure for the NPM Package

```text
contextmesh-cli/
├── bin/
│   └── cli.js                 # Executable entry point (mapped in package.json "bin")
├── src/
│   ├── commands/
│   │   ├── _default.js        # Runs onboarding setup (prompts, auth, auto-config)
│   │   ├── start.js           # Starts the MCP server (reads config, exposes tools via stdio)
│   │   ├── status.js          # Health check (verifies token and connectivity)
│   │   ├── doctor.js          # Diagnostics (checks IDE configs, backend connection)
│   │   └── logout.js          # Deletes ~/.contextmesh/config.json
│   ├── utils/
│   │   ├── config.js          # Helpers to read/write ~/.contextmesh/config.json
│   │   ├── api.js             # Axios wrappers for sending/receiving data
│   │   └── ide-config.js      # OS-specific logic to find and inject MCP configs into IDEs
│   └── mcp/
│       ├── server.js          # The @modelcontextprotocol/sdk Server setup
│       └── tools/             # (save_context, get_master_context, etc.)
├── package.json               # Defines "bin": { "contextmesh": "./bin/cli.js" }
└── tsconfig.json              # If written in TypeScript and compiled to dist/
```

---

## 3. Implementation Plan for the CLI

1. **Scaffold Project:** Initialize Node.js project, install `@modelcontextprotocol/sdk`, `commander`, `@clack/prompts`, and `axios`.
2. **Setup CLI Commands:** Wire up the `bin/cli.js` to route [start](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/scheduler.py#39-51), `status`, `doctor`, and `logout`. Default execution runs the onboarding script.
3. **Build Config Manager:** Implement `utils/config.js` to handle saving and reading to the user's home directory across Linux/Mac/Windows (`os.homedir()`).
4. **Build Auto-Configurator:** Implement JSON parsing and writing for Cursor, Claude Code, and Antigravity configs.
5. **Port MCP Server:** Move the existing `contextmesh-mcp` logic into the CLI's `src/mcp` folder. Modify it to read credentials from `~/.contextmesh/config.json` instead of environment variables.
6. **Publish to NPM:** (Simulated for this project) Build the package so it can be executed via `npx`.

---

## 4. MCP Server Integration Plan

Currently, the MCP server runs standalone and requires environment variables (`TEAM_ID`, `MEMBER_NAME`).
In the new CLI architecture:
- The command `contextmesh start` will boot the MCP server.
- Upon boot, it will read `~/.contextmesh/config.json` to grab the `teamId`, `memberId`, and `token`.
- These credentials will be injected into every API call made by the MCP tools to the backend container.
- IDEs will communicate with the CLI via Stdio (Standard Input/Output) as they invoke the tools.

---

## 5. Backend Changes Needed

The backend must be updated to issue authentication tokens for CLI persistence.

**Modifications to `POST /auth/join-team`:**
*Current:* Accepts [passcode](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/services/passcode.py#24-27), `member_name`. Returns `team_id`, `team_name`, lists.
*Required Update:* Generate and return an auth token (e.g., a simple JWT or a secure un-expiring access token) that the CLI can store. Also return `memberId` and `teamId`.

**Modifications to all `/context/*` routes:**
*Current:* Blindly trusts the `team_id` and `member_name` provided in the JSON body.
*Required Update:* (Optional but recommended for production) Validate the `token` sent in the `Authorization: Bearer <token>` header to ensure requests are legitimate.

---

## 6. Configuration File Structure

Saved on the user's machine at `~/.contextmesh/config.json` (or `%USERPROFILE%\.contextmesh\config.json` on Windows):

```json
{
  "teamId": "beta-team",
  "memberId": "Arjun",
  "token": "ctx_mesh_abc123def456",
  "backendUrl": "http://localhost:8000"
}
```

---

## 7. Auto-Configuration Method for IDEs

The CLI's `ide-config.js` will execute the following logic step-by-step during onboarding:

1. **Locate Target Files:**
   - **Cursor:** `~/.cursor/mcp.json` (Mac/Linux) or `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json` (Windows)
   - **Claude Code:** `~/.claude/claude_desktop_config.json`
   - **Antigravity:** `<cwd>/.gemini/settings.json`
2. **Read & Parse:** Use `fs.readFileSync` and `JSON.parse`. If the file doesn't exist, create an empty JSON template.
3. **Inject Payload:** Merge the following payload into the `mcpServers` object:
   ```json
   "contextmesh": {
     "command": "npx",
     "args": ["contextmesh", "start"],
     "env": {} 
   }
   ```
   *(Note: No env vars needed here, since `contextmesh start` reads the local config file).*
4. **Write:** Save the file using `fs.writeFileSync(..., JSON.stringify(..., null, 2))`.

---

## 8. Example Installation Flow

What the developer sees in their terminal:

```bash
$ npx contextmesh

▰▰▰ ContextMesh Setup ▰▰▰
Welcome! Let's connect your AI tools to your team's shared memory.

? Enter your Team Passcode: ALPHA-34-NEBULA
? Enter your Name: Arjun

✔ Authenticating with backend... Success!
✔ Saving local configuration... Done (~/.contextmesh/config.json)

Detecting installed AI tools...
✔ Found Cursor configuration
✔ Found Claude Code configuration
✔ Found Antigravity configuration

Injecting MCP connections...
✔ Cursor updated!
✔ Claude Code updated!
✔ Antigravity updated!

🚀 All set! Your AI tools will now automatically use ContextMesh.
You can check your status anytime by running: npx contextmesh status
```

---

## 9. Example Developer Workflow

1. Senior Engineer creates "Beta Team" on the ContextMesh website and copy-pastes the passcode to Slack: `"Hey team, run npx contextmesh and use passcode: ALPHA-34-NEBULA"`.
2. Junior Engineer opens their terminal, runs `npx contextmesh`.
3. They enter the passcode and their name. It takes 15 seconds.
4. They open Cursor and start a new chat. The Cursor AI automatically invokes [get_master_context](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/routers/master.py#24-86) because it was auto-configured in the background.
5. They code for an hour. When the chat ends, Cursor automatically invokes [save_context](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/routers/context.py#16-46).
6. Tomorrow, another engineer uses Claude Code and asks "What did Junior Engineer do yesterday?" Claude Code invokes `load_peer_context` and instantly fetches the context. No manual setup required by anyone.
