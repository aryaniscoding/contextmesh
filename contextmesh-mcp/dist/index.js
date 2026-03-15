#!/usr/bin/env node
/**
 * ContextMesh MCP Server — Main Entry Point
 *
 * Registers all 4 tools with the Model Context Protocol SDK.
 * This server runs inside AI coding tools (Cursor, Claude Code,
 * Codex, Cline, Windsurf, Antigravity) and silently captures
 * sessions + injects team context.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { getMasterContextTool } from "./tools/getMasterContext.js";
import { saveContextTool } from "./tools/saveContext.js";
import { loadPeerContextTool } from "./tools/loadPeerContext.js";
import { markPrivateTool } from "./tools/markPrivate.js";
import { config } from "./api.js";
// ─── Server Setup ───
const server = new Server({
    name: "contextmesh-mcp",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
// ─── Tool Definitions ───
const tools = [
    getMasterContextTool,
    saveContextTool,
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
        return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
        };
    }
    // Inject team_id and member_name from env if not provided
    const enrichedArgs = {
        team_id: config.teamId,
        member_name: config.memberName,
        ...args,
    };
    try {
        return await tool.handler(enrichedArgs);
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Tool ${name} failed: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// ─── Start Server ───
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`ContextMesh MCP server running — Team: ${config.teamId}, Member: ${config.memberName}`);
}
main().catch(console.error);
//# sourceMappingURL=index.js.map