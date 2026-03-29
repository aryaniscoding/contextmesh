import fs from "fs";
import path from "path";
import os from "os";

// Detect if we are on Windows or Mac/Linux
const isWin = os.platform() === "win32";

// Helper to safely parse JSON or return empty object
function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    return {};
  }
}

// Helper to ensure directory exists before writing
function writeJsonSafe(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Use npx to resolve the package — works on any machine that has npm installed
const contextMeshPayload = {
  command: "npx",
  args: ["-y", "contextmesh-cli", "start"],
  env: {}
};


export function configureCursor() {
  let configPath;
  if (isWin) {
    // Standard Windows AppData for Cursor globalStorage
    configPath = path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "Cursor", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "cline_mcp_settings.json"
    );
  } else {
    // Mac/Linux typical locations
    configPath = path.join(os.homedir(), ".cursor", "mcp.json");
    if (!fs.existsSync(path.dirname(configPath))) {
      // Fallback for some Cursor setups
      configPath = path.join(os.homedir(), "Library", "Application Support", "Cursor", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "cline_mcp_settings.json");
    }
  }

  // Ensure base mcpServers block exists
  const config = readJsonSafe(configPath);
  if (!config.mcpServers) config.mcpServers = {};
  
  config.mcpServers.contextmesh = contextMeshPayload;
  writeJsonSafe(configPath, config);
  return true;
}


export function configureClaudeCode() {
  const desktopConfigPath = path.join(os.homedir(), ".claude", "claude_desktop_config.json");
  const cliConfigPath = path.join(os.homedir(), ".claude.json");
  
  // 1. Claude Desktop App
  const config = readJsonSafe(desktopConfigPath);
  if (!config.mcpServers) config.mcpServers = {};
  config.mcpServers.contextmesh = contextMeshPayload;
  writeJsonSafe(desktopConfigPath, config);

  // 2. Claude Code CLI (Global user scope)
  const cliConfig = readJsonSafe(cliConfigPath);
  if (!cliConfig.mcpServers) cliConfig.mcpServers = {};
  
  // Claude Code uses absolute Node executable paths to bypass Windows Bun crashes
  cliConfig.mcpServers.contextmesh = {
    type: "stdio",
    ...contextMeshPayload
  };
  writeJsonSafe(cliConfigPath, cliConfig);

  return true;
}


export function configureAntigravity() {
  // Antigravity looks for .gemini/settings.json in the current project workspace
  // Since CLI is run globally, we try to inject it into the current working directory's project
  const cwd = process.cwd();
  const configPath = path.join(cwd, ".gemini", "settings.json");
  
  const config = readJsonSafe(configPath);
  if (!config.mcpServers) config.mcpServers = {};
  
  config.mcpServers.contextmesh = contextMeshPayload;
  writeJsonSafe(configPath, config);
  return true;
}

export function autoConfigureAll() {
  const results = [];
  try { configureCursor(); results.push("Cursor"); } catch (e) {}
  try { configureClaudeCode(); results.push("Claude Code"); } catch (e) {}
  try { configureAntigravity(); results.push("Antigravity"); } catch (e) {}
  return results;
}
