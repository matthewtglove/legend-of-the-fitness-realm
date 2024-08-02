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
    currentEvent: ``,
    currentAction: ``,
    remainingEvents: {
        action: [],
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
        if (eventSeverity === `action`) {
            if (!storyState.questContext.currentEvent) {
                await gotoNextEvent(`minor`);
            }
            await loadRemainingEvents(eventSeverity);
            storyState.questContext.currentAction =
                storyState.questContext.remainingEvents[eventSeverity].shift() ?? ``;
            console.log(`gotoNextEvent: ${eventSeverity} "${storyState.questContext.currentAction}"`);
            return;
        }
        await loadRemainingEvents(eventSeverity);
        storyState.questContext.currentEvent = storyState.questContext.remainingEvents[eventSeverity].shift() ?? ``;
        console.log(`gotoNextEvent: ${eventSeverity} "${storyState.questContext.currentEvent}"`);
    };

    let _speakIndex_speaking = undefined as undefined | number;
    const speakTextWrapper = async (text: string, speakIndex: number) => {
        console.log(`(${speakIndex}) speakTextWrapper START`, { text });

        while (_speakIndex_speaking) {
            console.log(`(${speakIndex}) waiting for speakIndex ${_speakIndex_speaking} to finish`);
            await new Promise<void>((resolve) => setTimeout(resolve, 100));
        }

        if (speakIndex !== _speakIndex) {
            console.warn(`(${speakIndex}) is no longer the latest: ${_speakIndex}`);

            return {
                text: undefined,
            };
        }

        _speakIndex_speaking = speakIndex;
        // reset in case something breaks
        setTimeout(() => {
            if (speakIndex === _speakIndex_speaking) {
                _speakIndex_speaking = undefined;
            }
        }, 60 * 1000);

        await speakText(text, { voice: `story` });

        if (speakIndex === _speakIndex_speaking) {
            _speakIndex_speaking = undefined;
        }
    };

    let _speakIndex = 0;
    const promptAndSpeak = async (prompt: PromptData) => {
        _speakIndex++;
        const speakIndex = _speakIndex;
        const speakPromptedAtMs = Date.now();

        const response = await sendOpenRouterAiRequest(prompt.systemPrompt, prompt.userPrompt);
        const result = prompt.extractResult(response ?? ``);
        if (!result) {
            return {
                text: undefined,
            };
        }

        const MAX_DELAY_MS = 15000;
        while (Date.now() < speakPromptedAtMs + MAX_DELAY_MS) {
            await new Promise<void>((resolve) => setTimeout(resolve, 100));
        }

        await speakTextWrapper(result, speakIndex);

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
                await gotoNextEvent(`action`);
                _speakIndex++;
                await speakTextWrapper(storyState.questContext.currentEvent, _speakIndex);
                await speakStory(`event-intro`);
                // await speakTextWrapper(storyState.questContext.currentAction, ++_speakIndex);
            })();
        },
        /** conclude session */
        finishWorkout: () => {},
        /** Conclude current event and introduce next game event */
        workoutTransition: () => {
            (async () => {
                console.log(`workoutTransition`);
                await speakStory(`event-conclusion`);
                storyState.questContext.questLog.push(`${storyState.questContext.currentEvent}`);
                await gotoNextEvent(`minor`);
                await gotoNextEvent(`action`);
                _speakIndex++;
                await speakTextWrapper(storyState.questContext.currentEvent, _speakIndex);
                await speakStory(`event-intro`);
                // await speakTextWrapper(storyState.questContext.currentAction, ++_speakIndex);
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
                storyState.questContext.questLog.push(`- ${storyState.questContext.currentAction} (${successLevel})`);
                await gotoNextEvent(`action`);
                // await speakTextWrapper(storyState.questContext.currentAction, ++_speakIndex);
            })();
        },
    };
};

export type StoryRuntime = ReturnType<typeof createStoryRuntime>;

export const createEmptyStoryRuntime = (): StoryRuntime => {
    return {
        questContext: defaultQuestContext,
        startWorkout: () => {},
        finishWorkout: () => {},
        workoutTransition: () => {},
        startWorkoutSet: () => {},
        finishWorkoutSet: () => {},
    };
};
