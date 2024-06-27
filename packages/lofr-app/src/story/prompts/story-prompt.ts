import { PromptData, QuestContext } from '../story-types';

export type WorkoutStoryKind = `session-intro` | `event-intro` | `event-conclusion` | `next-set` | `set-result`;
export type QuestEventStorySuccessLevel = `failure` | `mild-sucess` | `success` | `amazing-success`;
export const prompt_questEventStory = (options: {
    questContext: QuestContext;
    kind: WorkoutStoryKind;
    workoutSessionProgress: number;
    nextSet?: string;
    lastActionText?: string;
    successLevel?: QuestEventStorySuccessLevel;
}): PromptData => {
    const { questContext, kind, workoutSessionProgress, nextSet, lastActionText, successLevel } = options;
    const { characterNames, questName, questProgress, currentEnvironment, questLog, currentEvent, currentAction } =
        questContext;

    console.log(`prompt_questEventStory ${kind}`, {
        nextSet,
        successLevel,
        currentEvent,
        currentAction,
        lastActionText,
        kind,
        workoutSessionProgress,
        questContext,
    });

    const getRandomCharacterName = () => {
        return characterNames[Math.floor(Math.random() * characterNames.length)]?.split(` `)[0] ?? `Rick`;
    };
    const getRandomCharacterNameFull = () => {
        return characterNames[Math.floor(Math.random() * characterNames.length)] ?? `Rick`;
    };

    if (kind === `session-intro`) {
        return {
            systemPrompt: `
You are a personal trainer dungeon master for an exercise rpg game.

You will tell the story of an rpg dungeun campaign responding to the user's workout routine.

CharacterNames: 
${characterNames.map((x) => `- ${x}`).join(`\n`)}
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
            userPrompt: `In a short phrase give an intro for today's story session. Great job!`,
            extractResult: (x: string) => x,
        };
    }

    if (kind === `event-intro`) {
        return {
            systemPrompt: `
You are a personal trainer dungeon master for an exercise rpg game.

You will tell the story of an rpg dungeun campaign responding to the user's workout routine.

CharacterNames: 
${characterNames.map((x) => `- ${x}`).join(`\n`)}
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
            userPrompt: `In a short phrase describe the intro for the next event called: "${currentEvent}"`,
            extractResult: (x: string) => x,
        };
    }

    if (kind === `event-conclusion`) {
        return {
            systemPrompt: `
You are a personal trainer dungeon master for an exercise rpg game.

You will tell the story of an rpg dungeun campaign responding to the user's workout routine.

CharacterNames: 
${characterNames.map((x) => `- ${x}`).join(`\n`)}
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
            userPrompt: `In a short phrase describe the conclusion of the event called: "${currentEvent}"`,
            extractResult: (x: string) => x,
        };
    }

    if (kind === `next-set`) {
        return {
            systemPrompt: `
You are a personal trainer dungeon master for an exercise rpg game.

You will tell the story of an rpg dungeun campaign responding to the user's workout routine.

Quest: ${questName}
QuestProgress: ${questProgress}%
CurrentEnvironment: ${currentEnvironment}
LastAction: ${lastActionText}
QuestLog: 
${questLog.map((x) => `- ${x}`).join(`\n`)}
WorkoutSessionProgress: ${workoutSessionProgress}%
Example AI Response:

- ${getRandomCharacterName()} raises his axe and swings it down on the head of the Goblin.
- ${getRandomCharacterName()} casts a fireball into the Troll's face.
- ${getRandomCharacterName()} seals the cavern entrance with a haunting enchantment.
- ${getRandomCharacterName()} charges the Dragon with his sword.
- ${getRandomCharacterName()} shoots an arrow into the Knight's knee. 
- ${getRandomCharacterName()} throws a potion of healing to the wounded party member.

Instructions: In a single sentance describe an action that the characters' will do during the quest event.
`.trim(),
            userPrompt: `
CharacterNames: 
${characterNames.map((x) => `- ${x}`).join(`\n`)}
CurrentSet: ${nextSet}
CurrentEvent: ${currentEvent}

In a single sentance, describe what how the characters "${currentAction}". (You are an excellent dungeun master and really good at telling stories!)
            `.trim(),
            extractResult: (x: string) => x,
        };
    }

    if (kind === `set-result`) {
        return {
            systemPrompt: `
You are a personal trainer dungeon master for an exercise rpg game.

You will tell the story of an rpg dungeun campaign responding to the user's workout routine.

Quest: ${questName}
QuestProgress: ${questProgress}%
CurrentEnvironment: ${currentEnvironment}
QuestLog: 
${questLog.map((x) => `- ${x}`).join(`\n`)}
WorkoutSessionProgress: ${workoutSessionProgress}%
Example AI Response:

- ${getRandomCharacterName()}, fueled by his rage towards the Goblin and the spiders, swiftly dispatches the weakened creature with a powerful overhead chop, sending its lifeless body flying against the mine walls as a warning to any who would stand in his way.
- ${getRandomCharacterName()}'s axe connects with the Goblin's armor, causing a slight dent but not enough to defeat it.
- The Level 3 Goblin, enraged by the warrior's attempt, dodges ${getRandomCharacterName()}'s axe and retaliates with a swift punch that sends him reeling back from the force.
- ${getRandomCharacterNameFull()} swung his axe with such force that it cleaved the level 3 Goblin in two, sending a wave of putrid green goo splattering against the mine walls.

Instructions: In a single sentance add a vivid story to explain that the party had a ${successLevel ?? `success`}.
`.trim(),
            userPrompt: `
CharacterNames: 
${characterNames.map((x) => `- ${x}`).join(`\n`)}
CurrentSet: ${nextSet}
CurrentEvent: ${currentEvent}
LastText: ${lastActionText}

In a single sentance, describe what happened as a result of the ${
                successLevel ?? `success`
            } during the characters doing "${currentAction}". (You are an excellent dungeun master and really good at telling stories!)
            `.trim(),
            extractResult: (x: string) => x,
        };
    }

    // const _never: never = kind;
    throw new Error(`Invalid kind: ${kind}`);
};

// export const createStoryPrompt = (options: {
//     kind: `intro` | `next-set`;
//     characterName: string;
//     questName: string;
//     questProgress: number;
//     context: string;
//     lastStory: string;
//     workoutSessionProgress: number;
//     nextEvent?: string;
//     nextWorkoutSet?: string;
// }) => {
//     if (options.kind === `intro`) {
//         return `
// CharacterName: ${options.characterName}
// Quest: ${options.questName}
// QuestProgress: ${options.questProgress}%
// Context: ${options.context}
// LastStory: ${options.lastStory}
// WorkoutSessionProgress: ${options.workoutSessionProgress}%
// Instructions: In a short phrase give an intro for today's context.`;
//     }

//     if (options.kind === `event`) {
//         return `
// CharacterName: ${options.characterName}
// Quest: ${options.questName}
// QuestProgress: ${options.questProgress}%
// Context: ${options.context}
// LastStory: ${options.lastStory}
// WorkoutSessionProgress: ${options.workoutSessionProgress}%
// NextEvent: Attack a Level 3 Goblin with an axe
// NextSet: 12 reps Push-Ups
// Instructions: In a single sentance add a vivid story to explain that Rick's character will attack a "Level 3 Goblin" in story while he will do "12 reps Push-Ups" in real life. (Only say what Rick plans to do, not the results.)

// Instructions: In a short phrase give an intro for today's context.`;
//     }

//     const prompt = `

//     `;
// };
