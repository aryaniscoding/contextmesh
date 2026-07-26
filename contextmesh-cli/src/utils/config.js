import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".contextmesh");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// The hosted backend this build ships against.
export const DEFAULT_BACKEND_URL = "https://api.contextmesh.live";

// Setup in 1.0.4 and earlier wrote a hardcoded localhost backend into every
// user's config, which only ever worked on the maintainer's own machine. Saved
// values pointing at loopback are treated as stale so those installs recover on
// upgrade instead of silently calling a server that was never there.
const STALE_LOCAL_BACKEND = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\/?$/i;

/**
 * The URL a fresh setup should record. Overridable so anyone working on the
 * backend can point the CLI at their own instance.
 */
export function getDefaultBackendUrl() {
  return process.env.CONTEXTMESH_API || DEFAULT_BACKEND_URL;
}

/**
 * The URL to actually call. An explicit override wins, then whatever setup
 * saved, then the shipped default.
 */
export function getBackendUrl() {
  if (process.env.CONTEXTMESH_API) {
    return process.env.CONTEXTMESH_API;
  }
  const saved = getConfig()?.backendUrl;
  if (saved && !STALE_LOCAL_BACKEND.test(saved)) {
    return saved;
  }
  return DEFAULT_BACKEND_URL;
}

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
