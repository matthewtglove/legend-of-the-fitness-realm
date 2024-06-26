import { splitWithRegex } from './string-utils';

export type WorkoutProgram = {
    name: string;
    segments: WorkoutProgramSegment[];
};

export type WorkoutProgramSegment = {
    name: string;
    timeFrame: `week`;
    sessions: WorkoutSession[];
};

export type WorkoutSession = {
    name: string;
    timeFrame: `day`;
    steps: WorkoutStep[];
};

export type WorkoutSetExercise = {
    repCount: number;
    exerciseName: string;
    twoSided?: boolean;
};

export type WorkoutStep =
    | WorkoutStep_Rest
    | WorkoutStep_Timed
    | WorkoutStep_Interval
    | WorkoutStep_Superset
    | WorkoutStep_Ladder
    | WorkoutStep_Tabata
    | WorkoutStep_Stapper;

export type WorkoutStep_Rest = {
    kind: `rest`;
    durationSec: number;
};

/**
 * `timed x4 30s/30s 12rep Push-Ups`
 */
export type WorkoutStep_Timed = {
    kind: `timed`;
    setCount: number;
    workDurationSec: number;
    restDurationSec: number;
    exercises: WorkoutSetExercise[];
};

/**
 * `interval x4 3m 12rep Push-Ups`
 */
export type WorkoutStep_Interval = {
    kind: `interval`;
    setCount: number;
    setDurationSec: number;
    exercises: WorkoutSetExercise[];
};

/**
 * `superset x4 4m 5rep Push-Ups / 12rep Lunge`
 */
export type WorkoutStep_Superset = {
    kind: `superset`;
    setCount: number;
    setDurationSec: number;
    exercises: WorkoutSetExercise[];
};

/**
 * `ladder 7m30s 6-12rep Squats`
 */
export type WorkoutStep_Ladder = {
    kind: `ladder`;
    durationSec: number;
    repRange: { min: number; max: number };
    exercise: {
        exerciseName: string;
        twoSided?: boolean;
    };
};

/**
 * `tabata 4m 20s/10s Push-Ups`
 */
export type WorkoutStep_Tabata = {
    kind: `tabata`;
    durationSec: number;
    workDurationSec: number;
    restDurationSec: number;
    exercise: {
        exerciseName: string;
        twoSided?: boolean;
    };
};

/**
 * `stapper 20m 4rep Pull ups / 12rep Push-Ups / 12rep Lunges`
 */
export type WorkoutStep_Stapper = {
    kind: `stapper`;
    durationSec: number;
    exercises: WorkoutSetExercise[];
};

// const _exampleUsage = (workoutProgram: WorkoutProgram) => {
//     const step = workoutProgram.segments[0].sessions[0].steps[0];
//     if (step.kind === `rest`) {
//         console.log(`Rest for ${step.durationSec} seconds`);
//         return;
//     }
//     if (step.kind === `timed`) {
//         console.log(
//             `Do ${step.setCount} sets of ${step.exercises.length} exercises for ${step.workDurationSec} seconds each`,
//         );
//         return;
//     }
//     //
// };

export const parseWorkoutDocument = (document: string): WorkoutProgram => {
    const lines = document
        .split(`\n`)
        .map((line) => line.trim())
        .filter((line) => line.trim() !== ``)
        .filter((line) => !line.startsWith(`//`));

    const workoutProgram: WorkoutProgram = {
        name: ``,
        segments: [],
    };

    for (const line of lines) {
        if (line.startsWith(`# `)) {
            workoutProgram.name = line.slice(`# `.length).trim();
            continue;
        }

        if (line.startsWith(`## `)) {
            const segment: WorkoutProgramSegment = {
                name: line.slice(`## `.length).trim(),
                timeFrame: `week`,
                sessions: [],
            };
            workoutProgram.segments.push(segment);
            continue;
        }

        const lastSegment = workoutProgram.segments[workoutProgram.segments.length - 1];
        if (!lastSegment) {
            throw new Error(`No segment found`);
        }
        if (line.startsWith(`### `)) {
            const session: WorkoutSession = {
                name: line.slice(`### `.length).trim(),
                timeFrame: `day`,
                steps: [],
            };
            lastSegment.sessions.push(session);
            continue;
        }

        const lastSession = lastSegment.sessions[lastSegment.sessions.length - 1];
        if (!lastSession) {
            throw new Error(`No session found`);
        }

        // --- Steps ---

        if (line.startsWith(`- rest `)) {
            const rest: WorkoutStep_Rest = {
                kind: `rest`,
                durationSec: parseTimeSpan(line.slice(`- rest `.length).trim()).seconds,
            };
            lastSession.steps.push(rest);
            continue;
        }

        if (line.startsWith(`- timed `)) {
            // const timedRegex = /^- timed ((?:x|\d)+) ((?:\d|m|s)+)\/((?:\d|m|s)+) (\d+)rep\w* (2sided )?(.+)$/;
            const timedRegex = /^- timed ((?:x|\d)+) ((?:\d|m|s)+)\/((?:\d|m|s)+) (.+)$/;
            const match = line.match(timedRegex);
            if (!match) {
                throw new Error(`Invalid timed step: ${line}`);
            }
            const [
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                _,
                setCountPart,
                workDurationPart,
                restDurationPart,
                exerciseParts,
            ] = match;

            if (!exerciseParts || !setCountPart || !workDurationPart || !restDurationPart) {
                throw new Error(`Invalid timed step: ${line}`);
            }

            const exercises = parseExercises(exerciseParts);

            const timed: WorkoutStep_Timed = {
                kind: `timed`,
                setCount: parseInt(setCountPart.replace(`x`, ``)),
                workDurationSec: parseTimeSpan(workDurationPart).seconds,
                restDurationSec: parseTimeSpan(restDurationPart).seconds,
                exercises,
            };
            lastSession.steps.push(timed);
            continue;
        }
    }

    return workoutProgram;
};

const parseTimeSpan = (timeSpan: string): { seconds: number } => {
    // `1m30s` -> { seconds: 90 }
    // `10s` -> { seconds: 10 }
    // `120s` -> { seconds: 120 }
    const timeRegex = /^(?:(\d+)m)?(?:(\d+)s)?$/;
    const match = timeSpan.match(timeRegex);
    if (!match) {
        throw new Error(`Invalid time span: ${timeSpan}`);
    }
    const minutes = parseInt(match[1] ?? `0`);
    const seconds = parseInt(match[2] ?? `0`);
    const totalSeconds = minutes * 60 + seconds;
    return { seconds: totalSeconds };
};

const parseExercises = (exerciseParts: string): WorkoutSetExercise[] => {
    // (\d+)rep\w* (2sided )?
    // Only split into multiple exercises if `/` is followed by `12rep` or similar
    return splitWithRegex(exerciseParts, /\/\s*(\d+rep\w*)/g).map((part) => {
        const text = (part.matchBefore ?? ``) + part.part;
        const match = text.match(/^\/?\s*(\d+)rep\w* (2sided )?(.+)$/);
        if (!match) {
            throw new Error(`Invalid exercise: ${text}`);
        }
        const [, repCountPart, twoSidedPart, exerciseNamePart] = match;
        if (!repCountPart || !exerciseNamePart) {
            throw new Error(`Invalid exercise part: ${text}`);
        }
        return {
            repCount: parseInt(repCountPart),
            twoSided: !!twoSidedPart,
            exerciseName: exerciseNamePart,
        } satisfies WorkoutSetExercise;
    });
};
