import { extractMarkdownList } from './extract-prompt-results';

export const prompt_questEventList = (options: {
    characterName: string;
    questName: string;
    questProgress: number;
    context: string;
    lastStory: string;
    eventSeverity: `minor` | `mini-boss` | `main-boss`;
}) => {
    return {
        systemPrompt: `
You are a personal trainer dungeon master for an exercise rpg game.

You will tell the story of an rpg dungeun campaign responding to the user's workout routine.

CharacterName: ${options.characterName}
Quest: ${options.questName}
QuestProgress: ${options.questProgress}%
Context: ${options.context}
LastStory: ${options.lastStory}
Example AI Response:

-   Attack a Level 3 Goblin with an axe
-   Break open the locked door of the prison
-   Move the boulder that is blocking the passage
`,
        userPrompt: `Write a list of 12 minor event titles for a game quest menu that should happen during the quest before the minor boss fight. Great job!`,
        extractResult: extractMarkdownList,
    };
};
