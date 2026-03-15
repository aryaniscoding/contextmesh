/**
 * Tool 2 — save_context
 * Saves the current AI session to the team context store.
 * Called automatically when a session ends.
 */
import { api } from "../api.js";

export const saveContextTool = {
  name: "save_context",
  description:
    "Save the current AI session's full chat history to the team context store. " +
    "This preserves all decisions, reasoning, and code discussions for teammates.",
  inputSchema: {
    type: "object" as const,
    properties: {
      team_id: { type: "string", description: "Team ID" },
      member_name: { type: "string", description: "Your name" },
      messages: {
        type: "array",
        description: "Full chat history as an array of {role, content} objects",
      },
      files_modified: {
        type: "array",
        description: "List of files modified during the session",
      },
      is_private: {
        type: "boolean",
        description: "Set true to keep this session private (default false)",
      },
    },
    required: ["team_id", "member_name", "messages"],
  },
  handler: async (params: {
    team_id: string;
    member_name: string;
    messages: Array<{ role: string; content: string }>;
    files_modified?: string[];
    is_private?: boolean;
  }) => {
    try {
      const response = await api.post("/context/save", {
        team_id: params.team_id,
        member_name: params.member_name,
        messages: params.messages,
        files_modified: params.files_modified || [],
        is_private: params.is_private || false,
      });
      return {
        content: [
          {
            type: "text",
            text: `Session saved successfully (ID: ${response.data.session_id})`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to save context: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};
