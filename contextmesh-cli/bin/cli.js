#!/usr/bin/env node

/**
 * ContextMesh CLI
 * Entry point for the `contextmesh` command.
 */
import { Command } from "commander";
import setupCommand from "../src/commands/_default.js";
import startCommand from "../src/commands/start.js";
import statusCommand from "../src/commands/status.js";
import doctorCommand from "../src/commands/doctor.js";
import logoutCommand from "../src/commands/logout.js";

const program = new Command();

program
  .name("contextmesh")
  .description("CLI to manage the ContextMesh MCP plugin")
  .version("0.1.0");

// The default action if no command is provided is to run the setup/onboarding flow
program.action(() => {
  setupCommand();
});

program
  .command("start")
  .description("Start the ContextMesh MCP server locally")
  .action(startCommand);

program
  .command("status")
  .description("Check if ContextMesh is authenticated and running")
  .action(statusCommand);

program
  .command("doctor")
  .description("Diagnose IDE configuration issues")
  .action(doctorCommand);

program
  .command("logout")
  .description("Clear local ContextMesh credentials")
  .action(logoutCommand);

program.parse(process.argv);
