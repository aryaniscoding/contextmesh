import { getApi } from "../api.js";

export const markPrivateTool = {
  name: "mark_private",
  description: "Mark a saved session as private, hiding it from the team Master Context and peer loading.",
  inputSchema: {
    type: "object",
    properties: {
      session_id: {
        type: "number",
        description: "The ID of the session to mark private. (You get this ID when you call save_context)"
      }
    },
    required: ["session_id"]
  },
  handler: async (args) => {
    try {
      const api = getApi();
      const res = await api.patch(`/context/session/${args.session_id}/private`, {
        is_private: true
      });
      return { content: [{ type: "text", text: `Session ${args.session_id} successfully marked as private.` }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Failed to mark session private: ${e.message}` }], isError: true };
    }
  }
};
