import { markSessionStart } from "../../utils/config.js";

export const startSessionTool = {
  name: "start_session",
  description: `Call this IMMEDIATELY when the user switches projects, switches teams, or explicitly says they are starting fresh work unrelated to the previous conversation.
This marks the current position in the conversation so that save_context only pushes messages from this point forward — preventing previous project context from leaking into the new team's memory.
WHEN TO CALL: user says "switch to project X", "new team", "starting on a different repo", or any signal that the prior conversation context belongs to a different project.`,
  inputSchema: {
    type: "object",
    properties: {
      current_message_index: {
        type: "number",
        description: "The number of messages in the conversation so far (i.e. the current conversation length). This becomes the cutoff — only messages after this index will be saved to the new team."
      },
      reason: {
        type: "string",
        description: "Brief note on why the session was reset, e.g. 'switched to project-b team'"
      }
    },
    required: ["current_message_index"]
  },
  handler: async (args) => {
    const index = args.current_message_index ?? 0;
    markSessionStart(index);
    return {
      content: [{
        type: "text",
        text: `✓ Session checkpoint set at message ${index}. ${args.reason ? `Reason: ${args.reason}. ` : ""}From now on, save_context will only include messages after this point.`
      }]
    };
  }
};
