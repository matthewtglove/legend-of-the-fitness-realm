import { speakText } from '../workout/workout-announce';
import { sendOpenRouterAiRequest } from './call-llm';
import { prompt_questEventList } from './prompts/quest-prompts';
import { QuestEventStorySuccessLevel, WorkoutStoryKind, prompt_questEventStory } from './prompts/story-prompt';
import { PromptData, QuestContext, QuestEventSeverity } from './story-types';

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

    const loadRemainingEvents = async (eventSeverity: QuestEventSeverity) => {
        for (const r of [eventSeverity] as const) {
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
    const gotoNextEvent = async (eventSeverity: QuestEventSeverity) => {
        await loadRemainingEvents(eventSeverity);
        storyState.questContext.nextEvent = storyState.questContext.remainingEvents.minor.shift() ?? ``;
        console.log(`gotoNextEvent: "${storyState.questContext.nextEvent}"`);
    };

    let speakIndex = 0;
    let speakIndex_speaking = undefined as undefined | number;
    const promptAndSpeak = async (prompt: PromptData) => {
        speakIndex++;
        const _speakIndex = speakIndex;
        const speakPromptedAt = Date.now();
        const MAX_DELAY_MS = 15000;

        const response = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
        while (speakIndex_speaking && Date.now() < speakPromptedAt + MAX_DELAY_MS) {
            await new Promise<void>((resolve) => setTimeout(resolve, 100));
        }

        if (_speakIndex !== speakIndex || speakIndex_speaking) {
            // took to long to respond
            return {
                text: undefined,
            };
        }

        const result = prompt.extractResult(response ?? ``);
        if (!result) {
            return {
                text: undefined,
            };
        }

        speakIndex_speaking = _speakIndex;
        // reset in case something breaks
        setTimeout(() => {
            if (_speakIndex === speakIndex_speaking) {
                speakIndex_speaking = undefined;
            }
        }, 60 * 1000);

        await new Promise<void>((resolve) => {
            speakText(result, { voice: `story`, onDone: () => resolve() });
        });
        if (_speakIndex === speakIndex_speaking) {
            speakIndex_speaking = undefined;
        }
        return {
            text: result,
        };
    };

    const speakStory = async (
        kind: WorkoutStoryKind,
        extra?: {
            nextSet?: string;
            successLevel?: QuestEventStorySuccessLevel;
        },
    ) => {
        const { text } = await promptAndSpeak(
            prompt_questEventStory({
                kind,
                ...storyState,
                ...(extra ?? {}),
            }),
        );
        if (!text) {
            return;
        }
        storyState.lastActionText = text;
    };

    // TODO: add event actions (which is what each set will go through)

    return {
        get questContext() {
            return storyState.questContext;
        },
        set questContext(value: QuestContext) {
            storyState.questContext = value;
        },

        /** introduce session */
        startWorkout: () => {
            (async () => {
                console.log(`startWorkout`);
                await speakStory(`session-intro`);
                await gotoNextEvent(`minor`);
                await speakStory(`event-intro`);
            })();
        },
        /** conclude session */
        finishWorkout: () => {},
        /** Conclude current event and introduce next game event */
        workoutTransition: () => {
            (async () => {
                console.log(`workoutTransition`);
                await speakStory(`event-conclusion`);
                await gotoNextEvent(`minor`);
                await speakStory(`event-intro`);
            })();
        },
        /** describe planned action */
        startWorkoutSet: (nextSet: string) => {
            (async () => {
                console.log(`startWorkoutSet`);
                await speakStory(`next-set`, {
                    nextSet,
                });
            })();
        },
        /** describe result of action */
        finishWorkoutSet: (
            finishedSet: string,
            workoutSessionProgress: number,
            successLevel: QuestEventStorySuccessLevel = `success`,
        ) => {
            (async () => {
                console.log(`finishWorkoutSet`);
                storyState.workoutSessionProgress = workoutSessionProgress;
                await speakStory(`set-result`, {
                    nextSet: finishedSet,
                    successLevel,
                });
                storyState.questContext.questLog.push(`${storyState.questContext.nextEvent} (${successLevel})`);
            })();
        },
    };
};

export type StoryRuntime = ReturnType<typeof createStoryRuntime>;
