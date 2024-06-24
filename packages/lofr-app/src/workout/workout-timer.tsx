import { WorkoutSession, WorkoutStep_Rest } from '@lofr/workout-parser';
import { useEffect, useState } from 'react';

export const WorkoutSessionTimer = ({ workoutSession }: { workoutSession: WorkoutSession }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const step = workoutSession.steps[stepIndex];
    const nextStep = () => {
        setStepIndex((index) => index + 1);
    };
    return (
        <>
            <div>
                <h1 className="m-6 text-2xl">Workout Session Timer</h1>
            </div>
            {!step && <div className="m-6 text-2xl">Workout Complete!</div>}
            {step?.kind === `rest` && <RestTimer step={step} onDone={nextStep} />}
        </>
    );
};

const RestTimer = ({ step, onDone }: { step: WorkoutStep_Rest; onDone: () => void }) => {
    const [timeRemaining, setTimeRemaining] = useState(step.durationSec);
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining((time) => {
                if (time <= 0) {
                    clearInterval(interval);
                    setTimeout(() => onDone());
                    return 0;
                }
                return time - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    return (
        <>
            <div className="m-6 text-2xl">Rest Timer</div>
            <div className="m-6 text-6xl">{timeRemaining}</div>
        </>
    );
};
