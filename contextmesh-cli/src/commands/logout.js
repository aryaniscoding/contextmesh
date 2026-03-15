import chalk from "chalk";
import { getConfig, clearConfig } from "../utils/config.js";

export default function logoutCommand() {
  const config = getConfig();
  if (config) {
    clearConfig();
    console.log(chalk.green(`✔ Successfully logged out of team: ${config.teamId}`));
    console.log(chalk.gray("Your local ContextMesh credentials have been deleted."));
  } else {
    console.log(chalk.yellow("You are not currently logged in."));
  }
}
