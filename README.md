# ContextMesh

ContextMesh is a shared AI memory layer for engineering teams. It connects your local AI coding assistants (Cursor, Claude Code, Antigravity) to a centralized PostgreSQL database, allowing your team's AI to automatically learn from each other's decisions, chats, and code contexts.

## Architecture
The project consists of three main parts:
1. **Frontend (ContextMesh Hub)**: A React dashboard to view team context and master context summaries.
2. **Backend**: A FastAPI & PostgreSQL server that stores context, manages authentication, and runs background LLM summarization.
3. **CLI & MCP Server**: A Node.js CLI tool (`contextmesh-cli`) that developers run to authenticate their IDEs with the ContextMesh backend securely.

---

## How to Run the Systems

### 1. Start the Backend (FastAPI + PostgreSQL)
You must have PostgreSQL installed and running locally.
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd contextmesh-backend
   ```
2. Activate the virtual environment (Windows):
   ```bash
   .\venv\Scripts\activate
   ```
3. Run the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
*The backend needs a `.env` file with `DATABASE_URL` and `GEMINI_API_KEY`.*

### 2. Start the Frontend Dashboard (React + Vite)
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd context-mesh-hub
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and go to `http://localhost:8080/dashboard`.

### 3. Connect a Developer's IDE (The CLI)
Instead of manual setup, developers can instantly connect their Cursor, Claude Code, or Antigravity environments using our NPM package.
1. Tell the developer to open their terminal and run:
   ```bash
   npx -y contextmesh-cli@latest
   ```
2. The interactive prompt will ask for their **Team Passcode** and **Name**.
3. It will automatically detect their installed IDEs and inject the ContextMesh connection securely.

*(Note: They can run `npx contextmesh-cli status` anytime to check their connection).*

---

## Project Status
All 6 development phases are 100% complete!
- Frontend UI and Dashboards
- Backend Database and Authentication
- Master Context Engine (Gemini 2.5 Summarization)
- Model Context Protocol (MCP) Server
- Frontend-Backend Integration
- 1-Click CLI Installer published to NPM
