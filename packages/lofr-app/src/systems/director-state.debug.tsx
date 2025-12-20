import { LofrDirectorState, LofrGameTheme } from './lofr-system-types';
import { createObservable } from './observable';

export const createDirectorStateDebug = () => {
    const state = {
        gameActivity: createObservable<`main` | `mini-game` | `workout-game` | `workout-builder`>(`main`),
        gamePaused: createObservable<boolean>(false),
        theme: createObservable<undefined | LofrGameTheme>(undefined),
    };

    const service: LofrDirectorState = {
        observeGameActivity: () => state.gameActivity,
        observeGamePaused: () => state.gamePaused,
        observeTheme: () => state.theme,
    };

    return { directorState: service };
};
