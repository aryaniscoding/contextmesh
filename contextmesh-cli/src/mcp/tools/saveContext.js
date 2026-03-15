import { getApi } from "../api.js";

export const saveContextTool = {
  name: "save_context",
  description: "Save the ENTIRE current chat history (user prompts + your responses) to the team's shared memory. ALWAYS run this explicitly when the user asks.",
  inputSchema: {
    type: "object",
    properties: {
      messages: {
        type: "array",
        description: "The complete array of the chat transcript so far.",
        items: {
          type: "object",
          properties: {
            role: { type: "string", description: "'user' or 'assistant'" },
            content: { type: "string" }
          },
          required: ["role", "content"]
        }
      },
      files_modified: {
        type: "array",
        description: "Paths of any files modified during this session.",
        items: { type: "string" }
      }
    },
    required: ["messages"]
  },
  handler: async (args) => {
    try {
      const api = getApi();
      const payload = {
        team_id: args.team_id,
        member_name: args.member_name,
        messages: args.messages.filter(m => m.content), // Exclude tool-calls
        files_modified: args.files_modified || [],
        is_private: false
      };
      
      const res = await api.post("/context/save", payload);
      return { content: [{ type: "text", text: `Successfully saved chat history to ContextMesh database. Session ID: ${res.data.session_id}` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to save context: ${e.message}` }], isError: true };
    }
  }
};
