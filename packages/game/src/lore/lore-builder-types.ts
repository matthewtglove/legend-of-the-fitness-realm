export type LoreBuilderDependencies = {
    aiProvider: {
        sendPrompt: (
            systemPrompt: string,
            prompt: string,
            options?: {
                maxPromptResponseLength?: number;
            },
        ) => Promise<undefined | string>;
    };
    storageProvider: {
        get: (key: string) => undefined | string;
        set: (key: string, value: string) => void;
        remove: (key: string) => void;
    };
};
