export declare const saveContextTool: {
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
            messages: {
                type: string;
                description: string;
            };
            files_modified: {
                type: string;
                description: string;
            };
            is_private: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    handler: (params: {
        team_id: string;
        member_name: string;
        messages: Array<{
            role: string;
            content: string;
        }>;
        files_modified?: string[];
        is_private?: boolean;
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
//# sourceMappingURL=saveContext.d.ts.map