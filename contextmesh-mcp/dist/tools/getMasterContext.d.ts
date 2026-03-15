export declare const getMasterContextTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            team_id: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    handler: ({ team_id }: {
        team_id: string;
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
//# sourceMappingURL=getMasterContext.d.ts.map