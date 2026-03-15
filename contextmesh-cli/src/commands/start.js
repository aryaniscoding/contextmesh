import { runServer } from "../mcp/server.js";

export default function startCommand() {
  // Hide console.logs from overriding stdio (only console.error is safe for MCP)
  const originalLog = console.log;
  console.log = () => {};
  
  runServer().catch(err => {
    console.error("Fatal error starting ContextMesh MCP server:", err);
    process.exit(1);
  });
}
