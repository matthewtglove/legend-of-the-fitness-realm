import { speakText } from '../workout/workout-announce';
import { sendOpenRouterAiRequest } from './call-llm';
import { prompt_questEventList } from './prompts/quest-prompts';
import { QuestEventStorySuccessLevel, prompt_questEventStory } from './prompts/story-prompt';
import { QuestContext } from './story-types';

export const defaultQuestContext: QuestContext = {
    characterNames: [`Rick the Rock Breaker`, `Matthew the Musical`],
    questName: `Defeat the Spider Queen in the Infested Mine`,
    questProgress: 0,
    currentEnvironment: `In the dark forest outside the Infested Mine`,
    questLog: [`Rick found a rotting tree stump. (success)`],
    nextEvent: ``,
    remainingEvents: {
        minor: [],
        major: [],
        main: [],
    },
};

export const createStoryRuntime = (questContext?: QuestContext) => {
    const storyState = {
        questContext: questContext ?? defaultQuestContext,
        lastActionText: ``,
        workoutSessionProgress: 0,
    };

    const loadRemainingEvents = async () => {
        for (const r of [`minor`, `major`, `main`] as const) {
            if (storyState.questContext.remainingEvents[r]?.length) {
                continue;
            }
            const prompt = prompt_questEventList({
                questContext: storyState.questContext,
                eventSeverity: r,
            });
            const result = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
            storyState.questContext.remainingEvents[r] = prompt.extractResult(result ?? ``)?.split(`\n`) ?? [];
        }
    };

    return {
        get questContext() {
            return storyState.questContext;
        },
        set questContext(value: QuestContext) {
            storyState.questContext = value;
        },

        /** intro */
        startWorkout: () => {
            (async () => {
                // load remaining events
                await loadRemainingEvents();

                const prompt = prompt_questEventStory({
                    questContext: storyState.questContext,
                    kind: `intro`,
                    workoutSessionProgress: 0,
                });

                const response = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
                const result = prompt.extractResult(response ?? ``);
                speakText(result ?? ``);
                storyState.lastActionText = result ?? ``;
            })();
        },
        /** describe planned action */
        startWorkoutSet: (nextSet: string) => {
            (async () => {
                // goto next event
                await loadRemainingEvents();
                storyState.questContext.nextEvent = storyState.questContext.remainingEvents.minor.shift() ?? ``;

                const prompt = prompt_questEventStory({
                    kind: `next-set`,
                    questContext: storyState.questContext,
                    workoutSessionProgress: storyState.workoutSessionProgress,
                    lastActionText: storyState.lastActionText,
                    nextSet,
                });

                const response = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
                const result = prompt.extractResult(response ?? ``);
                speakText(result ?? ``);
                storyState.lastActionText = result ?? ``;
            })();
        },
        /** describe result of action */
        finishWorkoutSet: (
            finishedSet: string,
            workoutSessionProgress: number,
            successLevel: QuestEventStorySuccessLevel = `success`,
        ) => {
            storyState.workoutSessionProgress = workoutSessionProgress;

            (async () => {
                const prompt = prompt_questEventStory({
                    kind: `set-result`,
                    questContext: storyState.questContext,
                    workoutSessionProgress,
                    lastActionText: storyState.lastActionText,
                    nextSet: finishedSet,
                    successLevel,
                });

                const response = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
                const result = prompt.extractResult(response ?? ``);
                speakText(result ?? ``);
                storyState.lastActionText = result ?? ``;
            })();
        },
        /** Add detailed background story, location transition */
        startLongRest: () => {},
        /** Session Story Conclusion */
        finishWorkout: () => {},
    };
};

export type StoryRuntime = ReturnType<typeof createStoryRuntime>;
