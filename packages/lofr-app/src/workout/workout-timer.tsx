import { WorkoutSession, WorkoutStep, WorkoutStep_Rest, WorkoutStep_Timed } from '@lofr/workout-parser';
import { Fragment, useEffect, useRef, useState } from 'react';
import { speakText } from './workout-announce';
import { GameStoryRuntime } from '../story/game-story-runtime';
import { PauseIcon } from '../assets/pause-icon';
import { PlayIcon } from '../assets/play-icon';
import { useStableCallback } from '../components/use-stable-callback';

export const WorkoutSessionTimer = ({
    workoutSession,
    storyRuntime,
}: {
    workoutSession: WorkoutSession;
    storyRuntime: GameStoryRuntime;
}) => {
    const [hasStarted, setHasStarted] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const step = workoutSession.steps[stepIndex];
    const nextStep = useStableCallback(() => {
        console.log(`nextStep`);
        setStepIndex((index) => index + 1);
    });
    const startWorkout = useStableCallback(async () => {
        setIsStarting(true);
        // console.log(`WorkoutSessionTimer.startWorkout`, {
        //     questContext: storyRuntime.questContext,
        //     storyRuntime: storyRuntime,
        // });

        await speakText(`Start Workout!`, {});
        await storyRuntime.startWorkout(workoutSession);
        setHasStarted(true);
    });

    // const [isClickSoundEnabled, setIsClickSoundEnabled] = useState(true);
    // const toggleClickSound = () => {
    //     setIsClickSoundEnabled((s) => !s);
    // };

    return (
        <>
            <div>
                <div className="flex flex-row justify-between m-6 mb-0">
                    <div>
                        <h1 className="text-2xl">Workout Session Timer</h1>
                    </div>
                    <div className="flex flex-row items-center">
                        <label className="m-2 text">Countdown Clicks</label>
                        <input
                            className=""
                            type="checkbox"
                            defaultChecked={true}
                            onChange={storyRuntime.soundManager.toggleSound}
                        />
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
                        <div>
                            <WorkoutProgressList stepIndex={stepIndex} steps={workoutSession.steps} />
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
                                <RestTimer key={stepIndex} step={step} onDone={nextStep} storyRuntime={storyRuntime} />
                            )}
                            {step?.kind === `timed` && (
                                <TimedTimer
                                    key={stepIndex}
                                    step={step}
                                    stepIndex={stepIndex}
                                    onDone={nextStep}
                                    storyRuntime={storyRuntime}
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

const CircularPieTimer = ({
    timeTotal,
    timeRemaining,
    progressColor = `tomato`,
    trackColor = `#eee`,
}: {
    timeTotal: number;
    timeRemaining: number;
    progressColor?: string;
    trackColor?: string;
}) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const ratioComplete = 1 - timeRemaining / timeTotal;

    return (
        <div className="text-4xl">
            <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} fill="none" stroke={trackColor} strokeWidth="10" />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={progressColor}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={-circumference * ratioComplete}
                    transform="rotate(-90 60 60)"
                />
                <text
                    style={{ fontFamily: `monospace` }}
                    enableBackground="true"
                    x="60"
                    y="60"
                    textAnchor="middle"
                    alignmentBaseline="central"
                >
                    {timeRemaining}
                </text>
            </svg>
        </div>
    );
};

const RestTimer = ({
    step,
    onDone,
    storyRuntime,
}: {
    step: WorkoutStep_Rest;
    onDone: () => void;
    storyRuntime: GameStoryRuntime;
}) => {
    const timeTotal = step.durationSec;
    const [timeRemaining, setTimeRemaining] = useState(timeTotal);
    const timeRemainingRef = useRef(timeRemaining);
    timeRemainingRef.current = timeRemaining;
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;

    useEffect(() => {
        const interval = setInterval(async () => {
            if (isPausedRef.current) {
                return;
            }
            const timeRemainingAtTick = timeRemainingRef.current;
            setTimeRemaining(timeRemainingAtTick - 1);

            // Play tick sound at 3, 2, 1 seconds
            // Question: Why is this delayed by 1 second? I had to add +1 to the condition to make it work.
            if (timeRemainingAtTick <= 3 && timeRemainingAtTick > 0) {
                storyRuntime.soundManager.playTickSound();
            }
            // Play ambient sound every 15 seconds
            else if (timeRemainingAtTick % 15 === 1) {
                storyRuntime.soundManager.playAmbientSound();
            }

            if (timeRemainingAtTick <= 1) {
                clearInterval(interval);
                onDone();
                return;
            }

            if (timeRemainingAtTick === timeTotal) {
                await speakText(`Rest for ${timeTotal} seconds`);
                storyRuntime.workoutTransition();
            }
            if (timeRemainingAtTick === 30 && timeTotal >= 60) {
                await speakText(`30 seconds remaining.`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [onDone, storyRuntime, timeTotal]);

    return (
        <>
            <div
                className={`flex-1 flex flex-col p-2 m-6 items-center text-center bg-red-200 rounded ${
                    isPaused && `bg-opacity-60`
                }`}
            >
                <div className={`m-6 text-2xl ${isPaused && `opacity-60`}`}>Rest Timer</div>
                {/* <div className={`m-6 text-6xl ${isPaused && `opacity-60`}`}>{timeRemaining}</div> */}
                <div className={`m-6 ${isPaused && `opacity-60`}`}>
                    <CircularPieTimer
                        timeTotal={timeTotal}
                        timeRemaining={timeRemaining}
                        progressColor="#ef4444"
                        trackColor="#fecaca"
                    />
                </div>
                <div className="flex flex-col items-center">
                    <button
                        className="items-center p-3 m-2 bg-blue-200 border-2 border-blue-500 rounded-full min-w-14 hover:opacity-80 active:opacity-70"
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
    stepIndex,
    onDone,
    storyRuntime,
}: {
    step: WorkoutStep_Timed;
    stepIndex: number;
    onDone: () => void;
    storyRuntime: GameStoryRuntime;
}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [renderId, setRenderId] = useState(0);
    const timerDataRef = useRef({
        hasStarted: false,
        isPending: false,
        stepSetIndex: 0,
        mode: `work` as `work` | `rest`,
        timeTotal: step.workDurationSec,
        timeRemaining: step.workDurationSec,
    });
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;

    useEffect(() => {
        const interval = setInterval(async () => {
            if (isPausedRef.current) {
                return;
            }
            const exercisePhrase = `${step.exercises.map((x) => `${x.repCount} "${x.exerciseName}"`).join(` and `)}.`;

            const timerData = timerDataRef.current;
            if (timerData.isPending) {
                return;
            }

            if (!timerData.hasStarted) {
                timerData.isPending = true;
                setRenderId((id) => id + 1);

                await speakText(`Start of ${step.setCount} timed sets. ${exercisePhrase} Exercise!`, {});
                timerData.isPending = false;
                timerData.hasStarted = true;
                setRenderId((id) => id + 1);
                void storyRuntime.startWorkoutSet({
                    setPhrase: exercisePhrase,
                    remainingSec: timerData.timeRemaining,
                    stepIndex,
                    stepPeriodIndex: 0,
                });

                return;
            }

            // Play tick sound at 3, 2, 1 seconds
            // Question: Why is this delayed by 1 second? I had to add +1 to the condition to make it work.
            if (timerData.timeRemaining <= 3 + 1 && timerData.timeRemaining > 0) {
                storyRuntime.soundManager.playTickSound();
            }
            // Play ambient sound every 15 seconds
            else if (timerData.timeRemaining % 15 === 1) {
                storyRuntime.soundManager.playAmbientSound();
            }

            if (timerData.timeRemaining > 1) {
                timerData.timeRemaining--;
                setRenderId((id) => id + 1);
                return;
            }
            // Swtich to next mode
            if (timerData.mode === `work`) {
                timerData.mode = `rest`;
                timerData.timeTotal = step.restDurationSec;
                timerData.timeRemaining = step.restDurationSec;
                setRenderId((id) => id + 1);

                await speakText(`Rest`, {});
                void storyRuntime.finishWorkoutSet({
                    setPhrase: exercisePhrase,
                    remainingSec: timerData.timeRemaining,
                    stepIndex,
                    stepPeriodIndex: 1,
                });
                // await storyRuntime.finishWorkoutSet(exercisePhrase, 0, `success`);
                return;
            }

            // Switch to next set (if not on last set)
            if (timerData.stepSetIndex + 1 < step.setCount) {
                timerData.stepSetIndex++;
                timerData.mode = `work`;
                timerData.timeTotal = step.workDurationSec;
                timerData.timeRemaining = step.workDurationSec;
                setRenderId((id) => id + 1);

                await speakText(`${exercisePhrase}`, {});
                void storyRuntime.startWorkoutSet({
                    setPhrase: exercisePhrase,
                    remainingSec: timerData.timeRemaining,
                    stepIndex,
                    stepPeriodIndex: 0,
                });
                return;
            }

            // Done
            clearInterval(interval);
            onDone();
            await speakText(`Done with step`);
            return;
        }, 1000);
        return () => clearInterval(interval);
    }, [onDone, step.exercises, step.restDurationSec, step.setCount, step.workDurationSec, stepIndex, storyRuntime]);

    const { mode, timeTotal, timeRemaining, stepSetIndex } = timerDataRef.current;

    return (
        <>
            <div
                className={`flex-1 flex flex-col p-2 m-6 items-center text-center ${
                    mode === `work` ? `bg-green-300` : `bg-red-300`
                } rounded ${isPaused && `bg-opacity-60`}`}
            >
                <div className={`m-6 text-2xl ${isPaused && `opacity-60`}`}>
                    {mode === `work` ? `Exercise!` : `Rest`}
                </div>
                <div className={`m-2 text-4xl ${isPaused && `opacity-60`}`}>
                    {stepSetIndex + 1} / {step.setCount}
                </div>
                <div className={`m-6 ${isPaused && `opacity-60`}`}>
                    <CircularPieTimer
                        timeTotal={timeTotal}
                        timeRemaining={timeRemaining}
                        progressColor={mode === `work` ? `#22c55e` : `#ef4444`}
                        trackColor={mode === `work` ? `#bbf7d0` : `#fecaca`}
                    />
                </div>
                <div className="flex flex-col items-center">
                    <button
                        className="items-center p-3 m-2 bg-blue-200 border-2 border-blue-500 rounded-full min-w-14 hover:opacity-80 active:opacity-70"
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
                                className={`m-4 px-8 text-lg bg-orange-200 border-2 border-orange-300 rounded ${
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
