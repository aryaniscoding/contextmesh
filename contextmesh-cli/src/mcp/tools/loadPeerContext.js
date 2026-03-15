import { getApi } from "../api.js";

export const loadPeerContextTool = {
  name: "load_peer_context",
  description: "Load the recent coding chat history, decisions, and files modified by a specific teammate.",
  inputSchema: {
    type: "object",
    properties: {
      peer_name: {
        type: "string",
        description: "The name of the teammate whose context you want to load."
      }
    },
    required: ["peer_name"]
  },
  handler: async (args) => {
    try {
      const api = getApi();
      const res = await api.get(`/context/member?team_id=${args.team_id}&member=${encodeURIComponent(args.peer_name)}`);
      
      const sessions = res.data.sessions;
      if (!sessions || sessions.length === 0) {
        return { content: [{ type: "text", text: `${args.peer_name} has no recent shared context.` }] };
      }

      const formatted = sessions.slice(0, 3).map(s => {
        let text = `--- Session ${s.id} (${s.created_at}) ---\n`;
        if (s.decisions.length) text += `Decisions: ${s.decisions.join(", ")}\n`;
        if (s.files.length) text += `Files touched: ${s.files.join(", ")}\n`;
        return text;
      }).join("\n\n");

      return {
        content: [{ type: "text", text: `Context from ${args.peer_name}:\n\n${formatted}` }]
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to load peer context: ${e.message}` }], isError: true };
    }
  }
};
