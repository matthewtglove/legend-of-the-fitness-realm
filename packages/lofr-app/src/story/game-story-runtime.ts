import {
    createEmptyGameState,
    createGameBattleProvider,
    createGameLoreProvider,
    createGameRuntime,
    GameEventResponse,
    GameRuntimeContext,
    formatGameEventMessage,
    GameSessionPeriod,
} from '@lofr/game';
import { WorkoutSession, WorkoutStep } from '@lofr/workout-parser';
import { speakText } from '../workout/workout-announce';

export const createGameStoryRuntime = () => {
    const gameRuntime = createGameRuntime(createEmptyGameState(), createGameLoreProvider(), createGameBattleProvider());
    gameRuntime.createPlayer({
        characterName: `Rick the Rock Breaker`,
        characterRace: `Human`,
        characterClass: `Barbarian`,
        level: 1,
    });
    gameRuntime.createPlayer({
        characterName: `Matthew the Musical`,
        characterRace: `Elf`,
        characterClass: `Bard`,
        level: 1,
    });

    const state = {
        workoutSession: undefined as undefined | WorkoutSession,
        stepIndex: 0,
        stepSessionPeriods: [] as GameSessionPeriod[][],
        sessionPeriodIndex: 0,
        sessionPeriodRemainingSec: 0,
    };

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
            sessionPlayers: gameRuntime.state.players.map((player) => ({
                isLocal: true,
                player: player.id,
            })),
        };
    };

    const announceGameEvents = async (gameEvents: GameEventResponse) => {
        console.log(`accountGameEvents`, { gameRuntimeState: JSON.parse(JSON.stringify(gameRuntime.state)), state });

        for (const event of gameEvents.events) {
            const formatted = formatGameEventMessage(event);
            console.log(`startWorkout: gameEvent: ${event.kind}`, event);
            // console.log(formatted);

            await speakText(formatted, { voice: `story` });
        }
    };

    return {
        startWorkout: async (workoutSession: WorkoutSession) => {
            state.workoutSession = workoutSession;
            state.stepSessionPeriods = workoutSession.steps.map(getGameSessionPeriodsFromWorkoutStep);

            state.stepIndex = 0;
            state.sessionPeriodIndex = 0;
            state.sessionPeriodRemainingSec = state.stepSessionPeriods[0]?.[0]?.durationSec ?? 0;

            const gameEvents = gameRuntime.triggerSessionStart({ context: getGameContext() });
            await announceGameEvents(gameEvents);
        },
        finishWorkout: async () => {
            const gameEvents = gameRuntime.triggerSessionEnd({ context: getGameContext() });
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

            const gameEvents = gameRuntime.triggerWorkPeriod({ context: getGameContext() });
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
            const gameEvents = gameRuntime.triggerRestPeriod({ context: getGameContext(), workResults: [] });
            await announceGameEvents(gameEvents);
        },

        // TODO: Implement game story runtime methods
        workoutTransition: () => {},
    };
};

export type GameStoryRuntime = ReturnType<typeof createGameStoryRuntime>;

const getGameSessionPeriodsFromWorkoutStep = (step: WorkoutStep): GameSessionPeriod[] => {
    if (step.kind === `timed`) {
        return [
            { kind: `work`, durationSec: step.workDurationSec },
            { kind: `rest`, durationSec: step.restDurationSec },
        ];
    }
    if (step.kind === `rest`) {
        return [{ kind: `rest`, durationSec: step.durationSec }];
    }

    console.error(`getGameSessionPeriodsFromStep: NOT IMPLEMENTED for ${step.kind}`, { step });
    return [];
};
