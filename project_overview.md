# ContextMesh: Comprehensive Project Overview

## 1. Executive Summary: What is ContextMesh?
**ContextMesh** is a centralized, real-time shared memory layer designed specifically for engineering teams using AI coding assistants (like Cursor, Claude Code, Cline, and Antigravity). 

Currently, when Developer A (working on the backend) makes an architectural decision with their AI, Developer B (working on the frontend) has no idea that decision was made. Their AI is essentially operating in a "silo" with zero organizational awareness. 

ContextMesh solves this by acting as a passive "memory web" between all team members. It securely collects the chat payloads, decisions, and system prompts from every developer's IDE via the **Model Context Protocol (MCP)**, synthesizes this feed using an LLM to extract key actionable insights, and automatically broadcasts this live "Master Context" back to the rest of the team.

---

## 2. What Problem Will it Solve?
- **AI Knowledge Silos:** Eliminates the problem where an AI writing the frontend uses outdated endpoints because it doesn't know what the backend AI just wrote.
- **Redundant Prompting:** Prevents developers from constantly having to upload architecture docs or explain what their teammates are building.
- **Conflict Prevention:** By running continuous analysis on the team's live context stream, the system flags potential architectural or syntax collisions before the code is even committed to Git.
- **Onboarding:** Instantly injects new team members into the exact "mental state" of the project by loading up the existing active Master Context.

---

## 3. Architecture & How it Works
The platform is built on three major pillars working in tandem:

### A. The Dashboard (Frontend Hub)
A real-time, glassmorphic command center for team admins and members.
- **How it works:** It polls the backend continuously to render a live "Context Feed" of what every developer's AI is working on right now. You can click on any teammate's session to read their AI chat log, see which files their AI is modifying, or manually toggle the Master Context live injection.

### B. The Engine (Backend)
A high-performance Python server processing the data.
- **How it works:** It provides REST API endpoints for the dashboard and MCP instances to save logs, fetch context, and join teams using passcodes. It includes an **Aggregator Service** that runs periodically (or via webhook) to read all recent team AI chats, feed them into an LLM (e.g., Claude), and compress raw dialogue into bullet-point decisions, open questions, and warnings. 

### C. The Glue (MCP Framework & CLI)
The Model Context Protocol (MCP) securely bridges the developer's IDE and the backend.
- **How it works:** 
  1. We built an NPM global tool (`npx contextmesh`).
  2. Developers run it, enter their Team Passcode, and the CLI automatically modifies their `claude_desktop_config.json` or Cursor settings to connect to the ContextMesh MCP Server running silently in the background.
  3. The MCP server exposes tools directly to the AI:
     - [get_master_context](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/routers/master.py#24-86): Tells the AI the rules and decisions of the team.
     - `load_peer_context`: Allows the AI to peek at a specific teammate's current work.
     - [save_context](file:///z:/Impetus%202026%20context%20project/contextmesh-backend/routers/context.py#35-69): The AI proactively pushes summaries back to the hub when a task is completed.

---

## 4. Current Progress & Work Completed
- **Frontend Validation:** Built the landing page, "Create Team" flow, "Enter Team" passcode workflow, and the fully-styled responsive Dashboard with real-time modal scroll layouts.
- **Backend Foundations:** Set up FastAPI, SQLAlchemy, REST endpoints, password hashing, and local PostgreSQL models for tracking Teams, Members, Context Sessions, and the synthesized Master Context blob.
- **MCP Server:** Completed the Node.js/TypeScript server containing the system's core tools, properly parsing request arguments and communicating back to the FastAPI backend.
- **CLI Onboarding Automation:** Engineered the `contextmesh-cli` to handle seamless user login, store credentials securely, and automatically inject configuration payloads into developer IDE config files without manual copy-pasting.

---

## 5. Technology Stack
*   **Frontend User Interface:**
    *   **React** (Vite + TypeScript)
    *   **TailwindCSS** (Utility styling, Glassmorphism design)
    *   **Shadcn UI** & **Radix UI** (Accessible, pre-built components like Modals/Dialogs and ScrollAreas)
    *   **Framer Motion** (Smooth structural layout animations)
*   **Backend & Data Processing:**
    *   **FastAPI** (Python async REST framework)
    *   **SQLAlchemy** (ORM mapping)
    *   **Uvicorn** (ASGI server)
*   **Integration & Tooling:**
    *   **Model Context Protocol (@modelcontextprotocol/sdk)** (Standardized AI tool communication)
    *   **Node.js / Commander / Inquirer** (For the automated CLI setup tool)

---

## 6. The Future (In Progress): Supabase & pgvector Migration
As engineering teams grow and code for months, the "Master Context" text file becomes hundreds of thousands of tokens long. Injecting this massive document blindly into an AI's prompt will quickly exceed context windows and spike API costs.

**To solve this, a migration is currently in progress to move the entire database architecture to Supabase.**

*   **Supabase:** Provides a polished, scalable, managed PostgreSQL environment with built-in connection pooling and real-time capabilities.
*   **pgvector Integration:** We are updating the data models to include mathematical embeddings (`Vector(1536)`) for every chat session and decision using the **OpenAI Embedding API**.
*   **Semantic Search (RAG):** Once migrated, instead of loading the *entire* team history, the MCP server will perform a lightning-fast cosine-similarity search against the Supabase vectors. The AI will only retrieve the **top 3 most relevant decisions**, creating a highly efficient Retrieval-Augmented Generation (RAG) system for the team's shared memory.

### Additional Future Roadmap Features
*   **Global User Accounts:** Adding fully-featured User Signup/Login (via Supabase Auth) so a single developer can securely belong to and switch between multiple teams, viewing distinct context layers for each.
*   **Cross-Team Architecture:** Expanding the Aggregate engine specifically to detect *Cross-Team Conflicts*—e.g., if Team A (Frontend) changes an API payload structure that breaks an assumption made by Team B (Backend).
*   **UI/UX Refinements:** Continuous improvements to dashboard interactions, introducing even smoother animations, simplified "at-a-glance" context viewing, and globally seamless scroll handling.
