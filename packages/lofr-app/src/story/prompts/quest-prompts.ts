import { extractMarkdownList } from '../extract-prompt-results';
import { PromptData, QuestContext } from '../story-types';

export const prompt_questEventList = (options: {
    questContext: QuestContext;
    eventSeverity: `action` | `minor` | `major` | `main`;
}): PromptData => {
    const { questContext, eventSeverity } = options;
    const { characterNames, questName, questProgress, currentEnvironment, questLog, currentEvent } = questContext;

    if (eventSeverity === `action`) {
        return {
            systemPrompt: `
    You are a personal trainer dungeon master for an exercise rpg game.
    
    You will tell the story of an rpg dungeun campaign responding to the user's workout routine.
    
    Quest: ${questName}
    QuestProgress: ${questProgress}%
    CurrentEnvironment: ${currentEnvironment}
    QuestLog: 
    ${questLog.map((x) => `- ${x}`).join(`\n`)}
    Example AI Response:
    
    -   Attack a Level 3 Goblin with an axe
    -   Break open the locked door of the prison
    -   Move the boulder that is blocking the passage
    `.trim(),
            userPrompt: `Write a list of actions needed to complete the "${currentEvent}" game event. Great job!`,
            extractResult: extractMarkdownList,
        };
    }

    const eventSeverityText =
        eventSeverity === `minor` ? `minor event` : eventSeverity === `major` ? `minor-boss` : `main-boss`;

    return {
        systemPrompt: `
You are a personal trainer dungeon master for an exercise rpg game.

You will tell the story of an rpg dungeun campaign responding to the user's workout routine.

Quest: ${questName}
QuestProgress: ${questProgress}%
CurrentEnvironment: ${currentEnvironment}
QuestLog: 
${questLog.map((x) => `- ${x}`).join(`\n`)}
Example AI Response:

-   Attack a Level 3 Goblin with an axe
-   Break open the locked door of the prison
-   Move the boulder that is blocking the passage
`.trim(),
        userPrompt: `Write a list of 12 ${eventSeverityText} titles for a game quest menu that should happen during the quest. Great job!`,
        extractResult: extractMarkdownList,
    };
};
