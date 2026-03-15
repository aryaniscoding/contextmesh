/**
 * Tool 1 — get_master_context
 * Fetches the team Master Context from the backend.
 * Called at the start of every AI session.
 * Respects the Mode 1 toggle — if OFF, returns empty.
 */
import { api, config } from "../api.js";

export const getMasterContextTool = {
  name: "get_master_context",
  description:
    "Fetch the team Master Context — shared decisions, work in progress, " +
    "open questions, and conflicts from all team members' AI sessions.",
  inputSchema: {
    type: "object" as const,
    properties: {
      team_id: {
        type: "string",
        description: "Your team ID (e.g. 'acme-engineering')",
      },
    },
    required: ["team_id"],
  },
  handler: async ({ team_id }: { team_id: string }) => {
    // Respect Mode 1 toggle
    if (!config.masterContextEnabled) {
      return {
        content: [
          {
            type: "text",
            text: "Master Context is currently disabled (Mode 1 OFF). Enable it via the dashboard toggle.",
          },
        ],
      };
    }

    try {
      const response = await api.get(`/master-context?team_id=${team_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch Master Context: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  },
};
