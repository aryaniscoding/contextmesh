import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getConfig } from "../utils/config.js";

import { getMasterContextTool } from "./tools/getMasterContext.js";
import { saveContextTool } from "./tools/saveContext.js";
import { loadPeerContextTool } from "./tools/loadPeerContext.js";
import { markPrivateTool } from "./tools/markPrivate.js";
import { startSessionTool } from "./tools/startSession.js";

// ─── Server Setup ───
const server = new Server(
  {
    name: "contextmesh",
    version: "1.0.3",
  },
  {
    capabilities: { tools: {} },
  }
);

const tools = [
  startSessionTool,
  saveContextTool,
  getMasterContextTool,
  loadPeerContextTool,
  markPrivateTool,
];

// Register tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

// Register tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }

  // Inject credentials from config
  const config = getConfig();
  if (!config) {
    return { content: [{ type: "text", text: "ContextMesh not configured. Run `npx contextmesh` to authenticate." }], isError: true };
  }

  const enrichedArgs = {
    team_id: config.teamId,
    member_name: config.memberId,
    ...args,
  };

  try {
    return await tool.handler(enrichedArgs);
  } catch (error) {
    return { content: [{ type: "text", text: `Tool ${name} failed: ${error.message}` }], isError: true };
  }
});

// ─── Start Server ───
export async function runServer() {
  const config = getConfig();
  if (!config) {
    console.error("ContextMesh not configured. Run `npx contextmesh` to authenticate.");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`ContextMesh MCP server running — Team: ${config.teamId}, Member: ${config.memberId}`);
}
