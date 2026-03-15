# ContextMesh MCP — Platform Configuration Files

This directory contains config files for each supported AI coding tool.
Copy the relevant config file to the correct location on your system.

## Supported Platforms

| Platform    | Config Location                                | Status |
|-------------|-----------------------------------------------|--------|
| Cursor      | `~/.cursor/mcp.json` or `.cursor/mcp.json`    | ✅      |
| Claude Code | `~/.claude/claude_desktop_config.json`         | ✅      |
| Codex CLI   | `~/.codex/config.json`                         | ✅      |
| Cline       | `.vscode/settings.json`                        | ✅      |
| Windsurf    | `.vscode/settings.json`                        | ✅      |
| Antigravity | `.gemini/settings.json`                        | ✅      |

## Setup

1. Replace `TEAM_ID` with your team ID (e.g. `acme-engineering`)
2. Replace `MEMBER_NAME` with your name (e.g. `Priya Mehta`)
3. Replace `CONTEXTMESH_API` with your backend URL (default: `http://localhost:8000`)
