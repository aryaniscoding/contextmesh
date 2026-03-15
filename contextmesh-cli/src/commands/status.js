import chalk from "chalk";
import { getConfig } from "../utils/config.js";

export default function statusCommand() {
  const config = getConfig();
  
  console.log(chalk.bold("▰▰▰ ContextMesh Status ▰▰▰\n"));
  
  if (!config) {
    console.log(chalk.red("✖ Not connected."));
    console.log("Run `npx contextmesh` to connect your AI tools to your team.");
    return;
  }

  console.log(chalk.green("✔ Authenticated"));
  console.log(chalk.gray("--------------------------"));
  console.log(`Team ID:    ${chalk.white(config.teamId)}`);
  console.log(`Member:     ${chalk.white(config.memberId)}`);
  console.log(`Backend:    ${chalk.white(config.backendUrl)}`);
  console.log(chalk.gray("--------------------------"));
  
  console.log("\nTo start the background MCP Server manually, run:");
  console.log(chalk.cyan("  npx contextmesh start"));
}
