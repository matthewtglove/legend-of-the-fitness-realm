import { WorkoutSession, WorkoutStep, WorkoutStep_Rest, WorkoutStep_Timed } from '@lofr/workout-parser';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { speakText } from './workout-announce';
import { StoryRuntime } from '../story/story-runtime';
import { PauseIcon } from '../assets/pause-icon';
import { PlayIcon } from '../assets/play-icon';
import clickSoundUrl from '../assets/wooden-click.mp3';

const createSoundManager = () => {
    const state = {
        enabled: true,
        clickSound: new Audio(clickSoundUrl),
    };

    return {
        playClickSound: () => {
            if (!state.enabled) {
                return;
            }

            state.clickSound.play().catch((e) => console.error(`Failed to play sound:`, e));
        },
        toggleSound: () => {
            state.enabled = !state.enabled;
            // console.log(`toggleSound`, state.enabled);
            return state.enabled;
        },
    };
};

type SoundManager = ReturnType<typeof createSoundManager>;

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

    /* TODO:
    - Fix isClickSoundEnabled to update during a step
        - Currently only updates when a new step starts
    - Find out why the click sound is delayed by 1 second (without the +1 condition in the interval)
    */

    // const [isClickSoundEnabled, setIsClickSoundEnabled] = useState(true);
    // const toggleClickSound = () => {
    //     setIsClickSoundEnabled((s) => !s);
    // };

    const soundManager = useMemo(createSoundManager, []);

    return (
        <>
            <div>
                <div className="flex flex-row justify-between m-6 mb-0">
                    <div>
                        <h1 className="text-2xl">Workout Session Timer</h1>
                    </div>
                    <div>
                        <label className="m-2 text">Enable Countdown Clicks</label>
                        <input className="" type="checkbox" defaultChecked={true} onChange={soundManager.toggleSound} />
                    </div>
                </div>
                {!hasStarted && (
                    <>
                        <div className="min-h-[50vh] flex flex-col">
                            <div className="flex items-center justify-center flex-1 p-2 m-6 text-center bg-blue-200 rounded">
                                <button
                                    className={`p-2 m-6 text-white rounded hover:opacity-80 active:opacity-70 ${
                                        isStarting ? `bg-gray-500` : `bg-blue-500`
                                    }`}
                                    onClick={startWorkout}
                                    disabled={isStarting}
                                >
                                    Start Workout
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {hasStarted && (
                    <>
                        <div className="min-h-[50vh] flex flex-col">
                            {!step && (
                                <div className="p-2 m-6 text-2xl text-center rounded bg-gradient-to-br from-yellow-100 to-yellow-400 animate-bounce">
                                    Workout Complete!
                                </div>
                            )}
                            {step?.kind === `rest` && (
                                <RestTimer
                                    key={stepIndex}
                                    step={step}
                                    onDone={nextStep}
                                    storyRuntime={storyRuntime}
                                    soundManager={soundManager}
                                />
                            )}
                            {step?.kind === `timed` && (
                                <TimedTimer
                                    key={stepIndex}
                                    step={step}
                                    onDone={nextStep}
                                    storyRuntime={storyRuntime}
                                    soundManager={soundManager}
                                />
                            )}
                        </div>
                        <div>
                            <WorkoutProgressList stepIndex={stepIndex} steps={workoutSession.steps} />
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

const WorkoutProgressList = ({ stepIndex, steps }: { stepIndex: number; steps: WorkoutStep[] }) => {
    return (
        <>
            <div className="p-1 m-6 mt-0 bg-gray-200 rounded">
                {steps.map((step, i) => (
                    <div
                        key={i}
                        className={`p-1 ${
                            i === stepIndex
                                ? `bg-blue-500 text-white`
                                : i < stepIndex
                                ? `bg-blue-300`
                                : `bg-gray-200 opacity-60`
                        }`}
                    >
                        {step.kind === `rest` && `Rest: ${step.durationSec}`}
                        {step.kind === `timed` &&
                            `Timed Set: ${step.setCount} x ${step.workDurationSec}/${
                                step.restDurationSec
                            } of ${step.exercises
                                .map((x) => `${x.exerciseName} (${x.repCount} Reps${x.twoSided ? `, Both Sides` : ``})`)
                                .join(`, `)}`}
                        {/* TODO: Support other step kinds */}
                    </div>
                ))}
            </div>
        </>
    );
};

const RestTimer = ({
    step,
    onDone,
    storyRuntime,
    soundManager,
}: {
    step: WorkoutStep_Rest;
    onDone: () => void;
    storyRuntime: StoryRuntime;
    soundManager: SoundManager;
}) => {
    const [timeRemaining, setTimeRemaining] = useState(step.durationSec);
    const timeRemainingRef = useRef(timeRemaining);
    timeRemainingRef.current = timeRemaining;
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) {
                return;
            }
            if (timeRemainingRef.current === step.durationSec) {
                speakText(`Rest for ${step.durationSec} seconds`, {
                    onDone: () => storyRuntime.workoutTransition(),
                });
            }
            // Play clicking sound at 3, 2, 1 seconds
            // Question: Why is this delayed by 1 second? I had to add +1 to the condition to make it work.
            if (timeRemainingRef.current <= 3 && timeRemainingRef.current > 0) {
                soundManager.playClickSound();
            }

            if (timeRemainingRef.current <= 1) {
                clearInterval(interval);
                onDone();
                return;
            }
            if (timeRemainingRef.current === 30 && step.durationSec >= 60) {
                speakText(`30 seconds remaining.`);
            }
            setTimeRemaining(timeRemainingRef.current - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused]);
    return (
        <>
            <div
                className={`flex-1 flex flex-col p-2 m-6 text-center bg-red-300 rounded ${isPaused && `bg-opacity-60`}`}
            >
                <div className={`m-6 text-2xl ${isPaused && `opacity-60`}`}>Rest Timer</div>
                <div className={`m-6 text-6xl ${isPaused && `opacity-60`}`}>{timeRemaining}</div>
                <div className="flex flex-col items-center">
                    <button
                        className="items-center p-4 m-2 bg-blue-200 border-2 border-blue-500 rounded-full min-w-14 hover:opacity-80 active:opacity-70"
                        onClick={() => setIsPaused(!isPaused)}
                    >
                        {isPaused ? <PlayIcon /> : <PauseIcon />}
                    </button>
                    {isPaused && (
                        <button
                            className="p-2 m-4 text-white bg-red-500 rounded min-w-20 hover:opacity-80 active:opacity-70"
                            onClick={onDone}
                        >
                            Skip Step
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

const TimedTimer = ({
    step,
    onDone,
    storyRuntime,
    soundManager,
}: {
    step: WorkoutStep_Timed;
    onDone: () => void;
    storyRuntime: StoryRuntime;
    soundManager: SoundManager;
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
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) {
                return;
            }
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

            // Play clicking sound at 3, 2, 1 seconds
            // Question: Why is this delayed by 1 second? I had to add +1 to the condition to make it work.
            if (timerData.timeRemaining <= 3 + 1 && timerData.timeRemaining > 0) {
                soundManager.playClickSound();
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
    }, [isPaused]);
    const { mode, timeRemaining, stepSetIndex } = timerDataRef.current;
    return (
        <>
            <div
                className={`flex-1 flex flex-col p-2 m-6 text-center ${
                    mode === `work` ? `bg-green-300` : `bg-red-300`
                } rounded ${isPaused && `bg-opacity-60`}`}
            >
                <div className={`m-6 text-2xl ${isPaused && `opacity-60`}`}>
                    {mode === `work` ? `Exercise!` : `Rest`}
                </div>
                <div className={`m-2 text-4xl ${isPaused && `opacity-60`}`}>
                    {stepSetIndex + 1} / {step.setCount}
                </div>
                <div className={`m-4 text-6xl ${isPaused && `opacity-60`}`}>{timeRemaining}</div>
                <div className="flex flex-col items-center">
                    <button
                        className="items-center p-4 m-2 bg-blue-200 border-2 border-blue-500 rounded-full min-w-14 hover:opacity-80 active:opacity-70"
                        onClick={() => setIsPaused(!isPaused)}
                    >
                        {isPaused ? <PlayIcon /> : <PauseIcon />}
                    </button>
                    {isPaused && (
                        <button
                            className="p-2 m-4 text-white bg-red-500 rounded min-w-20 hover:opacity-80 active:opacity-70"
                            onClick={onDone}
                        >
                            Skip Step
                        </button>
                    )}
                </div>
                <div className="flex-1"></div>
                <div>
                    {step.exercises.map((x) => (
                        <Fragment key={x.exerciseName}>
                            <div
                                className={`m-4 text-lg bg-orange-200 border-2 border-orange-300 rounded ${
                                    isPaused && `opacity-60`
                                }`}
                            >
                                {x.exerciseName} ({x.repCount} Reps{x.twoSided && `, Both Sides`})
                            </div>
                        </Fragment>
                    ))}
                </div>
            </div>
        </>
    );
};
