import { LofrDirectorState, LofrGameTheme } from './lofr-system-types';
import { createObservable, Subject, useObservable } from './observable';

const gameActivities = [`main`, `mini-game`, `workout-game`, `workout-builder`] as const;

export const createDirectorStateDebug = () => {
    const state = {
        gameActivity: createObservable<(typeof gameActivities)[number]>(`main`),
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

export const DirectorStateDebugView = ({
    directorState,
}: {
    directorState: undefined | Partial<LofrDirectorState>;
}) => {
    const gameActivity = useObservable(directorState?.observeGameActivity?.());
    const gamePaused = useObservable(directorState?.observeGamePaused?.());
    const theme = useObservable(directorState?.observeTheme?.());

    return (
        <>
            <div className="flex flex-col w-full h-full gap-1 p-2 border border-gray-400 rounded bg-slate-200">
                <div className="font-bold">Director State:</div>
                <div className="">Game Activity: {gameActivity}</div>
                <select
                    className=""
                    value={gameActivity}
                    onChange={(e) => {
                        const value = e.target.value as (typeof gameActivities)[number];
                        const activityObservable = directorState?.observeGameActivity?.() as
                            | Subject<(typeof gameActivities)[number]>
                            | undefined;
                        activityObservable?.next(value);
                    }}
                >
                    {gameActivities.map((activity) => (
                        <option key={activity} value={activity}>
                            {activity}
                        </option>
                    ))}
                </select>
                <div className="flex flex-row items-center gap-1">
                    <button
                        className="px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                        onClick={() => {
                            const pausedObservable = directorState?.observeGamePaused?.() as
                                | Subject<boolean>
                                | undefined;
                            pausedObservable?.next(!gamePaused);
                        }}
                    >
                        {gamePaused ? `Unpause Game` : `Pause Game`}
                    </button>
                    <div className="text-sm text-red-700">{gamePaused ? `Game Paused` : ``}</div>
                </div>
                <div className="">Theme: {theme ? JSON.stringify(theme) : `None`}</div>
            </div>
        </>
    );
};
