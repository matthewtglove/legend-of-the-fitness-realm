import { WorkoutProgram, WorkoutSession } from '@lofr/workout-parser';
import { useState } from 'react';
import { WorkoutLoader, WorkoutSelector } from './workout/workout-loader';
import { WorkoutSessionTimer } from './workout/workout-timer';

export const App = () => {
    const [workoutProgram, setWorkoutProgram] = useState(undefined as undefined | WorkoutProgram);
    const [workoutSession, setWorkoutSession] = useState(undefined as undefined | WorkoutSession);

    return (
        <>
            <div className="">
                <WorkoutLoader onWorkoutLoaded={setWorkoutProgram} />
                {workoutProgram && (
                    <WorkoutSelector workoutProgram={workoutProgram} onWorkoutSessionSelected={setWorkoutSession} />
                )}
                {workoutSession && <WorkoutSessionTimer workoutSession={workoutSession} />}
            </div>
        </>
    );
};
