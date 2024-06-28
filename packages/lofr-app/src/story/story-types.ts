export type QuestContext = {
    characterNames: string[];
    questName: string;
    questProgress: number;
    currentEnvironment: string;
    questLog: string[];
    currentEvent: string;
    currentAction: string;
    remainingEvents: {
        action: string[];
        minor: string[];
        major: string[];
        main: string[];
    };
};

export type QuestEventSeverity = `action` | `minor` | `major` | `main`;

export type PromptData = {
    systemPrompt: string;
    userPrompt: string;
    extractResult: (x: string) => undefined | string;
};
