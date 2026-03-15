import inquirer from "inquirer";
import chalk from "chalk";
import { joinTeam } from "../utils/api.js";
import { saveConfig, getConfig } from "../utils/config.js";
import { autoConfigureAll } from "../utils/ide-config.js";

export default async function setupCommand() {
  console.log(chalk.bold.magenta("\n▰▰▰ ContextMesh Setup ▰▰▰"));
  console.log(chalk.gray("Welcome! Let's connect your AI tools to your team's shared memory.\n"));

  const existingConfig = getConfig();
  if (existingConfig) {
    console.log(chalk.yellow(`Found existing setup for team: ${existingConfig.teamId}`));
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: "Do you want to overwrite it and login again?",
        default: false,
      }
    ]);
    if (!overwrite) {
      console.log(chalk.green("Setup complete. You are ready to go!"));
      return;
    }
  }

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "passcode",
      message: "Enter your Team Passcode:",
      validate: (input) => input.length > 5 || "Passcode is required",
    },
    {
      type: "input",
      name: "memberName",
      message: "Enter your Name:",
      validate: (input) => input.length >= 2 || "Name must be at least 2 characters",
    }
  ]);

  console.log(chalk.blue("\n↻ Authenticating with backend..."));
  
  try {
    const data = await joinTeam(answers.passcode, answers.memberName);
    
    saveConfig({
      teamId: data.team_id,
      memberId: answers.memberName,
      token: data.token,
      backendUrl: "http://localhost:8000" // Hardcoded for MVP, can be prompted
    });

    console.log(chalk.green("✔ Success! Saved local configuration."));

    console.log(chalk.blue("\n↻ Injecting MCP connections into installed AI tools..."));
    const updatedIDEs = autoConfigureAll();
    
    if (updatedIDEs.length > 0) {
      updatedIDEs.forEach(ide => console.log(chalk.green(`✔ ${ide} updated!`)));
    } else {
      console.log(chalk.yellow("⚠ No supported IDEs found. You may need to configure MCP manually."));
    }

    console.log(chalk.bold.magenta("\n🚀 All set! Your AI tools will now automatically use ContextMesh."));
    console.log(chalk.gray("You can check your status anytime by running: npx contextmesh status\n"));

  } catch (err) {
    console.log(chalk.red(`\n✖ Authentication failed: ${err.message}\n`));
  }
}
