/**
 * Tool 3 — load_peer_context
 * Loads a teammate's full context into the current AI session.
 * Called when engineer says 'load X's context' or clicks 'Load into AI'.
 */
import { api } from "../api.js";
export const loadPeerContextTool = {
    name: "load_peer_context",
    description: "Load a teammate's full AI context (chat history, decisions, code context) " +
        "into your current session. This lets you continue their work with complete awareness.",
    inputSchema: {
        type: "object",
        properties: {
            team_id: { type: "string", description: "Team ID" },
            member_name: {
                type: "string",
                description: "Name of the teammate whose context to load",
            },
        },
        required: ["team_id", "member_name"],
    },
    handler: async ({ team_id, member_name, }) => {
        try {
            const response = await api.get(`/context/member?team_id=${team_id}&member=${encodeURIComponent(member_name)}`);
            const data = response.data;
            // Format the context for injection
            let contextText = `\n=== LOADED CONTEXT: ${member_name} ===\n`;
            contextText += `Sessions: ${data.sessions?.length || 0}\n\n`;
            for (const session of data.sessions || []) {
                contextText += `--- Session (${session.created_at}) ---\n`;
                if (session.decisions?.length) {
                    contextText += `Decisions: ${session.decisions.join(", ")}\n`;
                }
                if (session.questions?.length) {
                    contextText += `Open Questions: ${session.questions.join(", ")}\n`;
                }
                if (session.files?.length) {
                    contextText += `Files: ${session.files.join(", ")}\n`;
                }
                contextText += "\n";
            }
            return {
                content: [
                    {
                        type: "text",
                        text: contextText,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to load peer context: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    },
};
//# sourceMappingURL=loadPeerContext.js.map