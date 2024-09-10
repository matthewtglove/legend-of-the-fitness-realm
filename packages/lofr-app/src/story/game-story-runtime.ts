import {
    createEmptyGameState,
    createGameBattleProvider,
    createGameLoreProvider,
    createLoreBuilder,
    createGameRuntime,
    GameEventResponse,
    GameRuntimeContext,
    formatGameEventMessage,
    GameSessionPeriod,
    GameState,
} from '@lofr/game';
import { WorkoutSession, WorkoutStep } from '@lofr/workout-parser';
import { speakText } from '../workout/workout-announce';
import { sendOpenRouterAiRequest } from './call-llm';
import { cloneDeep } from '../../../game/dist/src/deep-obj';
import { createSoundManager } from '../media/sound-manager';
// import { create } from 'zustand';

export const createGameStoryRuntime = () => {
    const loreBuilder = createLoreBuilder({
        storageProvider: {
            get: (key: string) => localStorage.getItem(key) || undefined,
            set: (key: string, value: string) => localStorage.setItem(key, value),
            remove: (key: string) => localStorage.removeItem(key),
        },
        aiProvider: {
            sendPrompt: async (systemPrompt: string, prompt: string, options) => {
                return await sendOpenRouterAiRequest(systemPrompt, prompt, {
                    maxTokens: options?.maxPromptResponseLength,
                });
            },
        },
    });

    const gameStateStorage = {
        key: `gameState`,
        get: () => {
            try {
                const v = localStorage.getItem(gameStateStorage.key);
                if (!v) {
                    return undefined;
                }
                return JSON.parse(v) as GameState;
            } catch (e) {
                return undefined;
            }
        },
        set: (value: GameState) => localStorage.setItem(gameStateStorage.key, JSON.stringify(value)),
        remove: () => localStorage.removeItem(gameStateStorage.key),
    };

    const state = {
        gameRuntime: createGameRuntime(
            gameStateStorage.get() ?? createEmptyGameState(),
            createGameLoreProvider(loreBuilder),
            createGameBattleProvider(),
        ),
        gameRuntimeSubscription: undefined as undefined | { unsubscribe: () => void },
        workoutSession: undefined as undefined | WorkoutSession,
        stepIndex: 0,
        stepSessionPeriods: [] as GameSessionPeriod[][],
        sessionPeriodIndex: 0,
        sessionPeriodRemainingSec: 0,
    };

    const loadGameState = () => {
        if (state.gameRuntimeSubscription) {
            state.gameRuntimeSubscription.unsubscribe();
        }

        state.gameRuntime = createGameRuntime(
            gameStateStorage.get() ?? createEmptyGameState(),
            createGameLoreProvider(loreBuilder),
            createGameBattleProvider(),
        );

        if (!state.gameRuntime.state.players.length) {
            state.gameRuntime.createPlayer({
                characterName: `Rick the Rock Breaker`,
                characterRace: `Human`,
                characterClass: `Barbarian`,
                level: 1,
            });
            state.gameRuntime.createPlayer({
                characterName: `Matthew the Musical Mage`,
                characterRace: `Elf`,
                characterClass: `Mage`,
                level: 1,
            });
        }

        // save game state to local storage on change
        state.gameRuntimeSubscription = state.gameRuntime.subscribe((data) => {
            gameStateStorage.set(data.state);
        });
    };
    loadGameState();

    // const useStore = create((set) => ({
    //     bears: 0,
    //     increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
    //     removeAllBears: () => set({ bears: 0 }),
    //   }))

    const getGameContext = (): GameRuntimeContext => {
        return {
            campaignSessionsTotal: 1,
            campaignSessionsRemaining: 0,
            sessionPeriods: state.stepSessionPeriods.flat() ?? [],
            sessionPeriodsRemaining: state.stepSessionPeriods.slice(state.sessionPeriodIndex + 1).flat() ?? [],
            currentSessionPeriod: {
                index: state.sessionPeriodIndex,
                remainingSec: state.sessionPeriodRemainingSec,
            },
            sessionPlayers: state.gameRuntime.state.players.map((player) => ({
                isLocal: true,
                player: player.id,
            })),
        };
    };

    const storyState = {
        iNextId: 0,
        storyHistory: [] as {
            id: string;
            gameEvents: GameEventResponse;
            eventFormatted: string;
            prompt: {
                systemPrompt: string;
                userPrompt: string;
                fullResponse?: string;
            };
            message?: string;
        }[],
    };

    const announceGameEvents = async (gameEvents: GameEventResponse) => {
        console.log(`accountGameEvents`, { gameRuntimeState: cloneDeep(state.gameRuntime.state), state });

        // play sound
        soundManager.playGameEventSound(gameEvents);

        // for (const event of gameEvents.events) {
        const formatted = gameEvents.events.map((event) => formatGameEventMessage(event)).join(`\n`);

        const id = `${storyState.iNextId++}`;

        const previousStory = storyState.storyHistory
            .slice(-5)
            .map((x) => `${x.message}\n`)
            .join(``);

        const systemPrompt = `You are a dungeun master for a game. You must add a single sentance to summarize the game event. DO NOT ADD EXTRA FACTS! Describe only the facts in the event.`;
        //`Previous Story:\n${previousStory}\n---\nGame Event:\n'${formatted}'\n---\nGame Event Retold (no extra facts):\n`,
        const userPrompt = `
{
    // This is the previous story that has been told to the player already
    previousStory: \`${previousStory}\`,
    // This is the data for the game event that must be retold in a single sentence
    gameEventObject: ${JSON.stringify(gameEvents, null, 2)},
    // This is the game event that must be retold in a single sentence
    gameEvent: \`${formatted}\`,
    // This is the game event retold in a single sentence as a story - no extra facts allowed, all nouns in the gameEvent should be mentioned and no other nouns
    // retell only the game event in a single sentence, but with some adjectives to make it interesting while still brief
    gameEventRetold: \``;
        storyState.storyHistory.push({
            id: `${id}`,
            message: `🔃`,
            eventFormatted: formatted,
            gameEvents,
            prompt: { systemPrompt, userPrompt },
        });

        const result = await sendOpenRouterAiRequest(systemPrompt, userPrompt, {
            maxTokens: 200,
            timeoutMs: 10000,
        }).catch((err) => {
            console.error(`sendOpenRouterAiRequest: ERROR`, err);
            return undefined;
        });
        const nextStoryParsed = result?.split(`\``)[0];
        const message = nextStoryParsed || formatted;
        storyState.storyHistory.splice(
            storyState.storyHistory.findIndex((x) => x.id === id),
            1,
        );
        storyState.storyHistory.push({
            id: `${id}`,
            message,
            eventFormatted: formatted,
            gameEvents,
            prompt: { systemPrompt, userPrompt, fullResponse: result },
        });

        await speakText(message, { voice: `story` });
        // }
    };

    const soundManager = createSoundManager();

    return {
        get gameRuntime() {
            return state.gameRuntime;
        },
        get loreBuilder() {
            return loreBuilder;
        },
        get gameContext() {
            return getGameContext();
        },
        get storyHistory() {
            return storyState.storyHistory;
        },
        get soundManager() {
            return soundManager;
        },
        resetGame: () => {
            gameStateStorage.remove();
            loadGameState();
        },
        startWorkout: async (workoutSession: WorkoutSession) => {
            state.workoutSession = workoutSession;
            state.stepSessionPeriods = workoutSession.steps.map(getGameSessionPeriodsFromWorkoutStep);

            state.stepIndex = 0;
            state.sessionPeriodIndex = 0;
            state.sessionPeriodRemainingSec = state.stepSessionPeriods[0]?.[0]?.durationSec ?? 0;

            const gameEvents = state.gameRuntime.triggerSessionStart({ context: getGameContext() });
            await announceGameEvents(gameEvents);
        },
        finishWorkout: async () => {
            const gameEvents = state.gameRuntime.triggerSessionEnd({ context: getGameContext() });
            await announceGameEvents(gameEvents);
        },
        startWorkoutSet: async (options: {
            setPhrase: string;
            remainingSec: number;
            stepIndex: number;
            stepPeriodIndex: number;
        }) => {
            state.stepIndex = options.stepIndex;
            state.sessionPeriodIndex = options.stepPeriodIndex;
            state.sessionPeriodRemainingSec = options.remainingSec;

            const gameEvents = state.gameRuntime.triggerWorkPeriod({ context: getGameContext() });
            await announceGameEvents(gameEvents);
        },
        finishWorkoutSet: async (options: {
            setPhrase: string;
            remainingSec: number;
            stepIndex: number;
            stepPeriodIndex: number;
        }) => {
            state.stepIndex = options.stepIndex;
            state.sessionPeriodIndex = options.stepPeriodIndex;
            state.sessionPeriodRemainingSec = options.remainingSec;

            // TODO: add workout results
            const gameEvents = state.gameRuntime.triggerRestPeriod({ context: getGameContext(), workResults: [] });
            await announceGameEvents(gameEvents);
        },

        // TODO: Implement game story runtime methods
        workoutTransition: () => {},
    };
};

export type GameStoryRuntime = ReturnType<typeof createGameStoryRuntime>;

const getGameSessionPeriodsFromWorkoutStep = (step: WorkoutStep): GameSessionPeriod[] => {
    if (step.kind === `timed`) {
        const set = [
            { kind: `work`, durationSec: step.workDurationSec, exercises: step.exercises },
            { kind: `rest`, durationSec: step.restDurationSec, exercises: [] },
        ] as GameSessionPeriod[];

        // repeat sets
        const { setCount } = step;
        return Array.from({ length: setCount }).flatMap(() => set);
    }
    if (step.kind === `rest`) {
        return [{ kind: `rest`, durationSec: step.durationSec, exercises: [] }];
    }

    console.error(`getGameSessionPeriodsFromStep: NOT IMPLEMENTED for ${step.kind}`, { step });
    return [];
};
