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
import { QuestEventStorySuccessLevel } from './prompts/story-prompt';
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

    const announceGameEvents = (gameEvents: GameEventResponse, onDone: () => void) => {
        console.log(`accountGameEvents`, { gameRuntimeState: JSON.parse(JSON.stringify(gameRuntime.state)), state });
        gameEvents.events.forEach((event) => {
            const formatted = formatGameEventMessage(event);
            console.log(`startWorkout: gameEvent: ${event.kind}`, event);
            // console.log(formatted);

            speakText(formatted, { voice: `story`, onDone });
        });
    };

    return {
        startWorkout: (workoutSession: WorkoutSession, { onDone }: { onDone: () => void }) => {
            state.workoutSession = workoutSession;
            state.stepIndex = 0;
            state.stepSessionPeriods = workoutSession.steps.map(getGameSessionPeriodsFromWorkoutStep);
            state.sessionPeriodIndex = 0;
            state.sessionPeriodRemainingSec = state.stepSessionPeriods[0]?.[0]?.durationSec ?? 0;

            const gameEvents = gameRuntime.triggerSessionStart({ context: getGameContext() });
            announceGameEvents(gameEvents, onDone);
        },
        finishWorkout: ({ onDone }: { onDone: () => void }) => {
            const gameEvents = gameRuntime.triggerSessionEnd({ context: getGameContext() });
            announceGameEvents(gameEvents, onDone);
        },
        // TODO: Implement game story runtime methods
        workoutTransition: () => {},
        startWorkoutSet: (nextSet: string) => {
            console.log(`startWorkoutSet`, { nextSet });
        },
        finishWorkoutSet: (
            finishedSet: string,
            workoutSessionProgress: number,
            successLevel?: QuestEventStorySuccessLevel,
        ) => {
            console.log(`finishWorkoutSet`, { finishedSet, workoutSessionProgress, successLevel });
        },
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
