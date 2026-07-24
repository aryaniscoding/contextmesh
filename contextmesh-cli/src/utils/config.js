import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".contextmesh");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function clearConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}

/**
 * Mark the start of a new project session.
 * Stores the message index so save_context only pushes messages from this point onward.
 */
export function markSessionStart(messageIndex) {
  const config = getConfig();
  if (!config) return;
  config.sessionStartIndex = messageIndex;
  config.sessionStartedAt = new Date().toISOString();
  saveConfig(config);
}

export function getSessionStartIndex() {
  const config = getConfig();
  return config?.sessionStartIndex ?? 0;
}
