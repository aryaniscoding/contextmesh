export declare const markPrivateTool: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            session_id: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    handler: ({ session_id }: {
        session_id: number;
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
//# sourceMappingURL=markPrivate.d.ts.map