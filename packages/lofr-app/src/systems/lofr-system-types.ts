import { WorkoutSession, WorkoutStep } from "@lofr/workout-parser";

/**

# Systems

-   WorkoutBuilder: A workout builder experience that allows controlling your workout program
    -   supports a custom workout languange for defining a workout as a text document
    -   game like ui for defining the workout program
-   WorkoutTimer: The workout timer logic and state that runs through a single workout session and exposes information for the ui
    -   intended to provide ui data for any workout game:
        -   workout overall time
        -   current exercise or rest display info
        -   current step time remaining
        -   next exercise (during rest)
-   WorkoutGame: An auto-play game that can run during a workout session
    -   uses the workout timer to display workout ui information
    -   knows the workout session plan
    -   can react to workout signals
        -   the user is beginning set of 1 of 12 for 90 seconds
        -   the user finished a set with great performance and will begin a rest for 30 seconds
        -   the user is beginning set 9 of 12
    -   can handle voice commands to control workout
    -   can allow playlist as background music
    -   settings to allow volume control over sound effects and trainer voice
    -   skinnable to match narrative
    -   can have placeholders to inject short narrative story telling
        -   alternatively could be a fully voiced experience
            -   to fit in a narrative plotline, the narrative context would need to explain "daily trianing" or a "daily battle" somehow in a way that helps explain why is does not fit in the normal plotline
-   MiniGame: A short game for non-workout activity
    -   Example opportunities for mini games:
        -   Night Prep: Sleep planning, Wakeup alarm commitement, Morning Prep
        -   Morning Checkin: Charge energy, morning stretch, encouragement
        -   Workout Warm Up
        -   Workout Cool Down
    -   skinnable to match narrative
    -   intended to allow a longer story telling session
-   Narrative Engine: The narrative generator which provides a plotline and world consistency
    -   primary narration occurs during cut-scenes told during:
        -   workout warm-up stretch
        -   workout cool-down stretch
        -   morning stretch (possibly only on non-workout days)
        -   night planning (every night for sleep cycle planning and workout prep)
    -   short narrative injections might occur during a workout (like a boss fight)
    -   plotlines
        -   can be a purely llm controlled narrative (no plotline generation, history only llm prompting)
        -   can be an open narrative without a predefined plotline (using jit plotline generation and world building)
        -   can be a linear narrative with a predetermined plotline
    -   can provide skins for the WorkoutGame and other MiniGames

 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type LofrSystemTypes = unknown;

type Observable<T> = {
    get lastValue(): undefined | T;
    subscribe: (callback: (value: T) => void) => { unsubscribe: () => void };
};

export type LofrWorkoutSessionInfo = {
    title: string;
    subSteps: LofrWorkoutSubStepInfo[];
    _sourceWorkoutSession: WorkoutSession;
};

export type LofrWorkoutSubStepInfo = {
    kind: `rest` | `exercise`;
    title: string;
    durationSec: undefined | number;

    stepIndex: number;
    stepCount: number;
    subStepIndex: number;
    subStepCount: number;
    totalSubStepIndex: number;
    totalSubStepCount: number;

    _sourceStep: WorkoutStep;
};

export type LofrWorkoutTimer = {
    loadWorkoutSession: (workoutSession: WorkoutSession) => void;
    getWorkoutSessionInfo: () => undefined | LofrWorkoutSessionInfo;

    run: () => void;
    pause: () => void;
    observeRunState: () => Observable<`idle` | `running` | `paused` | `completed`>;

    gotoSubStep: (subStepIndex: number) => void;
    previousSubStep: () => void;
    nextSubStep: () => void;

    /** complete a non time based sub step */
    completeSubStep: () => void;

    setActiveSubStepRemainingTimeSec: (timeSec: number) => void;
    restartActiveSubStep: () => void;
    addTimeSec: (timeSec: number) => void;
    skipTimeSec: (timeSec: number) => void;

    observeWorkoutElapsedTimeSec: () => Observable<number>;
    observeWorkoutRemainingTimeSec: () => Observable<number>;

    observeActiveSubStepIndex: () => Observable<number>;
    observeActiveSubStep: () => Observable<undefined | LofrWorkoutSubStepInfo>;
    observeActiveSubStepElapsedTimeSec: () => Observable<number>;
    observeActiveSubStepRemainingTimeSec: () => Observable<undefined | number>;

    observeNextSubStep: () => Observable<undefined | LofrWorkoutSubStepInfo>;
};

export type LofrWorkoutGameTheme = {
    assets: {
        key: string;
        url: string;
        type: `image` | `audio`;
        data: Record<string, unknown>;
    }[];
};

export type LofrWorkoutGame = {
    title: string;
    defaultTheme: LofrWorkoutGameTheme;
    load: () => Promise<{
        GameComponent: React.ComponentType<{
            workoutTimer: LofrWorkoutTimer,
            theme?: LofrWorkoutGameTheme,
        }>;
    }>
};

export type LofrMiniGame = {
    title: string;
    defaultTheme: LofrWorkoutGameTheme;
    load: () => Promise<{
        GameComponent: React.ComponentType<{
            theme?: LofrWorkoutGameTheme,
        }>;
    }>
};

export type LofrWorkoutBuilder = {
    title: string;
    defaultTheme: LofrWorkoutGameTheme;
    load: () => Promise<{
        GameComponent: React.ComponentType<{
            value: undefined | WorkoutSession,
            onChange: (workoutSession: WorkoutSession) => void,
            theme?: LofrWorkoutGameTheme,
        }>;
    }>
};

// TODO: add narrative engine types