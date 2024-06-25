export type QuestContext = {
    characterNames: string[];
    questName: string;
    questProgress: number;
    currentEnvironment: string;
    questLog: string[];
    nextEvent: string;
    remainingEvents: {
        minor: string[];
        major: string[];
        main: string[];
    };
};

export type QuestEventSeverity = `minor` | `major` | `main`;

export type PromptData = {
    systemPrompt: string;
    userPrompt: string;
    extractResult: (x: string) => undefined | string;
};
