/**
 * Tool 4 — mark_private
 * Marks a session as private so it's excluded from Master Context and peer loading.
 */
import { api } from "../api.js";
export const markPrivateTool = {
    name: "mark_private",
    description: "Mark the current or a specific session as private. " +
        "Private sessions are hidden from teammates and excluded from the Master Context.",
    inputSchema: {
        type: "object",
        properties: {
            session_id: {
                type: "number",
                description: "ID of the session to mark as private",
            },
        },
        required: ["session_id"],
    },
    handler: async ({ session_id }) => {
        try {
            await api.patch(`/context/session/${session_id}/private`, {
                is_private: true,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `Session ${session_id} marked as private. It will no longer appear in the Master Context or be loadable by teammates.`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to mark session private: ${error.message}`,
                    },
                ],
                isError: true,
            };
        }
    },
};
//# sourceMappingURL=markPrivate.js.map