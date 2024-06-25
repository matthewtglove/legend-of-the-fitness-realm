import { extractMarkdownList } from '../extract-prompt-results';

export const prompt_questEventList = (options: {
    characterNames: string[];
    questName: string;
    questProgress: number;
    currentEnvironment: string;
    questLog: string[];
    eventSeverity: `minor` | `major` | `main`;
}) => {
    const eventSeverityText =
        options.eventSeverity === `minor`
            ? `minor event`
            : options.eventSeverity === `major`
            ? `minor-boss`
            : `main-boss`;

    return {
        systemPrompt: `
You are a personal trainer dungeon master for an exercise rpg game.

You will tell the story of an rpg dungeun campaign responding to the user's workout routine.

CharacterNames: 
${options.characterNames.map((x) => `- ${x}`).join(`\n`)}
Quest: ${options.questName}
QuestProgress: ${options.questProgress}%
CurrentEnvironment: ${options.currentEnvironment}
QuestLog: 
${options.questLog.map((x) => `- ${x}`).join(`\n`)}
Example AI Response:

-   Attack a Level 3 Goblin with an axe
-   Break open the locked door of the prison
-   Move the boulder that is blocking the passage
`,
        userPrompt: `Write a list of 12 ${eventSeverityText} titles for a game quest menu that should happen during the quest. Great job!`,
        extractResult: extractMarkdownList,
    };
};
