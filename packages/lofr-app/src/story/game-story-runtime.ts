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
    GameEvent,
} from '@lofr/game';
import { WorkoutSession, WorkoutStep } from '@lofr/workout-parser';
import { speakText } from '../workout/workout-announce';
import { sendOpenRouterAiRequest } from './call-llm';
import { cloneDeep } from '../../../game/dist/src/deep-obj';
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
        storyHistory: [] as { id: string; eventFormatted: string; message?: string; event: GameEvent }[],
    };

    const announceGameEvents = async (gameEvents: GameEventResponse) => {
        console.log(`accountGameEvents`, { gameRuntimeState: cloneDeep(state.gameRuntime.state), state });

        for (const event of gameEvents.events) {
            const formatted = formatGameEventMessage(event);
            console.log(`startWorkout: gameEvent: ${event.kind}`, event);

            const id = `${storyState.iNextId++}`;

            const previousStory = storyState.storyHistory
                .slice(-5)
                .map((x) => `${x.message}\n`)
                .join(``);

            storyState.storyHistory.push({ id: `${id}`, message: `🔃`, eventFormatted: formatted, event });

            const result = await sendOpenRouterAiRequest(
                `You are a dungeun master for a game. You must add a single sentance to summarize the game event. DO NOT ADD EXTRA FACTS! Describe only the facts in the event`,
                `Previous Story:\n${previousStory}\nGame Event: '${formatted}'\n\nNext Story Sentance to Summarize Only the Event:`,
                {
                    maxTokens: 200,
                    timeoutMs: 10000,
                },
            );

            const message = result ?? formatted;
            storyState.storyHistory.splice(
                storyState.storyHistory.findIndex((x) => x.id === id),
                1,
            );
            storyState.storyHistory.push({ id: `${id}`, message, eventFormatted: formatted, event });

            await speakText(message, { voice: `story` });
        }
    };

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
