import { getLongApi } from "../api.js";
import { getSessionStartIndex } from "../../utils/config.js";

export const saveContextTool = {
  name: "save_context",
  description: "Save the current chat history to the team's shared memory. Pass the FULL messages array — the tool automatically trims it to only include messages since the last start_session checkpoint, so previous project work is never leaked. ALWAYS run this when the user asks to save context.",
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
      },
      model_name: {
        type: "string",
        description: "The AI model being used, e.g. 'claude-sonnet-4-5', 'gpt-4o', 'gemini-2.5-flash'. Pass the exact model ID you are running on."
      }
    },
    required: ["messages"]
  },
  handler: async (args) => {
    try {
      const api = getLongApi();

      // Slice from session checkpoint to avoid cross-project contamination
      const startIndex = getSessionStartIndex();
      const allMessages = args.messages.filter(m => m.content);
      const sessionMessages = startIndex > 0
        ? allMessages.slice(startIndex)
        : allMessages;

      const payload = {
        team_id: args.team_id,
        member_name: args.member_name,
        messages: sessionMessages,
        files_modified: args.files_modified || [],
        is_private: false,
        model_name: args.model_name || "unknown",
      };
      
      const res = await api.post("/context/save", payload);
      const trimNote = startIndex > 0 ? ` (${sessionMessages.length} messages from checkpoint, ${allMessages.length - sessionMessages.length} prior messages excluded)` : "";
      return { content: [{ type: "text", text: `Successfully saved chat history to ContextMesh. Session ID: ${res.data.session_id}${trimNote}` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to save context: ${e.message}` }], isError: true };
    }
  }
};
