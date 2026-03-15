export declare const loadPeerContextTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            team_id: {
                type: string;
                description: string;
            };
            member_name: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    handler: ({ team_id, member_name, }: {
        team_id: string;
        member_name: string;
    }) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
        isError?: undefined;
    } | {
        content: {
            type: string;
            text: string;
        }[];
        isError: boolean;
    }>;
};
//# sourceMappingURL=loadPeerContext.d.ts.map