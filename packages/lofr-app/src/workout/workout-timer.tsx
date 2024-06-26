import { WorkoutSession, WorkoutStep_Rest, WorkoutStep_Timed } from '@lofr/workout-parser';
import { Fragment, useEffect, useRef, useState } from 'react';
import { speakText } from './workout-announce';
import { StoryRuntime } from '../story/story-runtime';

export const WorkoutSessionTimer = ({
    workoutSession,
    storyRuntime,
}: {
    workoutSession: WorkoutSession;
    storyRuntime: StoryRuntime;
}) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const step = workoutSession.steps[stepIndex];
    const nextStep = () => {
        console.log(`nextStep`);
        setStepIndex((index) => index + 1);
    };
    const startWorkout = () => {
        setIsStarting(true);
        // console.log(`WorkoutSessionTimer.startWorkout`, {
        //     questContext: storyRuntime.questContext,
        //     storyRuntime: storyRuntime,
        // });

        speakText(`Start Workout!`, {
            onDone: () => {
                setHasStarted(true);
                storyRuntime.startWorkout();
            },
        });
    };
    if (!hasStarted) {
        return (
            <>
                <div>
                    <div>
                        <h1 className="m-6 text-2xl">Workout Session Timer</h1>
                    </div>
                    <div className="min-h-[50vh] flex flex-col">
                        <div className="flex items-center justify-center flex-1 p-2 m-6 text-center bg-blue-200 rounded">
                            <button
                                className={`p-2 m-6 text-white ${isStarting ? `bg-gray-500` : `bg-blue-500`}`}
                                onClick={startWorkout}
                                disabled={isStarting}
                            >
                                Start Workout
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }
    return (
        <>
            <div>
                <div>
                    <h1 className="m-6 text-2xl">Workout Session Timer</h1>
                </div>
                <div className="min-h-[50vh] flex flex-col">
                    {!step && (
                        <div className="p-2 m-6 text-2xl text-center rounded bg-gradient-to-br from-yellow-100 to-yellow-400 animate-bounce">
                            Workout Complete!
                        </div>
                    )}
                    {step?.kind === `rest` && (
                        <RestTimer key={stepIndex} step={step} onDone={nextStep} storyRuntime={storyRuntime} />
                    )}
                    {step?.kind === `timed` && (
                        <TimedTimer key={stepIndex} step={step} onDone={nextStep} storyRuntime={storyRuntime} />
                    )}
                </div>
            </div>
        </>
    );
};

const RestTimer = ({
    step,
    onDone,
    storyRuntime,
}: {
    step: WorkoutStep_Rest;
    onDone: () => void;
    storyRuntime: StoryRuntime;
}) => {
    const [timeRemaining, setTimeRemaining] = useState(step.durationSec);
    const timeRemainingRef = useRef(timeRemaining);
    timeRemainingRef.current = timeRemaining;
    useEffect(() => {
        const interval = setInterval(() => {
            if (timeRemainingRef.current === step.durationSec) {
                speakText(`Rest for ${step.durationSec} seconds`, {
                    onDone: () => storyRuntime.workoutTransition(),
                });
            }

            if (timeRemainingRef.current <= 1) {
                clearInterval(interval);
                onDone();
                return;
            }
            setTimeRemaining(timeRemainingRef.current - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    return (
        <>
            <div className="flex-1 p-2 m-6 text-center bg-red-300 rounded">
                <div className="m-6 text-2xl">Rest Timer</div>
                <div className="m-6 text-6xl">{timeRemaining}</div>
                <button className="p-2 text-white bg-blue-500" onClick={onDone}>
                    Skip
                </button>
            </div>
        </>
    );
};

const TimedTimer = ({
    step,
    onDone,
    storyRuntime,
}: {
    step: WorkoutStep_Timed;
    onDone: () => void;
    storyRuntime: StoryRuntime;
}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [renderId, setRenderId] = useState(0);
    const timerDataRef = useRef({
        hasStarted: false,
        isPending: false,
        stepSetIndex: 0,
        mode: `work` as `work` | `rest`,
        timeRemaining: step.workDurationSec,
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const exercisePhrase = `${step.exercises.map((x) => `${x.repCount} "${x.exerciseName}"`).join(` and `)}.`;

            const timerData = timerDataRef.current;
            if (timerData.isPending) {
                return;
            }

            if (!timerData.hasStarted) {
                timerData.isPending = true;
                speakText(`Start of ${step.setCount} timed sets. ${exercisePhrase} Exercise!`, {
                    onDone: () => {
                        timerData.isPending = false;
                        timerData.hasStarted = true;
                        setRenderId((id) => id + 1);
                        storyRuntime.startWorkoutSet(exercisePhrase);
                    },
                });
                setRenderId((id) => id + 1);
                return;
            }

            if (timerData.timeRemaining > 1) {
                timerData.timeRemaining--;
                setRenderId((id) => id + 1);
                return;
            }
            // Swtich to next mode
            if (timerData.mode === `work`) {
                speakText(`Rest`, {
                    onDone: () => {
                        storyRuntime.finishWorkoutSet(exercisePhrase, 0, `success`);
                    },
                });
                timerData.mode = `rest`;
                timerData.timeRemaining = step.restDurationSec;
                setRenderId((id) => id + 1);
                return;
            }

            // Switch to next set (if not on last set)
            if (timerData.stepSetIndex + 1 < step.setCount) {
                speakText(`${exercisePhrase}`, {
                    onDone: () => {
                        storyRuntime.startWorkoutSet(exercisePhrase);
                    },
                });
                timerData.stepSetIndex++;
                timerData.mode = `work`;
                timerData.timeRemaining = step.workDurationSec;
                setRenderId((id) => id + 1);
                return;
            }

            // Done
            speakText(`Done with step`);
            clearInterval(interval);
            onDone();
            return;
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const { mode, timeRemaining, stepSetIndex } = timerDataRef.current;
    return (
        <>
            <div
                className={`flex-1 flex flex-col p-2 m-6 text-center ${
                    mode === `work` ? `bg-green-300` : `bg-red-300`
                } rounded`}
            >
                <div className="m-6 text-2xl">{mode === `work` ? `Exercise!` : `Rest`}</div>
                <div className="m-2 text-4xl">
                    {stepSetIndex + 1} / {step.setCount}
                </div>
                <div className="m-4 text-6xl">{timeRemaining}</div>
                <div>
                    <button className="p-2 m-2 text-white bg-blue-500" onClick={onDone}>
                        Skip
                    </button>
                </div>
                <div className="flex-1"></div>
                <div>
                    {step.exercises.map((x) => (
                        <Fragment key={x.exerciseName}>
                            <div className="m-4 bg-orange-200 border-2 border-orange-300 rounded">
                                {x.repCount} Reps: {x.exerciseName} {x.twoSided ? `[Both Sides]` : ``}
                            </div>
                        </Fragment>
                    ))}
                </div>
            </div>
        </>
    );
};
