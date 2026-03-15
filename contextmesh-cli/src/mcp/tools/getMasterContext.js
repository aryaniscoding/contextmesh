import { getApi } from "../api.js";

export const getMasterContextTool = {
  name: "get_master_context",
  description: "Get the project's Master Context (global decisions, conflicts, key facts) synthesized from the team. Call this when you start a new chat.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async (args) => {
    try {
      const api = getApi();
      const res = await api.get(`/master-context?team_id=${args.team_id}`);
      
      return {
        content: [
          {
            type: "text",
            text: `[CONTEXTMESH MASTER CONTEXT (v${res.data.version})]\n\n` +
                  `DECISIONS:\n${JSON.stringify(res.data.decisions, null, 2)}\n\n` +
                  `IN PROGRESS:\n${JSON.stringify(res.data.in_progress, null, 2)}\n\n` +
                  `OPEN QUESTIONS:\n${JSON.stringify(res.data.open_questions, null, 2)}\n\n` +
                  `CONFLICTS:\n${JSON.stringify(res.data.conflicts, null, 2)}`
          }
        ]
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error fetching master context: ${e.message}` }],
        isError: true,
      };
    }
  }
};
