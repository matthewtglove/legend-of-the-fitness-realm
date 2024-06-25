export type QuestContext = {
    characterNames: string[];
    questName: string;
    questProgress: number;
    currentEnvironment: string;
    questLog: string[];
    remainingEvents: {
        minor: string[];
        major: string[];
        main: string[];
    };
};
