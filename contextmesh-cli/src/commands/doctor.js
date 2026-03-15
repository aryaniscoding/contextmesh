import fs from "fs";
import os from "os";
import path from "path";
import chalk from "chalk";
import { getConfig } from "../utils/config.js";

function checkFile(name, filePath, autoInjectFunc) {
  if (fs.existsSync(filePath)) {
    console.log(chalk.green(`✔ ${name} configuration found.`));
    const content = fs.readFileSync(filePath, "utf-8");
    if (content.includes("contextmesh")) {
      console.log(chalk.green(`  ✔ MCP hook installed.`));
    } else {
      console.log(chalk.yellow(`  ⚠ MCP hook missing. Attempting to inject...`));
      autoInjectFunc();
    }
  } else {
    console.log(chalk.gray(`- ${name} not detected installed in default location.`));
  }
}

export default function doctorCommand() {
  console.log(chalk.bold("▰▰▰ ContextMesh Doctor ▰▰▰\n"));

  const config = getConfig();
  if (!config) {
    console.log(chalk.red("✖ Local configuration missing (~/.contextmesh/config.json)"));
  } else {
    console.log(chalk.green("✔ Local configuration exists."));
  }

  console.log(chalk.blue("\nChecking IDE configurations..."));

  // Check Cursor
  const isWin = os.platform() === "win32";
  const cursorPath = isWin
    ? path.join(process.env.APPDATA || "", "Cursor", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "cline_mcp_settings.json")
    : path.join(os.homedir(), ".cursor", "mcp.json");
  checkFile("Cursor", cursorPath, () => import("../utils/ide-config.js").then(m => m.configureCursor()));

  // Check Claude
  checkFile("Claude Code", path.join(os.homedir(), ".claude", "claude_desktop_config.json"), () => import("../utils/ide-config.js").then(m => m.configureClaudeCode()));

  // Check Antigravity (Local Dir)
  checkFile("Antigravity (Local Workspace)", path.join(process.cwd(), ".gemini", "settings.json"), () => import("../utils/ide-config.js").then(m => m.configureAntigravity()));

  console.log(chalk.bold.magenta("\nDiagnostics complete.\n"));
}
